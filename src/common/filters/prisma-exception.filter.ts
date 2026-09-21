import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { Prisma } from '../../generated/prisma/client.js';

/**
 * Traduce los errores conocidos de Prisma al cuerpo de error del contrato
 * (`{ message, code }`), en vez de dejar que salgan como 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const target =
          (exception.meta?.target as string[] | undefined)?.join(', ') ??
          'campo';
        response.status(HttpStatus.CONFLICT).json({
          message: `Ya existe un registro con ese ${target}.`,
          code: exception.code,
        });
        return;
      }
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          message: 'El registro no existe.',
          code: exception.code,
        });
        return;
      case 'P2003':
        response.status(HttpStatus.BAD_REQUEST).json({
          message: 'Referencia invalida: la entidad relacionada no existe.',
          code: exception.code,
        });
        return;
      default:
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Error de base de datos.',
          code: exception.code,
        });
    }
  }
}
