import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/** Sede / ladrillera. */
export class BrickYardEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  companyId!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Ladrilleras Pitalito SAS',
  })
  companyName!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '900123456-7',
    description: 'NIT de la empresa dueña de la sede',
  })
  companyNit!: string | null;

  @ApiProperty({ example: 'Sede Norte' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Km 3 via Bruselas' })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Pitalito' })
  city!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Huila' })
  department!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '608 111 2233' })
  phone!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'norte@ladrilleras.com',
  })
  email!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'sedes/porcelana.webp',
    description:
      'Ruta de la foto en el object storage; el front arma la URL. Nula si no hay foto.',
  })
  photoKey!: string | null;

  @ApiProperty({
    example: 4,
    description: 'Referencias con fila de inventario en la sede',
  })
  brickCount!: number;

  @ApiProperty({
    example: 3,
    description: 'Referencias con existencias (quantity > 0) en la sede',
  })
  inStockCount!: number;

  @ApiProperty({
    example: 130550,
    description: 'Unidades disponibles hoy en la sede (suma de `inventory`)',
  })
  totalStock!: number;

  @ApiProperty({
    type: [String],
    example: ['Bloques divisorios', 'Pisos y calados'],
    description: 'Categorias de ladrillo con existencias en la sede',
  })
  categories!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class CreateBrickYardDto {
  @ApiProperty({ example: 'Sede Norte' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 1, description: 'Id de `companies`' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  companyId?: number;

  @ApiPropertyOptional({ example: 'Km 3 via Bruselas' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Pitalito' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Huila' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: '608 111 2233' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'norte@ladrilleras.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'sedes/porcelana.webp',
    description: 'Ruta de la foto ya subida al object storage',
  })
  @IsString()
  @IsOptional()
  photoKey?: string;
}

export class UpdateBrickYardDto extends PartialType(CreateBrickYardDto) {}

export class QueryBrickYardsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por empresa' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  companyId?: number;

  @ApiPropertyOptional({ example: 'Pitalito' })
  @IsString()
  @IsOptional()
  city?: string;
}
