import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

import { ORDER_STATUSES } from '../../common/constants/domain.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class OrderItemEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  brickYardId!: number;

  @ApiProperty({ example: 'Sede Norte' })
  brickYardName!: string;

  @ApiProperty({ example: 1 })
  brickId!: number;

  @ApiProperty({ example: 'Ladrillo cara vista rojo' })
  brickName!: string;

  @ApiProperty({ example: 2500 })
  quantity!: number;

  @ApiProperty({
    example: 1450.0,
    description: 'Precio congelado al crear la orden',
  })
  unitPrice!: number;

  @ApiProperty({ example: 3625000, description: 'quantity x unitPrice' })
  subtotal!: number;
}

export class OrderEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '#ORD-1', description: 'Numero visible de la orden' })
  number!: string;

  @ApiProperty({ example: 3 })
  userId!: number;

  @ApiProperty({ example: 'Maria Restrepo' })
  userFullName!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Vendedor que atendio la venta; null = venta directa',
  })
  sellerId!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Carolina Ruiz' })
  sellerName!: string | null;

  @ApiProperty({ enum: ORDER_STATUSES, example: 'pending' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  orderDate!: Date;

  @ApiProperty({ type: [OrderItemEntity] })
  items!: OrderItemEntity[];

  @ApiProperty({ example: 3625000, description: 'Suma de los subtotales' })
  total!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Sede de la que sale el producto' })
  @Type(() => Number)
  @IsInt()
  brickYardId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickId!: number;

  @ApiProperty({ example: 2500, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    example: 1450.0,
    description: 'Si no viene, se toma el precio de lista del ladrillo',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 3, description: 'Cliente que hace la orden' })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Vendedor que atiende. Sin el, es una venta directa',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sellerId?: number;

  @ApiPropertyOptional({ enum: ORDER_STATUSES, default: 'pending' })
  @IsIn(ORDER_STATUSES)
  @IsOptional()
  status?: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Puede combinar varias sedes',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES, example: 'confirmed' })
  @IsIn(ORDER_STATUSES)
  status!: string;
}

export class QueryOrdersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Ordenes de un cliente' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ description: 'Ordenes con alguna linea de esta sede' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brickYardId?: number;

  @ApiPropertyOptional({
    description: 'Desde (inclusive), por `order_date`',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (inclusive), por `order_date`' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

/** Una fila del ranking de vendedores o clientes. */
export class RankingVentasDto {
  @ApiProperty({ example: 4 })
  userId!: number;

  @ApiProperty({ example: 'Carolina Ruiz' })
  fullName!: string;

  @ApiProperty({ example: 'carolina.ruiz' })
  username!: string;

  @ApiProperty({ example: 'carolina@ladrilleras.com' })
  email!: string;

  @ApiProperty({ example: 12, description: 'Ordenes en el periodo' })
  orders!: number;

  @ApiProperty({ example: 48200, description: 'Ladrillos del periodo' })
  units!: number;

  @ApiProperty({ example: 68500000, description: 'Valor del periodo' })
  total!: number;
}

/** Una fila del ranking de ladrilleras: cuanto despacho cada sede. */
export class RankingSedesDto {
  @ApiProperty({ example: 1 })
  brickYardId!: number;

  @ApiProperty({ example: 'Sede Centro' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Pitalito' })
  city!: string | null;

  @ApiProperty({ example: 12, description: 'Ordenes despachadas en el periodo' })
  orders!: number;

  @ApiProperty({ example: 48200, description: 'Ladrillos despachados' })
  units!: number;

  @ApiProperty({ example: 68500000, description: 'Valor despachado' })
  total!: number;
}

/** Rango del ranking de sedes. */
export class QueryRangoDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

/** Rango y rol del ranking. */
export class QueryRankingDto {
  @ApiPropertyOptional({
    enum: ['seller', 'client'],
    default: 'seller',
    description: 'seller = quien vendio; client = quien compro',
  })
  @IsIn(['seller', 'client'])
  @IsOptional()
  role?: 'seller' | 'client';

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

/** Rango opcional para las cifras de cabecera del panel. */
export class QueryOrdersSummaryDto {
  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;
}

/** Cifras de cabecera del panel. */
/** Una barra del grafico de ventas por mes. */
export class MonthlySalesDto {
  @ApiProperty({ example: '2026-08', description: 'Mes en formato YYYY-MM' })
  month!: string;

  @ApiProperty({ example: 'Ago', description: 'Etiqueta corta en espanol' })
  label!: string;

  @ApiProperty({ example: 324000, description: 'Unidades despachadas' })
  units!: number;

  @ApiProperty({ example: 412500000, description: 'Valor vendido' })
  total!: number;
}

export class OrdersSummaryDto {
  @ApiProperty({ example: 128 })
  orders!: number;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Inicio del periodo; null = desde siempre',
  })
  from!: string | null;

  @ApiProperty({ example: 14 })
  pending!: number;

  @ApiProperty({ example: 96 })
  delivered!: number;

  @ApiProperty({ example: 8 })
  cancelled!: number;

  @ApiProperty({
    example: 412500000,
    description: 'Suma de las ordenes no canceladas',
  })
  totalSales!: number;
}
