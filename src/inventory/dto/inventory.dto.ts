import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { MOVEMENT_REASONS } from '../../common/constants/domain.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/** Fila de `inventory`: existencias de un ladrillo en una sede. */
export class InventoryEntity {
  @ApiProperty({ example: 1 })
  brickYardId!: number;

  @ApiProperty({ example: 'Sede Norte' })
  brickYardName!: string;

  @ApiProperty({ example: 1 })
  brickId!: number;

  @ApiProperty({ example: 'Ladrillo cara vista rojo' })
  brickName!: string;

  @ApiProperty({ example: 12400 })
  quantity!: number;

  @ApiProperty({
    example: false,
    description: 'Por debajo del umbral de stock bajo',
  })
  lowStock!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class InventoryCellDto {
  @ApiProperty({ example: 1 })
  brickYardId!: number;

  @ApiProperty({ example: 'Sede Norte' })
  brickYardName!: string;

  @ApiProperty({ example: 12400 })
  quantity!: number;

  @ApiProperty({ example: false })
  lowStock!: boolean;
}

export class InventoryRowDto {
  @ApiProperty({ example: 1 })
  brickId!: number;

  @ApiProperty({ example: 'Ladrillo cara vista rojo' })
  brickName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Cara vista' })
  categoryName!: string | null;

  @ApiProperty({ type: [InventoryCellDto], description: 'Una celda por sede' })
  cells!: InventoryCellDto[];

  @ApiProperty({ example: 31200 })
  total!: number;
}

/** Matriz ladrillo x sede que pinta el panel. */
export class InventoryMatrixDto {
  @ApiProperty({
    type: [String],
    example: ['Sede Norte', 'Sede Sur'],
    description: 'Columnas',
  })
  brickYards!: string[];

  @ApiProperty({ type: [InventoryRowDto] })
  rows!: InventoryRowDto[];

  @ApiProperty({ example: 3500 })
  lowStockThreshold!: number;
}

export class InventoryMovementEntity {
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

  @ApiProperty({ example: -250, description: '+ entrada, - salida' })
  change!: number;

  @ApiProperty({ enum: MOVEMENT_REASONS, example: 'sale' })
  reason!: string;

  @ApiProperty({ type: Number, nullable: true, example: 12 })
  orderId!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 3 })
  createdBy!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class SetInventoryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickYardId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickId!: number;

  @ApiProperty({ example: 12400, description: 'Valor absoluto de existencias' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class CreateMovementDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickYardId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  brickId!: number;

  @ApiProperty({
    example: 500,
    description: '+ produccion/entrada, - venta/salida',
  })
  @Type(() => Number)
  @IsInt()
  change!: number;

  @ApiProperty({ enum: MOVEMENT_REASONS, example: 'production' })
  @IsIn(MOVEMENT_REASONS)
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Orden que origina el movimiento' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  orderId?: number;
}

export class QueryInventoryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({ description: 'Solo filas por debajo del umbral' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;
}

export class QueryMovementsDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({ enum: MOVEMENT_REASONS })
  @IsString()
  @IsOptional()
  reason?: string;
}
