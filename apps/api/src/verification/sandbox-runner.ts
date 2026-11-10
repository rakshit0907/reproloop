import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { parseTestSummary } from './output-parser.js';
import { analyzePatch } from './patch-policy.js';

export type VerificationStatus =
  'PASSED' | 'FAILED' | 'INCONCLUSIVE' | 'NOT_RUN';

export interface VerificationResult {
  status: VerificationStatus;
  reason: string;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  testsRun: number | null;
  testsFailed: number | null;
  durationMs: number;
}

export interface RunOptions {
  repoPath: string;
  patch?: string;
  requireRegressionTest: boolean;
}

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  spawnError?: string;
}

const IMAGE = 'node:24-slim';
const COMMAND = ['node', '--test'];
const TIMEOUT_MS = 60_000;
const MAX_OUTPUT = 20_000;
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.txt',
]);

function runProcess(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs: number; onTimeout?: () => void },
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const child = spawn(command, args, { cwd: options.cwd, windowsHide: true });
    const timer = setTimeout(() => {
      timedOut = true;
      options.onTimeout?.();
      child.kill();
    }, options.timeoutMs);

    const finish = (result: ProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    child.stdout.on('data', (chunk: Buffer) => {
      stdout = (stdout + chunk.toString()).slice(-MAX_OUTPUT);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-MAX_OUTPUT);
    });
    child.on('error', (error) =>
      finish({
        code: null,
        stdout,
        stderr,
        timedOut,
        spawnError: error.message,
      }),
    );
    child.on('close', (code) => finish({ code, stdout, stderr, timedOut }));
  });
}

// Converts CRLF to LF in text files and returns any symbolic links found.
async function prepareWorkspace(dir: string): Promise<string[]> {
  const symlinks: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      symlinks.push(path);
    } else if (entry.isDirectory()) {
      symlinks.push(...(await prepareWorkspace(path)));
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) {
      const text = await readFile(path, 'utf8');
      const normalized = text.replace(/\r\n/g, '\n');
      if (normalized !== text) await writeFile(path, normalized);
    }
  }
  return symlinks;
}

@Injectable()
export class SandboxRunner {
  async run(options: RunOptions): Promise<VerificationResult> {
    const started = Date.now();
    const done = (
      status: VerificationStatus,
      reason: string,
      extra: Partial<VerificationResult> = {},
    ): VerificationResult => ({
      status,
      reason,
      command: COMMAND.join(' '),
      exitCode: null,
      stdout: '',
      stderr: '',
      testsRun: null,
      testsFailed: null,
      ...extra,
      durationMs: Date.now() - started,
    });

    const workdir = await mkdtemp(join(tmpdir(), 'reproloop-verify-'));
    try {
      const repoDir = join(workdir, 'repo');
      await cp(options.repoPath, repoDir, {
        recursive: true,
        filter: (source) => {
          const name = basename(source);
          return name !== 'node_modules' && name !== '.git';
        },
      });

      if ((await prepareWorkspace(repoDir)).length > 0) {
        return done(
          'NOT_RUN',
          'Workspace contains symbolic links, which are not allowed',
        );
      }

      if (options.patch !== undefined) {
        const analysis = analyzePatch(options.patch);
        if (!analysis.ok) {
          return done(
            'NOT_RUN',
            `Patch rejected: ${analysis.reasons.join('; ')}`,
          );
        }
        if (options.requireRegressionTest && !analysis.addsTestFile) {
          return done(
            'NOT_RUN',
            'Patch must add a new regression test file under test/',
          );
        }

        const patchFile = join(workdir, 'change.patch');
        const text = options.patch.replace(/\r\n/g, '\n');
        await writeFile(patchFile, text.endsWith('\n') ? text : `${text}\n`);

        const applied = await runProcess(
          'git',
          ['apply', '--ignore-whitespace', patchFile],
          {
            cwd: repoDir,
            timeoutMs: 15_000,
          },
        );
        if (applied.spawnError) {
          return done(
            'INCONCLUSIVE',
            `Could not run git: ${applied.spawnError}`,
          );
        }
        if (applied.code !== 0) {
          return done(
            'NOT_RUN',
            `Patch did not apply cleanly: ${applied.stderr.trim()}`,
            {
              stderr: applied.stderr,
            },
          );
        }
        if ((await prepareWorkspace(repoDir)).length > 0) {
          return done(
            'NOT_RUN',
            'Patch created symbolic links, which are not allowed',
          );
        }
      } else if (options.requireRegressionTest) {
        return done('NOT_RUN', 'No patch was supplied');
      }

      const name = `reproloop-verify-${randomUUID()}`;
      const result = await runProcess(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          name,
          '--network',
          'none',
          '--memory',
          '256m',
          '--memory-swap',
          '256m',
          '--cpus',
          '1',
          '--pids-limit',
          '128',
          '--cap-drop',
          'ALL',
          '--security-opt',
          'no-new-privileges',
          '--read-only',
          '--tmpfs',
          '/tmp:rw,size=64m',
          '--user',
          'node',
          '--mount',
          `type=bind,source=${repoDir},target=/work,readonly`,
          '-w',
          '/work',
          IMAGE,
          ...COMMAND,
        ],
        {
          timeoutMs: TIMEOUT_MS,
          onTimeout: () => {
            spawn('docker', ['rm', '-f', name], { windowsHide: true });
          },
        },
      );

      const summary = parseTestSummary(`${result.stdout}\n${result.stderr}`);
      const output = {
        exitCode: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        testsRun: summary.tests,
        testsFailed: summary.failed,
      };

      if (result.spawnError) {
        return done(
          'INCONCLUSIVE',
          `Could not start Docker: ${result.spawnError}`,
          output,
        );
      }
      if (result.timedOut) {
        return done(
          'INCONCLUSIVE',
          `Test run exceeded ${TIMEOUT_MS / 1000}s and was stopped`,
          output,
        );
      }
      if (result.code === 0) {
        if ((summary.tests ?? 0) > 0 && summary.failed === 0) {
          return done(
            'PASSED',
            'All tests passed in an isolated container',
            output,
          );
        }
        return done(
          'INCONCLUSIVE',
          'Exit code 0, but no passing test summary could be read',
          output,
        );
      }
      if ((summary.failed ?? 0) > 0) {
        return done('FAILED', `${summary.failed} test(s) failed`, output);
      }
      return done(
        'INCONCLUSIVE',
        `Container exited with code ${result.code} without a test summary (is Docker running?)`,
        output,
      );
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }
  }
}
