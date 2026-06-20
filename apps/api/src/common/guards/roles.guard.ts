import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLAVE_ROLES } from '../decorators/roles.decorator';
import { UsuarioAutenticado } from '../../modules/autenticacion/strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      CLAVE_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // SUPERADMIN puede ejecutar cualquier accion. ADMIN supera permisos USUARIO.
    if (user.rol === 'SUPERADMIN') return true;
    if (user.rol === 'ADMIN' && !rolesRequeridos.includes('SUPERADMIN'))
      return true;

    if (!rolesRequeridos.includes(user.rol)) {
      throw new ForbiddenException('Permisos insuficientes');
    }
    return true;
  }
}
