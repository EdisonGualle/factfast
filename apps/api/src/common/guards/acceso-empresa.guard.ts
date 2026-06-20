import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsuarioAutenticado } from '../../modules/autenticacion/strategies/jwt.strategy';

/**
 * Garantiza que un usuario solo acceda a recursos de su propia empresa
 * cuando la ruta contiene el parametro :empresaId. SUPERADMIN omite la validacion.
 */
@Injectable()
export class AccesoEmpresaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: UsuarioAutenticado;
      params: Record<string, string>;
    }>();
    const { user, params } = request;

    // Si la ruta no es por empresa o el usuario no esta autenticado, no aplica
    if (!user || !params.empresaId) {
      return true;
    }

    if (user.rol === 'SUPERADMIN') {
      return true;
    }

    if (user.empresa_id !== params.empresaId) {
      throw new ForbiddenException(
        'No tiene acceso a los recursos de esta empresa',
      );
    }

    return true;
  }
}
