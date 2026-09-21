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
  Put,
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

import { Roles } from '../auth/roles.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  PaginatedDto,
  apiPaginatedSchema,
} from '../common/dto/paginated.dto.js';
import {
  CreateUserDto,
  QueryUsersDto,
  SetUserRolesDto,
  UpdateUserDto,
} from './dto/user.dto.js';
import { UserEntity } from './dto/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@ApiExtraModels(PaginatedDto, UserEntity)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista usuarios con paginacion, busqueda y filtro por rol',
  })
  @ApiOkResponse({ schema: apiPaginatedSchema(UserEntity) })
  findAll(@Query() query: QueryUsersDto): Promise<PaginatedDto<UserEntity>> {
    return this.users.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un usuario' })
  @ApiOkResponse({ type: UserEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.users.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un usuario' })
  @ApiCreatedResponse({ type: UserEntity })
  create(@Body() dto: CreateUserDto): Promise<UserEntity> {
    return this.users.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un usuario' })
  @ApiOkResponse({ type: UserEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.users.update(id, dto);
  }

  @Put(':id/roles')
  @ApiOperation({ summary: 'Reemplaza los roles del usuario' })
  @ApiOkResponse({ type: UserEntity })
  setRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRolesDto,
  ): Promise<UserEntity> {
    return this.users.setRoles(id, dto.roleIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un usuario' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.users.remove(id);
  }
}
