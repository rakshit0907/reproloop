import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.types.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import { Project } from './project.entity.js';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  repositoryUrl: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(p: Project): ProjectSummary {
  return { id: p.id, name: p.name, description: p.description };
}

function toDetail(p: Project): ProjectDetail {
  return {
    ...toSummary(p),
    repositoryUrl: p.repositoryUrl,
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const canManage = (user: JwtPayload) =>
  user.role === 'DEVELOPER' || user.role === 'ADMIN';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  async create(
    user: JwtPayload,
    dto: CreateProjectDto,
  ): Promise<ProjectDetail> {
    if (!canManage(user)) {
      throw new ForbiddenException('Only developers can create projects');
    }
    const project = this.projects.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      repositoryUrl: dto.repositoryUrl ?? null,
      ownerId: user.sub,
    });
    return toDetail(await this.projects.save(project));
  }

  async list(user: JwtPayload): Promise<Array<ProjectSummary | ProjectDetail>> {
    const order = { createdAt: 'DESC' as const };

    if (!canManage(user)) {
      return (await this.projects.find({ order })).map(toSummary);
    }
    const where = user.role === 'ADMIN' ? {} : { ownerId: user.sub };
    return (await this.projects.find({ where, order })).map(toDetail);
  }

  async get(
    user: JwtPayload,
    id: string,
  ): Promise<ProjectSummary | ProjectDetail> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (!canManage(user)) {
      return toSummary(project);
    }
    if (user.role !== 'ADMIN' && project.ownerId !== user.sub) {
      throw new NotFoundException('Project not found');
    }
    return toDetail(project);
  }
}
