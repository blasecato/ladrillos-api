import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toAmount, toBigInt, toNumber } from '../common/utils/serialize.js';
// Valor, no solo tipo: `Prisma.sql` arma el fragmento del ranking.
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateOrderDto,
  MonthlySalesDto,
  OrderEntity,
  OrdersSummaryDto,
  QueryOrdersDto,
  QueryOrdersSummaryDto,
  QueryRangoDto,
  QueryRankingDto,
  RankingSedesDto,
  RankingVentasDto,
} from './dto/order.dto.js';

/** Etiquetas de los meses para el grafico, en el orden de `getUTCMonth()`. */
const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const INCLUDE = {
  user: { select: { fullName: true } },
  seller: { select: { fullName: true } },
  items: {
    include: {
      brickYard: { select: { name: true } },
      brick: { select: { name: true } },
    },
  },
} as const;

type OrderConRelaciones = Prisma.OrderGetPayload<{ include: typeof INCLUDE }>;

/**
 * `to` llega como fecha suelta (`2026-09-20`). Sin hora, `new Date()` la lee a
 * las 00:00 UTC y las ordenes de ese mismo dia quedarian fuera del rango: se
 * toma el dia completo.
 */
function finDelDia(valor: string): Date {
  return valor.length === 10
    ? new Date(`${valor}T23:59:59.999Z`)
    : new Date(valor);
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryOrdersDto): Promise<PaginatedDto<OrderEntity>> {
    const orderDate: Prisma.DateTimeFilter = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: finDelDia(query.to) } : {}),
    };

    const where: Prisma.OrderWhereInput = {
      ...(query.from || query.to ? { orderDate } : {}),
      ...(query.status
        ? { status: query.status as Prisma.EnumOrderStatusFilter['equals'] }
        : {}),
      ...(query.userId ? { userId: toBigInt(query.userId) } : {}),
      ...(query.brickYardId
        ? { items: { some: { brickYardId: toBigInt(query.brickYardId) } } }
        : {}),
      ...(query.search
        ? {
            user: { fullName: { contains: query.search, mode: 'insensitive' } },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: {
          [query.sortBy ?? 'orderDate']:
            query.sortDir === 'asc' ? 'asc' : 'desc',
        },
        include: INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginar(rows.map(toEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.prisma.order.findUnique({
      where: { id: toBigInt(id) },
      include: INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`No existe la orden ${id}.`);
    }

    return toEntity(order);
  }

  /**
   * Crea la orden y descuenta el inventario en la misma transaccion: si alguna
   * sede no tiene existencias, no se crea nada. El precio se congela aqui.
   */
  async create(dto: CreateOrderDto, createdBy?: number): Promise<OrderEntity> {
    const order = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.order.create({
        data: {
          userId: toBigInt(dto.userId),
          ...(dto.sellerId ? { sellerId: toBigInt(dto.sellerId) } : {}),
          ...(dto.status
            ? { status: dto.status as Prisma.OrderCreateInput['status'] }
            : {}),
        },
      });

      for (const item of dto.items) {
        const brickId = toBigInt(item.brickId);
        const brickYardId = toBigInt(item.brickYardId);

        const brick = await tx.brick.findUnique({ where: { id: brickId } });

        if (!brick) {
          throw new NotFoundException(`No existe el ladrillo ${item.brickId}.`);
        }

        await tx.orderItem.create({
          data: {
            orderId: creada.id,
            brickYardId,
            brickId,
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? brick.unitPrice,
          },
        });

        const existencias = await tx.inventory.findUnique({
          where: { brickYardId_brickId: { brickYardId, brickId } },
        });

        const quantity = (existencias?.quantity ?? 0) - item.quantity;

        if (quantity < 0) {
          throw new BadRequestException(
            `Existencias insuficientes de "${brick.name}" en la sede ${item.brickYardId}: ` +
              `hay ${existencias?.quantity ?? 0} y se piden ${item.quantity}.`,
          );
        }

        await tx.inventory.update({
          where: { brickYardId_brickId: { brickYardId, brickId } },
          data: { quantity, updatedAt: new Date() },
        });

        await tx.inventoryMovement.create({
          data: {
            brickYardId,
            brickId,
            change: -item.quantity,
            reason: 'sale',
            orderId: creada.id,
            ...(createdBy ? { createdBy: toBigInt(createdBy) } : {}),
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: creada.id },
        include: INCLUDE,
      });
    });

    return toEntity(order);
  }

  async updateStatus(id: number, status: string): Promise<OrderEntity> {
    const actual = await this.findOne(id);

    if (actual.status === 'cancelled') {
      throw new BadRequestException(
        `La orden ${actual.number} ya esta cancelada.`,
      );
    }

    if (status === 'cancelled') {
      return this.cancel(id);
    }

    const order = await this.prisma.order.update({
      where: { id: toBigInt(id) },
      data: { status: status as Prisma.OrderUpdateInput['status'] },
      include: INCLUDE,
    });

    return toEntity(order);
  }

  /** Cancela y devuelve al inventario lo que la orden habia descontado. */
  async cancel(id: number, createdBy?: number): Promise<OrderEntity> {
    const actual = await this.findOne(id);

    if (actual.status === 'cancelled') {
      throw new BadRequestException(
        `La orden ${actual.number} ya esta cancelada.`,
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId: toBigInt(id) },
      });

      for (const item of items) {
        await tx.inventory.upsert({
          where: {
            brickYardId_brickId: {
              brickYardId: item.brickYardId,
              brickId: item.brickId,
            },
          },
          create: {
            brickYardId: item.brickYardId,
            brickId: item.brickId,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
            updatedAt: new Date(),
          },
        });

        await tx.inventoryMovement.create({
          data: {
            brickYardId: item.brickYardId,
            brickId: item.brickId,
            change: item.quantity,
            reason: 'adjustment',
            orderId: toBigInt(id),
            ...(createdBy ? { createdBy: toBigInt(createdBy) } : {}),
          },
        });
      }

      return tx.order.update({
        where: { id: toBigInt(id) },
        data: { status: 'cancelled' },
        include: INCLUDE,
      });
    });

    return toEntity(order);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    // `order_items` cae en cascada; los movimientos quedan como historial.
    await this.prisma.order.delete({ where: { id: toBigInt(id) } });
  }

  /**
   * Ventas por mes para el grafico del dashboard. Va en SQL crudo porque
   * `groupBy` de Prisma no agrupa por `date_trunc`, y los meses sin ventas se
   * rellenan en cero para que el grafico no cambie de ancho.
   */
  async salesByMonth(months = 8): Promise<MonthlySalesDto[]> {
    const desde = new Date();
    desde.setUTCDate(1);
    desde.setUTCHours(0, 0, 0, 0);
    desde.setUTCMonth(desde.getUTCMonth() - (months - 1));

    const filas = await this.prisma.$queryRaw<
      Array<{ month: Date; units: bigint | number; total: Prisma.Decimal | number }>
    >`
      SELECT date_trunc('month', o.order_date) AS month,
             SUM(oi.quantity) AS units,
             SUM(oi.quantity * oi.unit_price) AS total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status <> 'cancelled'
        AND o.order_date >= ${desde}
      GROUP BY 1
      ORDER BY 1
    `;

    const porMes = new Map(
      filas.map((fila) => [
        fila.month.toISOString().slice(0, 7),
        {
          units: Number(fila.units),
          total: Number(fila.total),
        },
      ]),
    );

    return Array.from({ length: months }, (_, indice) => {
      const fecha = new Date(desde);
      fecha.setUTCMonth(desde.getUTCMonth() + indice);

      const clave = fecha.toISOString().slice(0, 7);
      const valores = porMes.get(clave);

      return {
        month: clave,
        label: MESES_CORTOS[fecha.getUTCMonth()] ?? clave,
        units: valores?.units ?? 0,
        total: valores?.total ?? 0,
      };
    });
  }

  /**
   * Ranking de ventas por persona, de mayor a menor.
   *
   * `role = 'seller'` agrupa por `orders.seller_id` (quien atendio la venta);
   * `role = 'client'` por `orders.user_id` (quien compro).
   *
   * Sale en SQL crudo por dos razones: el LEFT JOIN incluye a quien no vendio
   * nada en el periodo (el ranking debe llegar "hasta el que menos vendio") y
   * `COUNT(DISTINCT)` sobre ordenes no se expresa con `groupBy` de Prisma.
   */
  async ranking(query: QueryRankingDto = {}): Promise<RankingVentasDto[]> {
    const role = query.role ?? 'seller';
    const desde = query.from ? new Date(query.from) : null;
    // `to` llega como fecha: se toma el dia completo.
    const hasta = query.to ? finDelDia(query.to) : null;

    const columna =
      role === 'seller' ? Prisma.sql`o.seller_id` : Prisma.sql`o.user_id`;

    // Un administrador tambien puede vender, asi que entra en el ranking de
    // vendedores; el de clientes es solo rol `client`.
    const roles =
      role === 'seller'
        ? Prisma.sql`r.code IN ('seller', 'admin')`
        : Prisma.sql`r.code = 'client'`;

    const filas = await this.prisma.$queryRaw<
      Array<{
        user_id: bigint;
        full_name: string;
        username: string;
        email: string;
        orders: bigint;
        units: bigint;
        total: Prisma.Decimal | number;
      }>
    >`
      SELECT u.id AS user_id,
             u.full_name,
             u.username,
             u.email,
             COUNT(DISTINCT o.id) AS orders,
             COALESCE(SUM(oi.quantity), 0) AS units,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
      FROM users u
      LEFT JOIN orders o
        ON ${columna} = u.id
       AND o.status <> 'cancelled'
       AND (${desde}::timestamptz IS NULL OR o.order_date >= ${desde}::timestamptz)
       AND (${hasta}::timestamptz IS NULL OR o.order_date <= ${hasta}::timestamptz)
      LEFT JOIN order_items oi ON oi.order_id = o.id
      -- EXISTS y no JOIN: un usuario con dos roles (admin y vendedor)
      -- duplicaria sus lineas y sus unidades se contarian dos veces.
      WHERE EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND ${roles}
      )
      GROUP BY u.id, u.full_name, u.username, u.email
      ORDER BY units DESC, total DESC, u.full_name ASC
    `;

    return filas.map((fila) => ({
      userId: toNumber(fila.user_id),
      fullName: fila.full_name,
      username: fila.username,
      email: fila.email,
      orders: Number(fila.orders),
      units: Number(fila.units),
      total: Number(fila.total),
    }));
  }

  /**
   * Cuanto despacho cada ladrillera en el periodo, de mayor a menor.
   *
   * Agrupa por `order_items.brick_yard_id`, no por la orden: una misma orden
   * puede repartirse entre varias sedes y cada linea cuenta donde sale.
   * Arranca desde `brick_yards` para que salgan tambien las que no movieron
   * nada.
   */
  async rankingSedes(query: QueryRangoDto = {}): Promise<RankingSedesDto[]> {
    const desde = query.from ? new Date(query.from) : null;
    const hasta = query.to ? finDelDia(query.to) : null;

    const filas = await this.prisma.$queryRaw<
      Array<{
        brick_yard_id: bigint;
        name: string;
        city: string | null;
        orders: bigint;
        units: bigint;
        total: Prisma.Decimal | number;
      }>
    >`
      SELECT by.id AS brick_yard_id,
             by.name,
             by.city,
             COUNT(DISTINCT oi.order_id) AS orders,
             COALESCE(SUM(oi.quantity), 0) AS units,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
      FROM brick_yards by
      -- Las lineas se filtran DENTRO de la subconsulta. Si el filtro de fecha
      -- fuera del LEFT JOIN externo, las lineas de ordenes fuera del periodo
      -- seguirian sumando (su orden queda en NULL, pero la linea no).
      LEFT JOIN (
        SELECT oi.brick_yard_id,
               oi.order_id,
               oi.quantity,
               oi.unit_price
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status <> 'cancelled'
          AND (${desde}::timestamptz IS NULL OR o.order_date >= ${desde}::timestamptz)
          AND (${hasta}::timestamptz IS NULL OR o.order_date <= ${hasta}::timestamptz)
      ) oi ON oi.brick_yard_id = by.id
      GROUP BY by.id, by.name, by.city
      ORDER BY units DESC, total DESC, by.name ASC
    `;

    return filas.map((fila) => ({
      brickYardId: toNumber(fila.brick_yard_id),
      name: fila.name,
      city: fila.city,
      orders: Number(fila.orders),
      units: Number(fila.units),
      total: Number(fila.total),
    }));
  }

  /**
   * Cifras de cabecera. Con `from`/`to` se limitan al periodo (por
   * `order_date`); sin ellos son historicas.
   */
  async summary(query: QueryOrdersSummaryDto = {}): Promise<OrdersSummaryDto> {
    const orderDate: Prisma.DateTimeFilter = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: finDelDia(query.to) } : {}),
    };

    const periodo: Prisma.OrderWhereInput =
      query.from || query.to ? { orderDate } : {};

    const [orders, pending, delivered, cancelled, items] = await Promise.all([
      this.prisma.order.count({ where: periodo }),
      this.prisma.order.count({ where: { ...periodo, status: 'pending' } }),
      this.prisma.order.count({ where: { ...periodo, status: 'delivered' } }),
      this.prisma.order.count({ where: { ...periodo, status: 'cancelled' } }),
      this.prisma.orderItem.findMany({
        where: { order: { ...periodo, status: { not: 'cancelled' } } },
        select: { quantity: true, unitPrice: true },
      }),
    ]);

    const totalSales = items.reduce(
      (total, item) => total + item.quantity * toAmount(item.unitPrice),
      0,
    );

    return {
      orders,
      pending,
      delivered,
      cancelled,
      totalSales,
      from: query.from ?? null,
    };
  }
}

function toEntity(order: OrderConRelaciones): OrderEntity {
  const items = order.items.map((item) => ({
    id: toNumber(item.id),
    brickYardId: toNumber(item.brickYardId),
    brickYardName: item.brickYard.name,
    brickId: toNumber(item.brickId),
    brickName: item.brick.name,
    quantity: item.quantity,
    unitPrice: toAmount(item.unitPrice),
    subtotal: item.quantity * toAmount(item.unitPrice),
  }));

  return {
    id: toNumber(order.id),
    number: `#ORD-${order.id}`,
    userId: toNumber(order.userId),
    userFullName: order.user.fullName,
    sellerId: order.sellerId === null ? null : toNumber(order.sellerId),
    sellerName: order.seller?.fullName ?? null,
    status: order.status,
    orderDate: order.orderDate,
    items,
    total: items.reduce((total, item) => total + item.subtotal, 0),
    createdAt: order.createdAt,
  };
}
