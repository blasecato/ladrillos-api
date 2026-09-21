import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DocumentTypesService } from './document-types.service.js';
import {
  CreateDocumentTypeDto,
  DocumentTypeEntity,
  UpdateDocumentTypeDto,
} from './dto/document-type.dto.js';

@ApiTags('document-types')
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypes: DocumentTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los tipos de documento' })
  @ApiOkResponse({ type: [DocumentTypeEntity] })
  findAll(): Promise<DocumentTypeEntity[]> {
    return this.documentTypes.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un tipo de documento' })
  @ApiOkResponse({ type: DocumentTypeEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DocumentTypeEntity> {
    return this.documentTypes.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un tipo de documento' })
  @ApiCreatedResponse({ type: DocumentTypeEntity })
  create(@Body() dto: CreateDocumentTypeDto): Promise<DocumentTypeEntity> {
    return this.documentTypes.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un tipo de documento' })
  @ApiOkResponse({ type: DocumentTypeEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentTypeDto,
  ): Promise<DocumentTypeEntity> {
    return this.documentTypes.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un tipo de documento' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.documentTypes.remove(id);
  }
}
