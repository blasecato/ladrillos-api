import { SetMetadata } from '@nestjs/common';

import type { RoleCode } from '../common/constants/domain.js';

export const ROLES_KEY = 'roles';

/** Restringe el endpoint a los `roles.code` indicados. Lo aplica `RolesGuard`. */
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
