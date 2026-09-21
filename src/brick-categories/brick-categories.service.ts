import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  BrickCategoryEntity,
  CreateBrickCategoryDto,
  UpdateBrickCategoryDto,
} from './dto/brick-category.dto.js';

@Injectable()
export class BrickCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<BrickCategoryEntity[]> {
    return this.prisma.brickCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number): Promise<BrickCategoryEntity> {
    const category = await this.prisma.brickCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`No existe la categoria ${id}.`);
    }

    return category;
  }

  create(dto: CreateBrickCategoryDto): Promise<BrickCategoryEntity> {
    return this.prisma.brickCategory.create({ data: dto });
  }

  async update(
    id: number,
    dto: UpdateBrickCategoryDto,
  ): Promise<BrickCategoryEntity> {
    await this.findOne(id);
    return this.prisma.brickCategory.update({ where: { id }, data: dto });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.brickCategory.delete({ where: { id } });
  }
}
