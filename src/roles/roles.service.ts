import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoleDto, RoleEntity, UpdateRoleDto } from './dto/role.dto.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RoleEntity[]> {
    return this.prisma.role.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<RoleEntity> {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException(`No existe el rol ${id}.`);
    }

    return role;
  }

  create(dto: CreateRoleDto): Promise<RoleEntity> {
    return this.prisma.role.create({ data: dto });
  }

  async update(id: number, dto: UpdateRoleDto): Promise<RoleEntity> {
    await this.findOne(id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });
  }
}
