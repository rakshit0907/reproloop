import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { IncidentEvent } from '../incidents/incident-event.entity.js';
import { Incident } from '../incidents/incident.entity.js';
import { IncidentsModule } from '../incidents/incidents.module.js';
import { Project } from '../projects/project.entity.js';
import { SandboxRunner } from '../verification/sandbox-runner.js';
import { PatchesController } from './patches.controller.js';
import { PatchesService } from './patches.service.js';
import { ProposedPatch } from './proposed-patch.entity.js';
import { VerificationRun } from './verification-run.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProposedPatch,
      VerificationRun,
      Incident,
      Project,
      IncidentEvent,
    ]),
    AuthModule,
    IncidentsModule,
  ],
  controllers: [PatchesController],
  providers: [PatchesService, SandboxRunner],
})
export class PatchesModule {}
