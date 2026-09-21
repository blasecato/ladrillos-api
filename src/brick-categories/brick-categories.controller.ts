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
import { BrickCategoriesService } from './brick-categories.service.js';
import {
  BrickCategoryEntity,
  CreateBrickCategoryDto,
  UpdateBrickCategoryDto,
} from './dto/brick-category.dto.js';

@ApiTags('brick-categories')
@Controller('brick-categories')
export class BrickCategoriesController {
  constructor(private readonly categories: BrickCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las categorias de ladrillo' })
  @ApiOkResponse({ type: [BrickCategoryEntity] })
  findAll(): Promise<BrickCategoryEntity[]> {
    return this.categories.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una categoria' })
  @ApiOkResponse({ type: BrickCategoryEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BrickCategoryEntity> {
    return this.categories.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una categoria' })
  @ApiCreatedResponse({ type: BrickCategoryEntity })
  create(@Body() dto: CreateBrickCategoryDto): Promise<BrickCategoryEntity> {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza una categoria' })
  @ApiOkResponse({ type: BrickCategoryEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrickCategoryDto,
  ): Promise<BrickCategoryEntity> {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una categoria' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categories.remove(id);
  }
}
