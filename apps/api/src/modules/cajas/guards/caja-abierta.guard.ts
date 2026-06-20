import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CajasService } from '../cajas.service';

@Injectable()
export class CajaAbiertaGuard implements CanActivate {
  constructor(private readonly cajasService: CajasService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Obtener cajaId desde headers, query o body
    const cajaId = 
      request.headers['x-caja-id'] || 
      request.query.caja_id || 
      request.body.caja_id;

    if (!cajaId || typeof cajaId !== 'string') {
      throw new BadRequestException('Se requiere especificar el ID de caja (x-caja-id en headers, o caja_id en query/body)');
    }

    // Buscar sesión activa de la caja
    const sesion = await this.cajasService.getSesionActiva(cajaId);
    
    if (!sesion) {
      throw new ForbiddenException('Debe abrir la caja antes de registrar transacciones en el POS');
    }

    // Adjuntar la sesión activa al request para uso en controladores
    request.sesionCaja = sesion;

    return true;
  }
}
