import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/** Existencias del ladrillo en una sede. */
export class BrickStockDto {
  @ApiProperty({ example: 1 })
  brickYardId!: number;

  @ApiProperty({ example: 'Sede Norte' })
  brickYardName!: string;

  @ApiProperty({ example: 12400 })
  quantity!: number;
}

export class BrickEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ladrillo cara vista rojo' })
  name!: string;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  categoryId!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Cara vista' })
  categoryName!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  materialId!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Arcilla' })
  materialName!: string | null;

  @ApiProperty({ example: 1450.0, description: 'Precio de lista' })
  unitPrice!: number;

  @ApiProperty({ type: [BrickStockDto], description: 'Existencias por sede' })
  stock!: BrickStockDto[];

  @ApiProperty({
    example: 31200,
    description: 'Suma de existencias en todas las sedes',
  })
  totalStock!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class CreateBrickDto {
  @ApiProperty({ example: 'Ladrillo cara vista rojo' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 1, description: 'Id de `brick_categories`' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Id de `materials`' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  materialId?: number;

  @ApiProperty({ example: 1450.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class UpdateBrickDto extends PartialType(CreateBrickDto) {}

export class QueryBricksDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por categoria' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filtra por material' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  materialId?: number;

  @ApiPropertyOptional({
    description: 'Solo ladrillos con existencias en esta sede',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brickYardId?: number;
}
