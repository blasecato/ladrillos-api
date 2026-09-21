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
import { BrickYardsService } from './brick-yards.service.js';
import {
  BrickYardEntity,
  CreateBrickYardDto,
  QueryBrickYardsDto,
  UpdateBrickYardDto,
} from './dto/brick-yard.dto.js';

@ApiTags('brick-yards')
@ApiExtraModels(PaginatedDto, BrickYardEntity)
@Controller('brick-yards')
export class BrickYardsController {
  constructor(private readonly brickYards: BrickYardsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las sedes (ladrilleras)' })
  @ApiOkResponse({ schema: apiPaginatedSchema(BrickYardEntity) })
  findAll(
    @Query() query: QueryBrickYardsDto,
  ): Promise<PaginatedDto<BrickYardEntity>> {
    return this.brickYards.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ficha de una sede' })
  @ApiOkResponse({ type: BrickYardEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BrickYardEntity> {
    return this.brickYards.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una sede' })
  @ApiCreatedResponse({ type: BrickYardEntity })
  create(@Body() dto: CreateBrickYardDto): Promise<BrickYardEntity> {
    return this.brickYards.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza una sede' })
  @ApiOkResponse({ type: BrickYardEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrickYardDto,
  ): Promise<BrickYardEntity> {
    return this.brickYards.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una sede' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.brickYards.remove(id);
  }
}
