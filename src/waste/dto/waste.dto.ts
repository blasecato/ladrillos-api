import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/** Fila de `waste_reasons`: catalogo de motivos de merma. */
export class WasteReasonEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'loading' })
  code!: string;

  @ApiProperty({ example: 'Dano en cargue' })
  name!: string;
}

/** Fila de `brick_waste`: ladrillos danados en una sede. */
export class WasteEntity {
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

  @ApiProperty({ example: 25, description: 'Ladrillos danados' })
  quantity!: number;

  @ApiProperty({ example: 1 })
  reasonId!: number;

  @ApiProperty({ example: 'loading' })
  reasonCode!: string;

  @ApiProperty({ example: 'Dano en cargue' })
  reasonName!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Se cayo la estiba al subirla al camion',
  })
  notes!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 12 })
  orderId!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 88,
    description: 'Movimiento de inventario que descontó las existencias',
  })
  movementId!: number | null;

  @ApiProperty({ example: 1450, description: 'Precio congelado al registrar' })
  unitPrice!: number;

  @ApiProperty({ example: 36250, description: 'quantity * unitPrice' })
  totalValue!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt!: Date;

  @ApiProperty({ type: Number, nullable: true, example: 3 })
  createdBy!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Ana Lopez' })
  createdByName!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class CreateWasteDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickYardId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickId!: number;

  @ApiProperty({ example: 25, description: 'Ladrillos danados' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 1, description: 'Id de `waste_reasons`' })
  @Type(() => Number)
  @IsInt()
  reasonId!: number;

  @ApiPropertyOptional({
    example: 'Se cayo la estiba al subirla al camion',
    description: 'Detalle libre del motivo',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Orden en cuyo cargue ocurrio la merma' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  orderId?: number;

  @ApiPropertyOptional({
    description: 'Fecha del dano. Por defecto, ahora',
  })
  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

export class QueryWasteDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brickYardId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brickId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  reasonId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  orderId?: number;

  @ApiPropertyOptional({ description: 'Desde (inclusive)' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (inclusive)' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class WasteSummaryRowDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Sede Norte' })
  name!: string;

  @ApiProperty({ example: 320 })
  quantity!: number;

  @ApiProperty({ example: 464000 })
  totalValue!: number;
}

/** Cuanta merma hay y de donde sale: por sede, por ladrillo y por motivo. */
export class WasteSummaryDto {
  @ApiProperty({ example: 780, description: 'Ladrillos danados en el periodo' })
  totalQuantity!: number;

  @ApiProperty({ example: 1131000, description: 'Valor perdido' })
  totalValue!: number;

  @ApiProperty({ type: [WasteSummaryRowDto] })
  byBrickYard!: WasteSummaryRowDto[];

  @ApiProperty({ type: [WasteSummaryRowDto] })
  byBrick!: WasteSummaryRowDto[];

  @ApiProperty({ type: [WasteSummaryRowDto] })
  byReason!: WasteSummaryRowDto[];
}
