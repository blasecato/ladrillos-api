import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DOCUMENT_TYPE_CODES } from '../../common/constants/domain.js';

export class DocumentTypeEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: DOCUMENT_TYPE_CODES, example: 'CC' })
  code!: string;

  @ApiProperty({ example: 'Cedula de ciudadania' })
  name!: string;
}

export class CreateDocumentTypeDto {
  @ApiProperty({ example: 'CC' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Cedula de ciudadania' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateDocumentTypeDto extends PartialType(CreateDocumentTypeDto) {}
