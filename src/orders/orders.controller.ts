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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
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
  CreateOrderDto,
  MonthlySalesDto,
  OrderEntity,
  OrdersSummaryDto,
  QueryOrdersDto,
  QueryOrdersSummaryDto,
  QueryRangoDto,
  QueryRankingDto,
  RankingSedesDto,
  RankingVentasDto,
  UpdateOrderStatusDto,
} from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@ApiExtraModels(PaginatedDto, OrderEntity)
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista ordenes con filtros por estado, cliente y sede',
  })
  @ApiOkResponse({ schema: apiPaginatedSchema(OrderEntity) })
  findAll(@Query() query: QueryOrdersDto): Promise<PaginatedDto<OrderEntity>> {
    return this.orders.findAll(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Cifras del dashboard de ventas' })
  @ApiOkResponse({ type: OrdersSummaryDto })
  summary(@Query() query: QueryOrdersSummaryDto): Promise<OrdersSummaryDto> {
    return this.orders.summary(query);
  }

  @Get('ranking')
  @ApiOperation({
    summary: 'Ranking de ventas por vendedor o por cliente, de mayor a menor',
  })
  @ApiOkResponse({ type: [RankingVentasDto] })
  ranking(@Query() query: QueryRankingDto): Promise<RankingVentasDto[]> {
    return this.orders.ranking(query);
  }

  @Get('ranking-sedes')
  @ApiOperation({
    summary: 'Ladrillos despachados por cada ladrillera, de mayor a menor',
  })
  @ApiOkResponse({ type: [RankingSedesDto] })
  rankingSedes(@Query() query: QueryRangoDto): Promise<RankingSedesDto[]> {
    return this.orders.rankingSedes(query);
  }

  @Get('sales-by-month')
  @ApiOperation({
    summary: 'Ventas por mes (unidades y valor) para el grafico del panel',
  })
  @ApiOkResponse({ type: [MonthlySalesDto] })
  salesByMonth(
    @Query('months', new ParseIntPipe({ optional: true })) months?: number,
  ): Promise<MonthlySalesDto[]> {
    return this.orders.salesByMonth(months && months > 0 ? months : 8);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una orden con sus lineas' })
  @ApiOkResponse({ type: OrderEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderEntity> {
    return this.orders.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crea una orden y descuenta el inventario de cada sede',
  })
  @ApiCreatedResponse({ type: OrderEntity })
  @ApiBadRequestResponse({
    description: 'Existencias insuficientes en alguna sede',
  })
  create(
    @Body() dto: CreateOrderDto,
    @Req() request: RequestConUsuario,
  ): Promise<OrderEntity> {
    return this.orders.create(dto, request.user?.sub);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'seller')
  @ApiOperation({ summary: 'Mueve la orden de estado' })
  @ApiOkResponse({ type: OrderEntity })
  @ApiBadRequestResponse({ description: 'La orden ya esta cancelada' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    return this.orders.updateStatus(id, dto.status);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancela la orden y devuelve las existencias al inventario',
  })
  @ApiOkResponse({ type: OrderEntity })
  @ApiBadRequestResponse({ description: 'La orden ya esta cancelada' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestConUsuario,
  ): Promise<OrderEntity> {
    return this.orders.cancel(id, request.user?.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una orden' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.orders.remove(id);
  }
}
