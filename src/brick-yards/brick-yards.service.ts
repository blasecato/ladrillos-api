import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toBigInt, toNumber } from '../common/utils/serialize.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BrickYardEntity,
  CreateBrickYardDto,
  QueryBrickYardsDto,
  UpdateBrickYardDto,
} from './dto/brick-yard.dto.js';

const INCLUDE = {
  company: { select: { name: true, nit: true } },
  _count: { select: { inventory: true } },
  // Las existencias de una sede son pocas filas (una por referencia), asi que
  // se traen y se agregan en memoria: evita un groupBy extra por sede.
  inventory: {
    select: {
      quantity: true,
      brick: { select: { category: { select: { name: true } } } },
    },
  },
} as const;

type BrickYardConRelaciones = Prisma.BrickYardGetPayload<{
  include: typeof INCLUDE;
}>;

@Injectable()
export class BrickYardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryBrickYardsDto,
  ): Promise<PaginatedDto<BrickYardEntity>> {
    const where: Prisma.BrickYardWhereInput = {
      ...(query.companyId ? { companyId: toBigInt(query.companyId) } : {}),
      ...(query.city
        ? { city: { equals: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
              { department: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.brickYard.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: { [query.sortBy ?? 'id']: query.sortDir },
        include: INCLUDE,
      }),
      this.prisma.brickYard.count({ where }),
    ]);

    return paginar(rows.map(toEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<BrickYardEntity> {
    const brickYard = await this.prisma.brickYard.findUnique({
      where: { id: toBigInt(id) },
      include: INCLUDE,
    });

    if (!brickYard) {
      throw new NotFoundException(`No existe la sede ${id}.`);
    }

    return toEntity(brickYard);
  }

  async create(dto: CreateBrickYardDto): Promise<BrickYardEntity> {
    const { companyId, ...campos } = dto;

    const brickYard = await this.prisma.brickYard.create({
      data: {
        ...campos,
        ...(companyId ? { companyId: toBigInt(companyId) } : {}),
      },
      include: INCLUDE,
    });

    return toEntity(brickYard);
  }

  async update(id: number, dto: UpdateBrickYardDto): Promise<BrickYardEntity> {
    await this.findOne(id);
    const { companyId, ...campos } = dto;

    const brickYard = await this.prisma.brickYard.update({
      where: { id: toBigInt(id) },
      data: {
        ...campos,
        ...(companyId ? { companyId: toBigInt(companyId) } : {}),
      },
      include: INCLUDE,
    });

    return toEntity(brickYard);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.brickYard.delete({ where: { id: toBigInt(id) } });
  }
}

function toEntity(brickYard: BrickYardConRelaciones): BrickYardEntity {
  const { company, _count, inventory, ...campos } = brickYard;

  // Solo cuenta lo que hoy esta en piso: una fila en 0 no es una referencia
  // disponible ni aporta unidades.
  const conExistencias = inventory.filter((fila) => fila.quantity > 0);

  const categories = [
    ...new Set(
      conExistencias
        .map((fila) => fila.brick.category?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  return {
    ...campos,
    id: toNumber(brickYard.id),
    companyId:
      brickYard.companyId === null ? null : toNumber(brickYard.companyId),
    companyName: company?.name ?? null,
    companyNit: company?.nit ?? null,
    brickCount: _count.inventory,
    inStockCount: conExistencias.length,
    totalStock: conExistencias.reduce((acc, fila) => acc + fila.quantity, 0),
    categories,
  };
}
