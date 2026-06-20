import { SetMetadata } from '@nestjs/common';

export const CLAVE_ROLES = 'rolesPermitidos';

/**
 * Restringe un endpoint a uno o mas roles. Se evalua mediante el RolesGuard global.
 */
export const Roles = (...roles: string[]) => SetMetadata(CLAVE_ROLES, roles);
