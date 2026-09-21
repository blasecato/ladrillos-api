import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import { UserEntity, toUserEntity } from '../users/dto/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto, SessionDto } from './dto/auth.dto.js';
import type { JwtPayload } from './jwt-auth.guard.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<SessionDto> {
    const user = await this.users.findByIdentifier(dto.identifier);

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    return this.emitir(toUserEntity(user));
  }

  /** Alta publica: entra siempre con el rol `client`. */
  async register(dto: RegisterDto): Promise<SessionDto> {
    const client = await this.prisma.role.findUnique({
      where: { code: 'client' },
    });

    const user = await this.users.create({
      ...dto,
      roleIds: client ? [client.id] : [],
    });

    return this.emitir(user);
  }

  private emitir(user: UserEntity): SessionDto {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles.map((rol) => rol.code),
    };

    return { user, accessToken: this.jwt.sign(payload) };
  }
}
