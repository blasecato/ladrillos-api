import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toAmount, toBigInt, toNumber } from '../common/utils/serialize.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateWasteDto,
  QueryWasteDto,
  WasteEntity,
  WasteReasonEntity,
  WasteSummaryDto,
  WasteSummaryRowDto,
} from './dto/waste.dto.js';

const INCLUDE = {
  brickYard: { select: { name: true } },
  brick: { select: { name: true } },
  reason: { select: { code: true, name: true } },
  creator: { select: { fullName: true } },
} as const;

type WasteConRelaciones = Prisma.BrickWasteGetPayload<{
  include: typeof INCLUDE;
}>;

@Injectable()
export class WasteService {
  constructor(private readonly prisma: PrismaService) {}

  findReasons(): Promise<WasteReasonEntity[]> {
    return this.prisma.wasteReason.findMany({ orderBy: { id: 'asc' } });
  }

  async findAll(query: QueryWasteDto): Promise<PaginatedDto<WasteEntity>> {
    const where = construirWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.brickWaste.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: {
          [query.sortBy ?? 'occurredAt']:
            query.sortDir === 'asc' ? 'asc' : 'desc',
        },
        include: INCLUDE,
      }),
      this.prisma.brickWaste.count({ where }),
    ]);

    return paginar(rows.map(toEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<WasteEntity> {
    const merma = await this.prisma.brickWaste.findUnique({
      where: { id: toBigInt(id) },
      include: INCLUDE,
    });

    if (!merma) {
      throw new NotFoundException(`No existe la merma ${id}.`);
    }

    return toEntity(merma);
  }

  /**
   * Registra la merma y descuenta las existencias en la misma transaccion: el
   * movimiento (`reason='waste'`) queda enlazado, asi que el libro de
   * inventario y la merma nunca se separan. El precio se congela aqui para
   * poder valorar la perdida aunque el ladrillo cambie de precio despues.
   */
  async create(dto: CreateWasteDto, createdBy?: number): Promise<WasteEntity> {
    const brickYardId = toBigInt(dto.brickYardId);
    const brickId = toBigInt(dto.brickId);

    const merma = await this.prisma.$transaction(async (tx) => {
      const brick = await tx.brick.findUnique({ where: { id: brickId } });

      if (!brick) {
        throw new NotFoundException(`No existe el ladrillo ${dto.brickId}.`);
      }

      const reason = await tx.wasteReason.findUnique({
        where: { id: dto.reasonId },
      });

      if (!reason) {
        throw new NotFoundException(
          `No existe el motivo de merma ${dto.reasonId}.`,
        );
      }

      const existencias = await tx.inventory.findUnique({
        where: { brickYardId_brickId: { brickYardId, brickId } },
      });

      const quantity = (existencias?.quantity ?? 0) - dto.quantity;

      if (quantity < 0) {
        throw new BadRequestException(
          `Existencias insuficientes de "${brick.name}" en la sede ${dto.brickYardId}: ` +
            `hay ${existencias?.quantity ?? 0} y se reportan ${dto.quantity} danados.`,
        );
      }

      await tx.inventory.update({
        where: { brickYardId_brickId: { brickYardId, brickId } },
        data: { quantity, updatedAt: new Date() },
      });

      const movimiento = await tx.inventoryMovement.create({
        data: {
          brickYardId,
          brickId,
          change: -dto.quantity,
          reason: 'waste',
          ...(dto.orderId ? { orderId: toBigInt(dto.orderId) } : {}),
          ...(createdBy ? { createdBy: toBigInt(createdBy) } : {}),
        },
      });

      return tx.brickWaste.create({
        data: {
          brickYardId,
          brickId,
          quantity: dto.quantity,
          reasonId: dto.reasonId,
          ...(dto.notes ? { notes: dto.notes } : {}),
          ...(dto.orderId ? { orderId: toBigInt(dto.orderId) } : {}),
          movementId: movimiento.id,
          unitPrice: brick.unitPrice,
          ...(dto.occurredAt ? { occurredAt: new Date(dto.occurredAt) } : {}),
          ...(createdBy ? { createdBy: toBigInt(createdBy) } : {}),
        },
        include: INCLUDE,
      });
    });

    return toEntity(merma);
  }

  /**
   * Anula una merma mal registrada: devuelve los ladrillos al inventario y deja
   * el ajuste en el libro. El movimiento original se conserva como historial.
   */
  async remove(id: number, createdBy?: number): Promise<void> {
    const merma = await this.prisma.brickWaste.findUnique({
      where: { id: toBigInt(id) },
    });

    if (!merma) {
      throw new NotFoundException(`No existe la merma ${id}.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inventory.upsert({
        where: {
          brickYardId_brickId: {
            brickYardId: merma.brickYardId,
            brickId: merma.brickId,
          },
        },
        create: {
          brickYardId: merma.brickYardId,
          brickId: merma.brickId,
          quantity: merma.quantity,
        },
        update: {
          quantity: { increment: merma.quantity },
          updatedAt: new Date(),
        },
      });

      await tx.inventoryMovement.create({
        data: {
          brickYardId: merma.brickYardId,
          brickId: merma.brickId,
          change: merma.quantity,
          reason: 'adjustment',
          ...(merma.orderId ? { orderId: merma.orderId } : {}),
          ...(createdBy ? { createdBy: toBigInt(createdBy) } : {}),
        },
      });

      await tx.brickWaste.delete({ where: { id: merma.id } });
    });
  }

  /** Cuanta merma hay y de donde sale: por sede, por ladrillo y por motivo. */
  async summary(query: QueryWasteDto): Promise<WasteSummaryDto> {
    const rows = await this.prisma.brickWaste.findMany({
      where: construirWhere(query),
      select: {
        quantity: true,
        unitPrice: true,
        brickYardId: true,
        brickId: true,
        reasonId: true,
        brickYard: { select: { name: true } },
        brick: { select: { name: true } },
        reason: { select: { name: true } },
      },
    });

    const porSede = new Map<number, WasteSummaryRowDto>();
    const porLadrillo = new Map<number, WasteSummaryRowDto>();
    const porMotivo = new Map<number, WasteSummaryRowDto>();

    let totalQuantity = 0;
    let totalValue = 0;

    for (const fila of rows) {
      const valor = fila.quantity * toAmount(fila.unitPrice);

      totalQuantity += fila.quantity;
      totalValue += valor;

      acumular(
        porSede,
        toNumber(fila.brickYardId),
        fila.brickYard.name,
        fila.quantity,
        valor,
      );
      acumular(
        porLadrillo,
        toNumber(fila.brickId),
        fila.brick.name,
        fila.quantity,
        valor,
      );
      acumular(
        porMotivo,
        fila.reasonId,
        fila.reason.name,
        fila.quantity,
        valor,
      );
    }

    return {
      totalQuantity,
      totalValue: redondear(totalValue),
      byBrickYard: ordenar(porSede),
      byBrick: ordenar(porLadrillo),
      byReason: ordenar(porMotivo),
    };
  }
}

function construirWhere(query: QueryWasteDto): Prisma.BrickWasteWhereInput {
  const occurredAt: Prisma.DateTimeFilter = {
    ...(query.from ? { gte: new Date(query.from) } : {}),
    ...(query.to ? { lte: new Date(query.to) } : {}),
  };

  return {
    ...(query.brickYardId ? { brickYardId: toBigInt(query.brickYardId) } : {}),
    ...(query.brickId ? { brickId: toBigInt(query.brickId) } : {}),
    ...(query.reasonId ? { reasonId: query.reasonId } : {}),
    ...(query.orderId ? { orderId: toBigInt(query.orderId) } : {}),
    ...(query.from || query.to ? { occurredAt } : {}),
    ...(query.search
      ? { brick: { name: { contains: query.search, mode: 'insensitive' } } }
      : {}),
  };
}

function acumular(
  destino: Map<number, WasteSummaryRowDto>,
  id: number,
  name: string,
  quantity: number,
  value: number,
): void {
  const actual = destino.get(id) ?? { id, name, quantity: 0, totalValue: 0 };

  destino.set(id, {
    id,
    name,
    quantity: actual.quantity + quantity,
    totalValue: actual.totalValue + value,
  });
}

function ordenar(origen: Map<number, WasteSummaryRowDto>): WasteSummaryRowDto[] {
  return [...origen.values()]
    .map((fila) => ({ ...fila, totalValue: redondear(fila.totalValue) }))
    .sort((a, b) => b.quantity - a.quantity);
}

function redondear(value: number): number {
  return Math.round(value * 100) / 100;
}

function toEntity(merma: WasteConRelaciones): WasteEntity {
  const unitPrice = toAmount(merma.unitPrice);

  return {
    id: toNumber(merma.id),
    brickYardId: toNumber(merma.brickYardId),
    brickYardName: merma.brickYard.name,
    brickId: toNumber(merma.brickId),
    brickName: merma.brick.name,
    quantity: merma.quantity,
    reasonId: merma.reasonId,
    reasonCode: merma.reason.code,
    reasonName: merma.reason.name,
    notes: merma.notes,
    orderId: merma.orderId === null ? null : toNumber(merma.orderId),
    movementId: merma.movementId === null ? null : toNumber(merma.movementId),
    unitPrice,
    totalValue: redondear(merma.quantity * unitPrice),
    occurredAt: merma.occurredAt,
    createdBy: merma.createdBy === null ? null : toNumber(merma.createdBy),
    createdByName: merma.creator?.fullName ?? null,
    createdAt: merma.createdAt,
  };
}
