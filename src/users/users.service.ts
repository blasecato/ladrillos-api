import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toBigInt } from '../common/utils/serialize.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto/user.dto.js';
import {
  USER_INCLUDE,
  UserEntity,
  type UserWithRelations,
  toUserEntity,
} from './dto/user.entity.js';

const ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedDto<UserEntity>> {
    const where: Prisma.UserWhereInput = {
      ...(query.documentTypeId ? { documentTypeId: query.documentTypeId } : {}),
      ...(query.roleCode
        ? { userRoles: { some: { role: { code: query.roleCode } } } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { username: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { documentNumber: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: { [query.sortBy ?? 'id']: query.sortDir },
        include: USER_INCLUDE,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginar(rows.map(toUserEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<UserEntity> {
    return toUserEntity(await this.findRaw(id));
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const { password, roleIds, birthDate, ...campos } = dto;

    const user = await this.prisma.user.create({
      data: {
        ...campos,
        birthDate: new Date(birthDate),
        ...(password
          ? { passwordHash: await bcrypt.hash(password, ROUNDS) }
          : {}),
        ...(roleIds?.length
          ? { userRoles: { create: roleIds.map((roleId) => ({ roleId })) } }
          : {}),
      },
      include: USER_INCLUDE,
    });

    return toUserEntity(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findRaw(id);
    const { password, roleIds, birthDate, ...campos } = dto;

    const user = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        ...campos,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        ...(password
          ? { passwordHash: await bcrypt.hash(password, ROUNDS) }
          : {}),
        updatedAt: new Date(),
        ...(roleIds
          ? {
              userRoles: {
                deleteMany: {},
                create: roleIds.map((roleId) => ({ roleId })),
              },
            }
          : {}),
      },
      include: USER_INCLUDE,
    });

    return toUserEntity(user);
  }

  /** Reemplaza por completo los roles del usuario. */
  async setRoles(id: number, roleIds: number[]): Promise<UserEntity> {
    await this.findRaw(id);

    const user = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        userRoles: {
          deleteMany: {},
          create: roleIds.map((roleId) => ({ roleId })),
        },
        updatedAt: new Date(),
      },
      include: USER_INCLUDE,
    });

    return toUserEntity(user);
  }

  async remove(id: number): Promise<void> {
    await this.findRaw(id);
    await this.prisma.user.delete({ where: { id: toBigInt(id) } });
  }

  /**
   * Usuario con `passwordHash` incluido. Solo para `AuthService`: el login
   * acepta username o email.
   */
  findByIdentifier(identifier: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      include: USER_INCLUDE,
    });
  }

  private async findRaw(id: number): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
      include: USER_INCLUDE,
    });

    if (!user) {
      throw new NotFoundException(`No existe el usuario ${id}.`);
    }

    return user;
  }
}
