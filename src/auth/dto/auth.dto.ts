import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserEntity } from '../../users/dto/user.entity.js';

export class LoginDto {
  @ApiProperty({ example: 'maria.restrepo', description: 'Username o email' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'Ladrillo2026' })
  @IsString()
  @MinLength(8)
  password!: string;
}

/** Alta publica: siempre entra con el rol `client`. */
export class RegisterDto {
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

  @ApiProperty({ example: 'Ladrillo2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class SessionDto {
  @ApiProperty({ type: UserEntity })
  user!: UserEntity;

  @ApiProperty({ description: 'JWT para el header Authorization: Bearer' })
  accessToken!: string;
}
