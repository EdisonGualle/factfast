import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CLAVE_RUTA_PUBLICA } from '../decorators/publico.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean>(
      CLAVE_RUTA_PUBLICA,
      [context.getHandler(), context.getClass()],
    );
    if (esPublico) return true;
    return super.canActivate(context);
  }
}
