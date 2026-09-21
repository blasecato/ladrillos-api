import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  JwtAuthGuard,
  type RequestConUsuario,
} from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  PaginatedDto,
  apiPaginatedSchema,
} from '../common/dto/paginated.dto.js';
import {
  CreateMovementDto,
  InventoryEntity,
  InventoryMatrixDto,
  InventoryMovementEntity,
  QueryInventoryDto,
  QueryMovementsDto,
  SetInventoryDto,
} from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('inventory')
@ApiExtraModels(PaginatedDto, InventoryEntity, InventoryMovementEntity)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Existencias por sede y ladrillo' })
  @ApiOkResponse({ schema: apiPaginatedSchema(InventoryEntity) })
  findAll(
    @Query() query: QueryInventoryDto,
  ): Promise<PaginatedDto<InventoryEntity>> {
    return this.inventory.findAll(query);
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Matriz de existencias ladrillo x sede' })
  @ApiQuery({ name: 'brickYardId', required: false, type: Number })
  @ApiOkResponse({ type: InventoryMatrixDto })
  matrix(
    @Query('brickYardId', new ParseIntPipe({ optional: true }))
    brickYardId?: number,
  ): Promise<InventoryMatrixDto> {
    return this.inventory.matrix(brickYardId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Libro de movimientos de inventario' })
  @ApiOkResponse({ schema: apiPaginatedSchema(InventoryMovementEntity) })
  findMovements(
    @Query() query: QueryMovementsDto,
  ): Promise<PaginatedDto<InventoryMovementEntity>> {
    return this.inventory.findMovements(query);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fija las existencias de un ladrillo en una sede' })
  @ApiOkResponse({ type: InventoryEntity })
  setQuantity(
    @Body() dto: SetInventoryDto,
    @Req() request: RequestConUsuario,
  ): Promise<InventoryEntity> {
    return this.inventory.setQuantity(dto, request.user?.sub);
  }

  @Post('movements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registra una entrada o salida y actualiza las existencias',
  })
  @ApiOkResponse({ type: InventoryEntity })
  createMovement(
    @Body() dto: CreateMovementDto,
    @Req() request: RequestConUsuario,
  ): Promise<InventoryEntity> {
    return this.inventory.createMovement(dto, request.user?.sub);
  }
}
