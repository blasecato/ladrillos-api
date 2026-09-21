import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
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
  CreateWasteDto,
  QueryWasteDto,
  WasteEntity,
  WasteReasonEntity,
  WasteSummaryDto,
} from './dto/waste.dto.js';
import { WasteService } from './waste.service.js';

@ApiTags('waste')
@ApiExtraModels(PaginatedDto, WasteEntity)
@Controller('waste')
export class WasteController {
  constructor(private readonly waste: WasteService) {}

  @Get()
  @ApiOperation({ summary: 'Mermas registradas: que ladrillo, sede y motivo' })
  @ApiOkResponse({ schema: apiPaginatedSchema(WasteEntity) })
  findAll(@Query() query: QueryWasteDto): Promise<PaginatedDto<WasteEntity>> {
    return this.waste.findAll(query);
  }

  @Get('reasons')
  @ApiOperation({ summary: 'Catalogo de motivos de merma' })
  @ApiOkResponse({ type: [WasteReasonEntity] })
  findReasons(): Promise<WasteReasonEntity[]> {
    return this.waste.findReasons();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Totales de merma por sede, ladrillo y motivo' })
  @ApiOkResponse({ type: WasteSummaryDto })
  summary(@Query() query: QueryWasteDto): Promise<WasteSummaryDto> {
    return this.waste.summary(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una merma' })
  @ApiOkResponse({ type: WasteEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WasteEntity> {
    return this.waste.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registra ladrillos danados y descuenta las existencias',
  })
  @ApiCreatedResponse({ type: WasteEntity })
  create(
    @Body() dto: CreateWasteDto,
    @Req() request: RequestConUsuario,
  ): Promise<WasteEntity> {
    return this.waste.create(dto, request.user?.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Anula una merma y devuelve los ladrillos al inventario',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestConUsuario,
  ): Promise<void> {
    return this.waste.remove(id, request.user?.sub);
  }
}
