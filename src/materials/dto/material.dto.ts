import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MaterialEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Arcilla' })
  name!: string;
}

export class CreateMaterialDto {
  @ApiProperty({ example: 'Arcilla' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
