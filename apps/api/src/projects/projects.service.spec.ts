import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { JwtPayload } from '../auth/auth.types.js';
import type { Project } from './project.entity.js';
import { ProjectsService } from './projects.service.js';

const dev1: JwtPayload = { sub: 'dev-1', email: 'a@x.com', role: 'DEVELOPER' };
const dev2: JwtPayload = { sub: 'dev-2', email: 'b@x.com', role: 'DEVELOPER' };
const reporter: JwtPayload = {
  sub: 'rep-1',
  email: 'r@x.com',
  role: 'REPORTER',
};
const admin: JwtPayload = { sub: 'adm-1', email: 'm@x.com', role: 'ADMIN' };

function makeService() {
  const rows: Project[] = [];
  const repo = {
    create: (data: Partial<Project>) => ({ ...data }) as Project,
    save: async (p: Project) => {
      p.id = `proj-${rows.length + 1}`;
      p.createdAt = new Date();
      p.updatedAt = new Date();
      rows.push(p);
      return p;
    },
    find: async ({ where }: { where?: { ownerId?: string } } = {}) =>
      rows.filter((r) => !where?.ownerId || r.ownerId === where.ownerId),
    findOne: async ({ where }: { where: { id: string } }) =>
      rows.find((r) => r.id === where.id) ?? null,
  };
  return new ProjectsService(repo as never);
}

describe('ProjectsService', () => {
  it('lets a developer create a project they own', async () => {
    const service = makeService();
    const project = await service.create(dev1, {
      name: ' Demo ',
      repositoryUrl: 'https://github.com/a/b',
    });
    expect(project.name).toBe('Demo');
    expect(project.ownerId).toBe('dev-1');
  });

  it('forbids reporters from creating projects', async () => {
    await expect(
      makeService().create(reporter, { name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lists only the developer's own projects, and all for admin", async () => {
    const service = makeService();
    await service.create(dev1, { name: 'One' });
    await service.create(dev2, { name: 'Two' });

    expect(await service.list(dev1)).toHaveLength(1);
    expect(await service.list(admin)).toHaveLength(2);
  });

  it("hides another developer's project behind a 404", async () => {
    const service = makeService();
    const project = await service.create(dev1, { name: 'One' });
    await expect(service.get(dev2, project.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('gives reporters a minimal view without repository URL or owner', async () => {
    const service = makeService();
    const project = await service.create(dev1, {
      name: 'One',
      repositoryUrl: 'https://github.com/a/b',
    });
    const [listed] = await service.list(reporter);
    const fetched = await service.get(reporter, project.id);

    for (const view of [listed, fetched]) {
      expect(view).not.toHaveProperty('repositoryUrl');
      expect(view).not.toHaveProperty('ownerId');
    }
  });
});
