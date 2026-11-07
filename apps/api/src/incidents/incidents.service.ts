import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.types.js';
import { Project } from '../projects/project.entity.js';
import type { CreateIncidentDto } from './dto/create-incident.dto.js';
import type { ListIncidentsQueryDto } from './dto/list-incidents-query.dto.js';
import { Incident } from './incident.entity.js';

const isStaff = (user: JwtPayload) =>
  user.role === 'DEVELOPER' || user.role === 'ADMIN';

function toSummary(i: Incident, staff: boolean) {
  const base = {
    id: i.id,
    projectId: i.projectId,
    title: i.title,
    status: i.status,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
  return staff ? { ...base, severity: i.severity, category: i.category } : base;
}

function toDetail(i: Incident, staff: boolean) {
  const base = {
    ...toSummary(i, staff),
    description: i.description,
    expectedBehavior: i.expectedBehavior,
    actualBehavior: i.actualBehavior,
    reproductionSteps: i.reproductionSteps,
  };
  return staff ? { ...base, reporterId: i.reporterId } : base;
}

function canView(user: JwtPayload, incident: Incident): boolean {
  if (user.role === 'ADMIN') return true;
  if (incident.reporterId === user.sub) return true;
  return user.role === 'DEVELOPER' && incident.project.ownerId === user.sub;
}

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidents: Repository<Incident>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  async create(user: JwtPayload, dto: CreateIncidentDto) {
    const project = await this.projects.findOne({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const incident = this.incidents.create({
      projectId: project.id,
      reporterId: user.sub,
      title: dto.title.trim(),
      description: dto.description.trim(),
      expectedBehavior: dto.expectedBehavior?.trim() || null,
      actualBehavior: dto.actualBehavior?.trim() || null,
      reproductionSteps: dto.reproductionSteps?.trim() || null,
      status: 'RECEIVED',
    });
    return toDetail(await this.incidents.save(incident), isStaff(user));
  }

  async list(user: JwtPayload, query: ListIncidentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.incidents
      .createQueryBuilder('i')
      .innerJoin('i.project', 'p');

    if (user.role === 'REPORTER') {
      qb.where('i.reporterId = :uid', { uid: user.sub });
    } else if (user.role === 'DEVELOPER') {
      qb.where('(p.ownerId = :uid OR i.reporterId = :uid)', { uid: user.sub });
    } else {
      qb.where('1 = 1');
    }

    if (query.projectId) {
      qb.andWhere('i.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }
    if (query.q) {
      const escaped = query.q.replace(/[\\%_]/g, '\\$&');
      qb.andWhere('i.title ILIKE :q', { q: `%${escaped}%` });
    }

    const [rows, total] = await qb
      .orderBy('i.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const staff = isStaff(user);
    return {
      items: rows.map((row) => toSummary(row, staff)),
      total,
      page,
      limit,
    };
  }

  async get(user: JwtPayload, id: string) {
    const incident = await this.incidents.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!incident || !canView(user, incident)) {
      throw new NotFoundException('Incident not found');
    }
    return toDetail(incident, isStaff(user));
  }
}
