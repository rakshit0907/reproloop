import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.types.js';
import { Project } from '../projects/project.entity.js';
import type { TransitionDto } from './dto/transition.dto.js';
import { IncidentEvent } from './incident-event.entity.js';
import { canManageIncident, canViewIncident } from './incident-access.js';
import {
  canTransition,
  canTransitionManually,
  visibleEvents,
} from './incident-workflow.js';
import { Incident } from './incident.entity.js';

@Injectable()
export class IncidentWorkflowService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Incident)
    private readonly incidents: Repository<Incident>,
    @InjectRepository(IncidentEvent)
    private readonly events: Repository<IncidentEvent>,
  ) {}

  async recordReceived(incident: Incident, user: JwtPayload): Promise<void> {
    await this.events.save(
      this.events.create({
        incidentId: incident.id,
        eventType: 'REPORT_RECEIVED',
        previousStatus: null,
        newStatus: 'RECEIVED',
        actor: `user:${user.sub}`,
        description: 'Report received',
        metadata: null,
      }),
    );
  }

  // Core move: validates the transition, updates status and writes the event.
  // Must run inside a transaction; later batches reuse it for patch actions.
  async apply(
    manager: EntityManager,
    incident: Incident,
    to: string,
    actor: string,
    description: string,
    metadata: Record<string, unknown> | null,
  ): Promise<void> {
    const previous = incident.status;
    if (!canTransition(previous, to)) {
      throw new ConflictException(`Cannot move from ${previous} to ${to}`);
    }
    incident.status = to;
    await manager.save(incident);
    await manager.save(
      manager.create(IncidentEvent, {
        incidentId: incident.id,
        eventType: 'STATUS_CHANGED',
        previousStatus: previous,
        newStatus: to,
        actor,
        description,
        metadata,
      }),
    );
  }

  async manualTransition(user: JwtPayload, id: string, dto: TransitionDto) {
    return this.dataSource.transaction(async (manager) => {
      const incident = await manager.findOne(Incident, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      const project = incident
        ? await manager.findOne(Project, { where: { id: incident.projectId } })
        : null;

      if (!incident || !project || !canManageIncident(user, project.ownerId)) {
        throw new NotFoundException('Incident not found');
      }
      if (!canTransitionManually(incident.status, dto.to)) {
        throw new ConflictException(
          `Cannot move from ${incident.status} to ${dto.to}`,
        );
      }

      const previous = incident.status;
      await this.apply(
        manager,
        incident,
        dto.to,
        `user:${user.sub}`,
        `Status changed from ${previous} to ${dto.to}`,
        dto.note?.trim() ? { note: dto.note.trim() } : null,
      );
      return {
        id: incident.id,
        previousStatus: previous,
        status: incident.status,
      };
    });
  }

  async listEvents(user: JwtPayload, id: string) {
    const incident = await this.incidents.findOne({
      where: { id },
      relations: { project: true },
    });
    if (
      !incident ||
      !canViewIncident(user, incident.reporterId, incident.project.ownerId)
    ) {
      throw new NotFoundException('Incident not found');
    }
    const events = await this.events.find({
      where: { incidentId: id },
      order: { createdAt: 'ASC' },
    });
    return visibleEvents(events, user.role !== 'REPORTER');
  }
}
