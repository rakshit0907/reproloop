import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { JwtPayload, PublicUser } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;
const UNIQUE_VIOLATION = '23505';

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function errorCode(error: unknown): string | undefined {
  const e = error as { code?: string; driverError?: { code?: string } };
  return e.code ?? e.driverError?.code;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();

    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.users.create({
      name: dto.name.trim(),
      email,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role ?? 'REPORTER',
    });

    try {
      return toPublicUser(await this.users.save(user));
    } catch (error) {
      if (errorCode(error) === UNIQUE_VIOLATION) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.users.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    // Same message for unknown email and wrong password.
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: toPublicUser(user),
    };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }
}
