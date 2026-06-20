import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from '../../modules/autenticacion/strategies/jwt.strategy';

/**
 * Inyecta el usuario autenticado (req.user) en un parametro del controlador.
 * Permite extraer un campo concreto: @UsuarioActual('id') o el objeto completo.
 */
export const UsuarioActual = createParamDecorator(
  (campo: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario: UsuarioAutenticado | undefined = request.user;
    return campo ? usuario?.[campo] : usuario;
  },
);
