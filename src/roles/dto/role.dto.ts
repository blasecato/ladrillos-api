import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { ROLE_CODES } from '../../common/constants/domain.js';

export class RoleEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: ROLE_CODES, example: 'admin' })
  code!: string;

  @ApiProperty({ example: 'Administrador' })
  name!: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'seller', description: 'Codigo unico del rol' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Vendedor' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
