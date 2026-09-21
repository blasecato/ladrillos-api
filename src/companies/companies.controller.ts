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
import { CompaniesService } from './companies.service.js';
import {
  CompanyEntity,
  CreateCompanyDto,
  QueryCompaniesDto,
  UpdateCompanyDto,
} from './dto/company.dto.js';

@ApiTags('companies')
@ApiExtraModels(PaginatedDto, CompanyEntity)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las empresas' })
  @ApiOkResponse({ schema: apiPaginatedSchema(CompanyEntity) })
  findAll(
    @Query() query: QueryCompaniesDto,
  ): Promise<PaginatedDto<CompanyEntity>> {
    return this.companies.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una empresa' })
  @ApiOkResponse({ type: CompanyEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyEntity> {
    return this.companies.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una empresa' })
  @ApiCreatedResponse({ type: CompanyEntity })
  create(@Body() dto: CreateCompanyDto): Promise<CompanyEntity> {
    return this.companies.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza una empresa' })
  @ApiOkResponse({ type: CompanyEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyEntity> {
    return this.companies.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una empresa' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companies.remove(id);
  }
}
