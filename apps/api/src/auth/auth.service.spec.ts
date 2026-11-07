import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { User } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';

function makeService() {
  const rows: User[] = [];
  const repo = {
    rows,
    findOne: async ({ where }: { where: { email?: string; id?: string } }) =>
      rows.find((r) =>
        where.email ? r.email === where.email : r.id === where.id,
      ) ?? null,
    create: (data: Partial<User>) => ({ ...data }) as User,
    save: async (user: User) => {
      user.id = `user-${rows.length + 1}`;
      user.createdAt = new Date();
      rows.push(user);
      return user;
    },
  };
  const jwt = {
    signAsync: async (payload: { sub: string }) => `token-for-${payload.sub}`,
  };
  return { repo, service: new AuthService(repo as never, jwt as never) };
}

const input = {
  name: 'Dev',
  email: 'Dev@Example.com',
  password: 'correct-horse-battery',
};

describe('AuthService', () => {
  it('stores a hashed password, normalizes email, and hides the hash', async () => {
    const { repo, service } = makeService();
    const user = await service.register(input);

    expect(user.email).toBe('dev@example.com');
    expect(user.role).toBe('REPORTER');
    expect(user).not.toHaveProperty('passwordHash');
    expect(repo.rows[0].passwordHash).not.toBe(input.password);
    expect(repo.rows[0].passwordHash.startsWith('$2')).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    const { service } = makeService();
    await service.register(input);
    await expect(service.register(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    const { service } = makeService();
    await service.register(input);

    await expect(
      service.login({ email: input.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'nobody@example.com', password: input.password }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a token and no password hash on valid login', async () => {
    const { service } = makeService();
    await service.register(input);
    const result = await service.login({
      email: 'DEV@example.com',
      password: input.password,
    });

    expect(result.accessToken).toBe('token-for-user-1');
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
