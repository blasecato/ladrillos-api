import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import { ROLE_CODES } from '../../common/constants/domain.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class CreateUserDto {
  @ApiProperty({ example: 1, description: 'Id de `document_types`' })
  @Type(() => Number)
  @IsInt()
  documentTypeId!: number;

  @ApiProperty({ example: '1017234567' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: 'Maria Restrepo' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'maria@correo.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1996-04-18', format: 'date' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 'maria.restrepo' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiPropertyOptional({
    example: 'Ladrillo2026',
    minLength: 8,
    description:
      'Opcional: sin contrasena el usuario se autentica contra Keycloak',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id del usuario en Keycloak',
  })
  @IsUUID()
  @IsOptional()
  keycloakId?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [3],
    description: 'Ids de `roles`',
  })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsOptional()
  roleIds?: number[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class SetUserRolesDto {
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds!: number[];
}

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ROLE_CODES,
    description: 'Filtra por codigo de rol',
  })
  @IsString()
  @IsOptional()
  roleCode?: string;

  @ApiPropertyOptional({ description: 'Filtra por tipo de documento' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  documentTypeId?: number;
}
