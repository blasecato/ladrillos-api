import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service.js';

export class HealthDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: string;

  @ApiProperty({
    example: true,
    description: 'La consulta de prueba a Postgres respondio',
  })
  database!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de la API y de su conexion a base de datos',
  })
  @ApiOkResponse({ type: HealthDto })
  async check(): Promise<HealthDto> {
    let database = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = false;
    }

    return {
      status: database ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
