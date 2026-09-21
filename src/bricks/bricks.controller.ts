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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  PaginatedDto,
  apiPaginatedSchema,
} from '../common/dto/paginated.dto.js';
import { BricksService } from './bricks.service.js';
import {
  BrickEntity,
  CreateBrickDto,
  QueryBricksDto,
  UpdateBrickDto,
} from './dto/brick.dto.js';

@ApiTags('bricks')
@ApiExtraModels(PaginatedDto, BrickEntity)
@Controller('bricks')
export class BricksController {
  constructor(private readonly bricks: BricksService) {}

  @Get()
  @ApiOperation({
    summary: 'Catalogo de ladrillos con filtros por categoria, material y sede',
  })
  @ApiOkResponse({ schema: apiPaginatedSchema(BrickEntity) })
  findAll(@Query() query: QueryBricksDto): Promise<PaginatedDto<BrickEntity>> {
    return this.bricks.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ficha de un ladrillo con sus existencias por sede',
  })
  @ApiOkResponse({ type: BrickEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BrickEntity> {
    return this.bricks.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un ladrillo' })
  @ApiCreatedResponse({ type: BrickEntity })
  create(@Body() dto: CreateBrickDto): Promise<BrickEntity> {
    return this.bricks.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un ladrillo' })
  @ApiOkResponse({ type: BrickEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrickDto,
  ): Promise<BrickEntity> {
    return this.bricks.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un ladrillo' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.bricks.remove(id);
  }
}
