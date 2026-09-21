import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class CompanyEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ladrilleras Pitalito SAS' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '900123456-7' })
  nit!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'contacto@ladrilleras.com',
  })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '608 111 2233' })
  phone!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Cra 4 #10-25' })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Pitalito' })
  city!: string | null;
}

export class CreateCompanyDto {
  @ApiProperty({ example: 'Ladrilleras Pitalito SAS' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsString()
  @IsOptional()
  nit?: string;

  @ApiPropertyOptional({ example: 'contacto@ladrilleras.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '608 111 2233' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Cra 4 #10-25' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Pitalito' })
  @IsString()
  @IsOptional()
  city?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class QueryCompaniesDto extends PaginationQueryDto {}
