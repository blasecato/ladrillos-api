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
import {
  CreateMaterialDto,
  MaterialEntity,
  UpdateMaterialDto,
} from './dto/material.dto.js';
import { MaterialsService } from './materials.service.js';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los materiales' })
  @ApiOkResponse({ type: [MaterialEntity] })
  findAll(): Promise<MaterialEntity[]> {
    return this.materials.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un material' })
  @ApiOkResponse({ type: MaterialEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MaterialEntity> {
    return this.materials.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un material' })
  @ApiCreatedResponse({ type: MaterialEntity })
  create(@Body() dto: CreateMaterialDto): Promise<MaterialEntity> {
    return this.materials.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un material' })
  @ApiOkResponse({ type: MaterialEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ): Promise<MaterialEntity> {
    return this.materials.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un material' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.materials.remove(id);
  }
}
