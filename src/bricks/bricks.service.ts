import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toAmount, toBigInt, toNumber } from '../common/utils/serialize.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BrickEntity,
  CreateBrickDto,
  QueryBricksDto,
  UpdateBrickDto,
} from './dto/brick.dto.js';

const INCLUDE = {
  category: { select: { name: true } },
  material: { select: { name: true } },
  inventory: { include: { brickYard: { select: { name: true } } } },
} as const;

type BrickConRelaciones = Prisma.BrickGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class BricksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBricksDto): Promise<PaginatedDto<BrickEntity>> {
    const where: Prisma.BrickWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.materialId ? { materialId: query.materialId } : {}),
      ...(query.brickYardId
        ? {
            inventory: {
              some: {
                brickYardId: toBigInt(query.brickYardId),
                quantity: { gt: 0 },
              },
            },
          }
        : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.brick.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: { [query.sortBy ?? 'id']: query.sortDir },
        include: INCLUDE,
      }),
      this.prisma.brick.count({ where }),
    ]);

    return paginar(rows.map(toEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<BrickEntity> {
    const brick = await this.prisma.brick.findUnique({
      where: { id: toBigInt(id) },
      include: INCLUDE,
    });

    if (!brick) {
      throw new NotFoundException(`No existe el ladrillo ${id}.`);
    }

    return toEntity(brick);
  }

  async create(dto: CreateBrickDto): Promise<BrickEntity> {
    return toEntity(
      await this.prisma.brick.create({ data: dto, include: INCLUDE }),
    );
  }

  async update(id: number, dto: UpdateBrickDto): Promise<BrickEntity> {
    await this.findOne(id);

    const brick = await this.prisma.brick.update({
      where: { id: toBigInt(id) },
      data: dto,
      include: INCLUDE,
    });

    return toEntity(brick);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.brick.delete({ where: { id: toBigInt(id) } });
  }
}

function toEntity(brick: BrickConRelaciones): BrickEntity {
  const stock = brick.inventory.map((fila) => ({
    brickYardId: toNumber(fila.brickYardId),
    brickYardName: fila.brickYard.name,
    quantity: fila.quantity,
  }));

  return {
    id: toNumber(brick.id),
    name: brick.name,
    categoryId: brick.categoryId,
    categoryName: brick.category?.name ?? null,
    materialId: brick.materialId,
    materialName: brick.material?.name ?? null,
    unitPrice: toAmount(brick.unitPrice),
    lengthMm: brick.lengthMm,
    widthMm: brick.widthMm,
    heightMm: brick.heightMm,
    photoKey: brick.photoKey,
    stock,
    totalStock: stock.reduce((total, fila) => total + fila.quantity, 0),
    createdAt: brick.createdAt,
  };
}
