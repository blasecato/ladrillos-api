import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '../users/dto/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, SessionDto } from './dto/auth.dto.js';
import { JwtAuthGuard, type RequestConUsuario } from './jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesion con username o email' })
  @ApiOkResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  login(@Body() dto: LoginDto): Promise<SessionDto> {
    return this.auth.login(dto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registra un usuario con rol client y devuelve su sesion',
  })
  @ApiCreatedResponse({ type: SessionDto })
  register(@Body() dto: RegisterDto): Promise<SessionDto> {
    return this.auth.register(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario de la sesion actual' })
  @ApiOkResponse({ type: UserEntity })
  profile(@Req() request: RequestConUsuario): Promise<UserEntity> {
    return this.users.findOne(request.user!.sub);
  }
}
