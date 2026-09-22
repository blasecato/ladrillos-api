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

  @ApiProperty({ type: Number, nullable: true, example: 330, description: 'Largo en mm' })
  lengthMm!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 120, description: 'Ancho en mm' })
  widthMm!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 230, description: 'Alto en mm' })
  heightMm!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'ladrillos/bloque-12.webp',
    description:
      'Ruta de la foto en el object storage; el front arma la URL. Nula si no hay foto.',
  })
  photoKey!: string | null;

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

  @ApiPropertyOptional({ example: 330, description: 'Largo en milimetros' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  lengthMm?: number;

  @ApiPropertyOptional({ example: 120, description: 'Ancho en milimetros' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  widthMm?: number;

  @ApiPropertyOptional({ example: 230, description: 'Alto en milimetros' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  heightMm?: number;

  @ApiPropertyOptional({
    example: 'ladrillos/bloque-12.webp',
    description: 'Ruta de la foto ya subida al object storage',
  })
  @IsString()
  @IsOptional()
  photoKey?: string;
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
