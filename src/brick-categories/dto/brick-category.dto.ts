import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BrickCategoryEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cara vista' })
  name!: string;
}

export class CreateBrickCategoryDto {
  @ApiProperty({ example: 'Cara vista' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateBrickCategoryDto extends PartialType(
  CreateBrickCategoryDto,
) {}
