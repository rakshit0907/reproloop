import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { JwtPayload } from '../auth/auth.types.js';
import type { Incident } from './incident.entity.js';
import { IncidentsService } from './incidents.service.js';

const owner: JwtPayload = { sub: 'dev-1', email: 'a@x.com', role: 'DEVELOPER' };
const otherDev: JwtPayload = {
  sub: 'dev-2',
  email: 'b@x.com',
  role: 'DEVELOPER',
};
const reporter: JwtPayload = {
  sub: 'rep-1',
  email: 'r@x.com',
  role: 'REPORTER',
};
const otherReporter: JwtPayload = {
  sub: 'rep-2',
  email: 's@x.com',
  role: 'REPORTER',
};
const admin: JwtPayload = { sub: 'adm-1', email: 'm@x.com', role: 'ADMIN' };

function makeService() {
  const projects = [{ id: 'proj-1', ownerId: 'dev-1' }];
  const rows: Incident[] = [];
  const incidentRepo = {
    create: (data: Partial<Incident>) => ({ ...data }) as Incident,
    save: async (i: Incident) => {
      i.id = `inc-${rows.length + 1}`;
      i.severity = null;
      i.category = null;
      i.createdAt = new Date();
      i.updatedAt = new Date();
      rows.push(i);
      return i;
    },
    findOne: async ({ where }: { where: { id: string } }) => {
      const row = rows.find((r) => r.id === where.id);
      return row
        ? ({
            ...row,
            project: projects.find((p) => p.id === row.projectId),
          } as Incident)
        : null;
    },
  };
  const projectRepo = {
    findOne: async ({ where }: { where: { id: string } }) =>
      projects.find((p) => p.id === where.id) ?? null,
  };
  return new IncidentsService(incidentRepo as never, projectRepo as never);
}

const report = {
  projectId: 'proj-1',
  title: ' Login button does nothing ',
  description: 'I click Login and nothing happens',
};

describe('IncidentsService', () => {
  it('creates an incident as RECEIVED with the reporter taken from the token', async () => {
    const created = await makeService().create(reporter, report);
    expect(created.status).toBe('RECEIVED');
    expect(created.title).toBe('Login button does nothing');
  });

  it('rejects an incident for a project that does not exist', async () => {
    await expect(
      makeService().create(reporter, { ...report, projectId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets reporters see only their own incident, without internal fields', async () => {
    const service = makeService();
    const created = await service.create(reporter, report);

    const view = await service.get(reporter, created.id);
    expect(view).not.toHaveProperty('severity');
    expect(view).not.toHaveProperty('category');
    expect(view).not.toHaveProperty('reporterId');

    await expect(service.get(otherReporter, created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets the project owner and admins see it, but hides it from other developers', async () => {
    const service = makeService();
    const created = await service.create(reporter, report);

    expect(await service.get(owner, created.id)).toHaveProperty(
      'reporterId',
      'rep-1',
    );
    expect(await service.get(admin, created.id)).toHaveProperty(
      'id',
      created.id,
    );
    await expect(service.get(otherDev, created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
