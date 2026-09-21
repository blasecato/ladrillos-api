import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateMaterialDto,
  MaterialEntity,
  UpdateMaterialDto,
} from './dto/material.dto.js';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<MaterialEntity[]> {
    return this.prisma.material.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number): Promise<MaterialEntity> {
    const material = await this.prisma.material.findUnique({ where: { id } });

    if (!material) {
      throw new NotFoundException(`No existe el material ${id}.`);
    }

    return material;
  }

  create(dto: CreateMaterialDto): Promise<MaterialEntity> {
    return this.prisma.material.create({ data: dto });
  }

  async update(id: number, dto: UpdateMaterialDto): Promise<MaterialEntity> {
    await this.findOne(id);
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.material.delete({ where: { id } });
  }
}
