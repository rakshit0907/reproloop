import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Project } from '../projects/project.entity.js';
import { IncidentEvent } from './incident-event.entity.js';
import { IncidentWorkflowService } from './incident-workflow.service.js';
import { Incident } from './incident.entity.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, Project, IncidentEvent]),
    AuthModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentWorkflowService],
})
export class IncidentsModule {}
