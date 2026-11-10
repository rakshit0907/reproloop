import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.types.js';
import { canManageIncident } from '../incidents/incident-access.js';
import { IncidentEvent } from '../incidents/incident-event.entity.js';
import { IncidentWorkflowService } from '../incidents/incident-workflow.service.js';
import { Incident } from '../incidents/incident.entity.js';
import { Project } from '../projects/project.entity.js';
import { analyzePatch } from '../verification/patch-policy.js';
import {
  SandboxRunner,
  type VerificationResult,
} from '../verification/sandbox-runner.js';
import type { RejectPatchDto } from './dto/reject-patch.dto.js';
import type { SubmitPatchDto } from './dto/submit-patch.dto.js';
import { ProposedPatch } from './proposed-patch.entity.js';
import { VerificationRun } from './verification-run.entity.js';

const REPOSITORY_LABEL = 'Bundled sample repository (demo app)';
const clean = (text: string) => text.replace(/\u0000/g, '');

@Injectable()
export class PatchesService {
  private readonly repoPath: string;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProposedPatch)
    private readonly patches: Repository<ProposedPatch>,
    @InjectRepository(VerificationRun)
    private readonly runs: Repository<VerificationRun>,
    @InjectRepository(Incident)
    private readonly incidents: Repository<Incident>,
    private readonly workflow: IncidentWorkflowService,
    private readonly runner: SandboxRunner,
    config: ConfigService,
  ) {
    this.repoPath =
      config.get<string>('SAMPLE_REPO_PATH') ??
      resolve(process.cwd(), '..', '..', 'sample-repository');
  }

  private async lockIncident(
    manager: EntityManager,
    user: JwtPayload,
    incidentId: string,
  ) {
    const incident = await manager.findOne(Incident, {
      where: { id: incidentId },
      lock: { mode: 'pessimistic_write' },
    });
    const project = incident
      ? await manager.findOne(Project, { where: { id: incident.projectId } })
      : null;
    if (!incident || !project || !canManageIncident(user, project.ownerId)) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  private toView(patch: ProposedPatch, runs: VerificationRun[]) {
    return {
      id: patch.id,
      incidentId: patch.incidentId,
      status: patch.status,
      source: patch.source,
      explanation: patch.explanation,
      affectedFiles: patch.affectedFiles,
      patchContent: patch.patchContent,
      createdAt: patch.createdAt,
      verification: [...runs]
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          command: r.command,
          exitCode: r.exitCode,
          testsRun: r.testsRun,
          testsFailed: r.testsFailed,
          durationMs: r.durationMs,
          repository: r.repository,
          stdout: r.stdout,
          stderr: r.stderr,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
        })),
    };
  }

  async list(user: JwtPayload, incidentId: string) {
    const incident = await this.incidents.findOne({
      where: { id: incidentId },
      relations: { project: true },
    });
    if (!incident || !canManageIncident(user, incident.project.ownerId)) {
      throw new NotFoundException('Incident not found');
    }
    const patches = await this.patches.find({
      where: { incidentId },
      order: { createdAt: 'DESC' },
    });
    const runs = patches.length
      ? await this.runs.find({
          where: { patchId: In(patches.map((p) => p.id)) },
        })
      : [];
    return patches.map((p) =>
      this.toView(
        p,
        runs.filter((r) => r.patchId === p.id),
      ),
    );
  }

  async submit(user: JwtPayload, incidentId: string, dto: SubmitPatchDto) {
    const analysis = analyzePatch(dto.patch);
    if (!analysis.ok) {
      throw new BadRequestException(
        `Patch rejected: ${analysis.reasons.join('; ')}`,
      );
    }
    if (!analysis.addsTestFile) {
      throw new BadRequestException(
        'Patch must add a new regression test file under test/',
      );
    }
    const actor = `user:${user.sub}`;

    return this.dataSource.transaction(async (manager) => {
      const incident = await this.lockIncident(manager, user, incidentId);
      const previous = incident.status;
      if (
        !['DIAGNOSIS', 'VERIFICATION_FAILED', 'PATCH_GENERATION'].includes(
          previous,
        )
      ) {
        throw new ConflictException(
          `Cannot submit a patch while the incident is ${previous}`,
        );
      }

      await manager.update(
        ProposedPatch,
        { incidentId, status: 'SUBMITTED' },
        { status: 'SUPERSEDED' },
      );
      const patch = await manager.save(
        manager.create(ProposedPatch, {
          incidentId,
          submittedBy: actor,
          patchContent: dto.patch,
          explanation: dto.explanation?.trim() || null,
          affectedFiles: analysis.files,
          source: 'DEVELOPER_SUBMITTED',
          status: 'SUBMITTED',
        }),
      );
      await manager.save(
        manager.create(IncidentEvent, {
          incidentId,
          eventType: 'PATCH_SUBMITTED',
          previousStatus: null,
          newStatus: null,
          actor,
          description: 'Developer submitted a patch (not yet verified)',
          metadata: { patchId: patch.id, files: analysis.files },
        }),
      );
      if (previous !== 'PATCH_GENERATION') {
        await this.workflow.apply(
          manager,
          incident,
          'PATCH_GENERATION',
          actor,
          'Patch submitted',
          {
            patchId: patch.id,
          },
        );
      }
      return this.toView(patch, []);
    });
  }

  async verify(user: JwtPayload, patchId: string) {
    const found = await this.patches.findOne({ where: { id: patchId } });
    if (!found) throw new NotFoundException('Patch not found');
    const actor = `user:${user.sub}`;
    const startedAt = new Date();

    // Phase 1: lock the incident and mark it VERIFICATION so a second click is rejected.
    const patch = await this.dataSource.transaction(async (manager) => {
      const incident = await this.lockIncident(manager, user, found.incidentId);
      const current = await manager.findOne(ProposedPatch, {
        where: { id: patchId },
      });
      if (!current || current.status !== 'SUBMITTED') {
        throw new ConflictException(
          'Only the current submitted patch can be verified',
        );
      }
      if (incident.status !== 'PATCH_GENERATION') {
        throw new ConflictException(
          `Cannot verify while the incident is ${incident.status}`,
        );
      }
      await this.workflow.apply(
        manager,
        incident,
        'VERIFICATION',
        actor,
        'Verification started',
        {
          patchId,
        },
      );
      return current;
    });

    // Phase 2: the real test run (outside any transaction, can take up to a minute).
    let result: VerificationResult;
    try {
      result = await this.runner.run({
        repoPath: this.repoPath,
        patch: patch.patchContent,
        requireRegressionTest: true,
      });
    } catch {
      result = {
        status: 'INCONCLUSIVE',
        reason: 'Internal error while running verification',
        command: '',
        exitCode: null,
        stdout: '',
        stderr: '',
        testsRun: null,
        testsFailed: null,
        durationMs: Date.now() - startedAt.getTime(),
      };
    }

    // Phase 3: persist the real result and move the incident accordingly.
    return this.dataSource.transaction(async (manager) => {
      const incident = await this.lockIncident(manager, user, patch.incidentId);
      const run = await manager.save(
        manager.create(VerificationRun, {
          patchId: patch.id,
          status: result.status,
          reason: clean(result.reason),
          command: result.command,
          exitCode: result.exitCode,
          stdout: clean(result.stdout),
          stderr: clean(result.stderr),
          testsRun: result.testsRun,
          testsFailed: result.testsFailed,
          durationMs: result.durationMs,
          repository: REPOSITORY_LABEL,
          startedAt,
          completedAt: new Date(),
        }),
      );
      await manager.save(
        manager.create(IncidentEvent, {
          incidentId: incident.id,
          eventType: 'VERIFICATION_RUN',
          previousStatus: null,
          newStatus: null,
          actor: 'system:verification',
          description: `Verification ${result.status}: ${clean(result.reason)}`,
          metadata: {
            runId: run.id,
            status: result.status,
            exitCode: result.exitCode,
            testsRun: result.testsRun,
            testsFailed: result.testsFailed,
            repository: REPOSITORY_LABEL,
          },
        }),
      );

      if (result.status === 'PASSED') {
        await this.workflow.apply(
          manager,
          incident,
          'AWAITING_APPROVAL',
          'system:verification',
          'Verification passed; awaiting developer approval',
          { runId: run.id },
        );
      } else if (result.status === 'FAILED') {
        await this.workflow.apply(
          manager,
          incident,
          'VERIFICATION_FAILED',
          'system:verification',
          'Verification failed',
          { runId: run.id },
        );
      } else {
        await this.workflow.apply(
          manager,
          incident,
          'PATCH_GENERATION',
          'system:verification',
          `Verification ${result.status}; the patch can be verified again`,
          { runId: run.id },
        );
      }
      return this.toView(patch, [run]);
    });
  }

  async approve(user: JwtPayload, patchId: string) {
    const actor = `user:${user.sub}`;
    return this.dataSource.transaction(async (manager) => {
      const patch = await manager.findOne(ProposedPatch, {
        where: { id: patchId },
      });
      if (!patch) throw new NotFoundException('Patch not found');
      const incident = await this.lockIncident(manager, user, patch.incidentId);

      if (
        incident.status !== 'AWAITING_APPROVAL' ||
        patch.status !== 'SUBMITTED'
      ) {
        throw new ConflictException('This patch is not awaiting approval');
      }
      const latest = await manager.findOne(VerificationRun, {
        where: { patchId },
        order: { startedAt: 'DESC' },
      });
      if (!latest || latest.status !== 'PASSED') {
        throw new ConflictException(
          'Only a patch whose latest verification run PASSED can be approved',
        );
      }

      patch.status = 'APPROVED';
      await manager.save(patch);
      await manager.save(
        manager.create(IncidentEvent, {
          incidentId: incident.id,
          eventType: 'PATCH_APPROVED',
          previousStatus: null,
          newStatus: null,
          actor,
          description: 'Developer approved the verified patch',
          metadata: { patchId, runId: latest.id },
        }),
      );
      await this.workflow.apply(
        manager,
        incident,
        'RESOLVED',
        actor,
        'Developer approved the fix',
        {
          patchId,
        },
      );
      return {
        id: patch.id,
        status: patch.status,
        incidentStatus: incident.status,
      };
    });
  }

  async reject(user: JwtPayload, patchId: string, dto: RejectPatchDto) {
    const actor = `user:${user.sub}`;
    return this.dataSource.transaction(async (manager) => {
      const patch = await manager.findOne(ProposedPatch, {
        where: { id: patchId },
      });
      if (!patch) throw new NotFoundException('Patch not found');
      const incident = await this.lockIncident(manager, user, patch.incidentId);

      if (
        incident.status !== 'AWAITING_APPROVAL' ||
        patch.status !== 'SUBMITTED'
      ) {
        throw new ConflictException('This patch is not awaiting a decision');
      }
      patch.status = 'REJECTED';
      await manager.save(patch);
      await manager.save(
        manager.create(IncidentEvent, {
          incidentId: incident.id,
          eventType: 'PATCH_REJECTED',
          previousStatus: null,
          newStatus: null,
          actor,
          description: 'Developer rejected the patch',
          metadata: { patchId, note: dto.note.trim() },
        }),
      );
      await this.workflow.apply(
        manager,
        incident,
        'DIAGNOSIS',
        actor,
        'Patch rejected; back to diagnosis',
        {
          patchId,
        },
      );
      return {
        id: patch.id,
        status: patch.status,
        incidentStatus: incident.status,
      };
    });
  }
}
