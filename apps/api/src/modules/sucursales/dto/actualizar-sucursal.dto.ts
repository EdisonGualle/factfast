import { PartialType, OmitType } from '@nestjs/swagger';
import { CrearSucursalDto } from './crear-sucursal.dto';

/**
 * El codigo de sucursal NO puede modificarse despues de la creacion.
 */
export class ActualizarSucursalDto extends PartialType(
  OmitType(CrearSucursalDto, ['codigo'] as const),
) {}
