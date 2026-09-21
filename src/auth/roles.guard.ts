import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RoleCode } from '../common/constants/domain.js';
import type { RequestConUsuario } from './jwt-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

/** Corre despues de `JwtAuthGuard`: lee los roles del payload del token. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<RoleCode[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requeridos?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestConUsuario>();

    if (!user?.roles.some((rol) => requeridos.includes(rol as RoleCode))) {
      throw new ForbiddenException(
        `Requiere uno de estos roles: ${requeridos.join(', ')}.`,
      );
    }

    return true;
  }
}
