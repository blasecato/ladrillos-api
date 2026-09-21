import { BadRequestException, Injectable } from '@nestjs/common';

import { LOW_STOCK_THRESHOLD } from '../common/constants/domain.js';
import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toBigInt, toNumber } from '../common/utils/serialize.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateMovementDto,
  InventoryEntity,
  InventoryMatrixDto,
  InventoryMovementEntity,
  QueryInventoryDto,
  QueryMovementsDto,
  SetInventoryDto,
} from './dto/inventory.dto.js';

const INVENTORY_INCLUDE = {
  brickYard: { select: { name: true } },
  brick: { select: { name: true } },
} as const;

const MOVEMENT_INCLUDE = INVENTORY_INCLUDE;

type InventoryConRelaciones = Prisma.InventoryGetPayload<{
  include: typeof INVENTORY_INCLUDE;
}>;
type MovementConRelaciones = Prisma.InventoryMovementGetPayload<{
  include: typeof MOVEMENT_INCLUDE;
}>;

/** Un movimiento aplicado dentro de una transaccion. */
export interface MovementInput {
  brickYardId: number;
  brickId: number;
  change: number;
  reason: string;
  orderId?: number | null;
  createdBy?: number | null;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryInventoryDto,
  ): Promise<PaginatedDto<InventoryEntity>> {
    const where: Prisma.InventoryWhereInput = {
      ...(query.brickYardId
        ? { brickYardId: toBigInt(query.brickYardId) }
        : {}),
      ...(query.brickId ? { brickId: toBigInt(query.brickId) } : {}),
      ...(query.lowStock ? { quantity: { lt: LOW_STOCK_THRESHOLD } } : {}),
      ...(query.search
        ? { brick: { name: { contains: query.search, mode: 'insensitive' } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: { [query.sortBy ?? 'brickYardId']: query.sortDir },
        include: INVENTORY_INCLUDE,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return paginar(
      rows.map(toInventoryEntity),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** Matriz ladrillo x sede. */
  async matrix(brickYardId?: number): Promise<InventoryMatrixDto> {
    const [brickYards, bricks] = await Promise.all([
      this.prisma.brickYard.findMany({
        where: brickYardId ? { id: toBigInt(brickYardId) } : {},
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.brick.findMany({
        orderBy: { id: 'asc' },
        include: { category: { select: { name: true } }, inventory: true },
      }),
    ]);

    const rows = bricks.map((brick) => {
      const cells = brickYards.map((yard) => {
        const quantity =
          brick.inventory.find((fila) => fila.brickYardId === yard.id)
            ?.quantity ?? 0;

        return {
          brickYardId: toNumber(yard.id),
          brickYardName: yard.name,
          quantity,
          lowStock: quantity < LOW_STOCK_THRESHOLD,
        };
      });

      return {
        brickId: toNumber(brick.id),
        brickName: brick.name,
        categoryName: brick.category?.name ?? null,
        cells,
        total: cells.reduce((acc, cell) => acc + cell.quantity, 0),
      };
    });

    return {
      brickYards: brickYards.map((yard) => yard.name),
      rows,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    };
  }

  /** Fija el valor absoluto de una celda y deja el ajuste en el libro. */
  async setQuantity(
    dto: SetInventoryDto,
    userId?: number,
  ): Promise<InventoryEntity> {
    const actual = await this.prisma.inventory.findUnique({
      where: {
        brickYardId_brickId: {
          brickYardId: toBigInt(dto.brickYardId),
          brickId: toBigInt(dto.brickId),
        },
      },
    });

    const change = dto.quantity - (actual?.quantity ?? 0);

    if (change === 0) {
      return this.findCell(dto.brickYardId, dto.brickId);
    }

    return this.applyMovement({
      ...dto,
      change,
      reason: 'adjustment',
      createdBy: userId,
    });
  }

  /**
   * Suma un delta a la celda y registra el movimiento. Todo en una transaccion:
   * el inventario y su libro no pueden quedar desalineados.
   */
  async applyMovement(input: MovementInput): Promise<InventoryEntity> {
    const brickYardId = toBigInt(input.brickYardId);
    const brickId = toBigInt(input.brickId);

    return this.prisma.$transaction(async (tx) => {
      const actual = await tx.inventory.findUnique({
        where: { brickYardId_brickId: { brickYardId, brickId } },
      });

      const quantity = (actual?.quantity ?? 0) + input.change;

      if (quantity < 0) {
        throw new BadRequestException(
          `Existencias insuficientes: hay ${actual?.quantity ?? 0} y se piden ${-input.change}.`,
        );
      }

      const fila = await tx.inventory.upsert({
        where: { brickYardId_brickId: { brickYardId, brickId } },
        create: { brickYardId, brickId, quantity },
        update: { quantity, updatedAt: new Date() },
        include: INVENTORY_INCLUDE,
      });

      await tx.inventoryMovement.create({
        data: {
          brickYardId,
          brickId,
          change: input.change,
          reason: input.reason,
          ...(input.orderId ? { orderId: toBigInt(input.orderId) } : {}),
          ...(input.createdBy ? { createdBy: toBigInt(input.createdBy) } : {}),
        },
      });

      return toInventoryEntity(fila);
    });
  }

  createMovement(
    dto: CreateMovementDto,
    userId?: number,
  ): Promise<InventoryEntity> {
    return this.applyMovement({ ...dto, createdBy: userId });
  }

  async findMovements(
    query: QueryMovementsDto,
  ): Promise<PaginatedDto<InventoryMovementEntity>> {
    const where: Prisma.InventoryMovementWhereInput = {
      ...(query.brickYardId
        ? { brickYardId: toBigInt(query.brickYardId) }
        : {}),
      ...(query.brickId ? { brickId: toBigInt(query.brickId) } : {}),
      ...(query.reason ? { reason: query.reason } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: {
          [query.sortBy ?? 'createdAt']:
            query.sortDir === 'asc' ? 'asc' : 'desc',
        },
        include: MOVEMENT_INCLUDE,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return paginar(
      rows.map(toMovementEntity),
      total,
      query.page,
      query.pageSize,
    );
  }

  private async findCell(
    brickYardId: number,
    brickId: number,
  ): Promise<InventoryEntity> {
    const fila = await this.prisma.inventory.findUniqueOrThrow({
      where: {
        brickYardId_brickId: {
          brickYardId: toBigInt(brickYardId),
          brickId: toBigInt(brickId),
        },
      },
      include: INVENTORY_INCLUDE,
    });

    return toInventoryEntity(fila);
  }
}

function toInventoryEntity(fila: InventoryConRelaciones): InventoryEntity {
  return {
    brickYardId: toNumber(fila.brickYardId),
    brickYardName: fila.brickYard.name,
    brickId: toNumber(fila.brickId),
    brickName: fila.brick.name,
    quantity: fila.quantity,
    lowStock: fila.quantity < LOW_STOCK_THRESHOLD,
    updatedAt: fila.updatedAt,
  };
}

function toMovementEntity(
  movimiento: MovementConRelaciones,
): InventoryMovementEntity {
  return {
    id: toNumber(movimiento.id),
    brickYardId: toNumber(movimiento.brickYardId),
    brickYardName: movimiento.brickYard.name,
    brickId: toNumber(movimiento.brickId),
    brickName: movimiento.brick.name,
    change: movimiento.change,
    reason: movimiento.reason,
    orderId: movimiento.orderId === null ? null : toNumber(movimiento.orderId),
    createdBy:
      movimiento.createdBy === null ? null : toNumber(movimiento.createdBy),
    createdAt: movimiento.createdAt,
  };
}
