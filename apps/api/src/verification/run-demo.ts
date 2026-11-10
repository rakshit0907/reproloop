import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { SandboxRunner } from './sandbox-runner.js';

const repoPath = resolve('../../sample-repository');
const demoDir = resolve('../../demo');
const runner = new SandboxRunner();

const cases = [
  { name: 'Baseline (no patch)', file: undefined, requireTest: false },
  {
    name: 'Regression test only, no fix',
    file: 'test-only.patch',
    requireTest: true,
  },
  {
    name: 'Fix plus regression test',
    file: 'fix-with-test.patch',
    requireTest: true,
  },
];

for (const item of cases) {
  const patch = item.file
    ? await readFile(join(demoDir, item.file), 'utf8')
    : undefined;
  const result = await runner.run({
    repoPath,
    patch,
    requireRegressionTest: item.requireTest,
  });
  console.log(
    `${item.name}: ${result.status} | exit ${result.exitCode} | tests ${result.testsRun} | failed ${result.testsFailed} | ${result.durationMs} ms`,
  );
  console.log(`  ${result.reason}`);
}
