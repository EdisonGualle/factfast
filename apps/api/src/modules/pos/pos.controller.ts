import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { VentaPosDto } from './dto/venta-pos.dto';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../autenticacion/strategies/jwt.strategy';
import { CajaAbiertaGuard } from '../cajas/guards/caja-abierta.guard';

@ApiTags('Cajas y POS')
@ApiBearerAuth('access-token')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('venta')
  @UseGuards(CajaAbiertaGuard)
  @ApiOperation({ summary: 'Registrar una venta rápida en el POS (Descuenta stock y genera factura electrónica)' })
  @ApiResponse({ status: 201, description: 'Venta registrada con éxito' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  @ApiResponse({ status: 403, description: 'Caja cerrada o sin permisos' })
  async registrarVenta(
    @Body() dto: VentaPosDto,
    @UsuarioActual() user: UsuarioAutenticado,
    @Req() request: any,
  ) {
    // El CajaAbiertaGuard ya adjuntó la sesión activa de caja en request.sesionCaja
    const sesionCaja = request.sesionCaja;
    // El guard AccesoEmpresaGuard o el JWT de usuario provee la empresa del usuario
    const empresaId = user.empresa_id;
    if (!empresaId) {
      throw new Error('El usuario no tiene una empresa asignada para facturación');
    }

    return this.posService.registrarVentaPos(empresaId, dto, user.id, sesionCaja);
  }
}
