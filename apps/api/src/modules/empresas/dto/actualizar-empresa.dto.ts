import { PartialType, OmitType } from '@nestjs/swagger';
import { CrearEmpresaDto } from './crear-empresa.dto';

/**
 * DTO de actualizacion de empresa.
 * El RUC NO puede modificarse despues de la creacion.
 */
export class ActualizarEmpresaDto extends PartialType(
  OmitType(CrearEmpresaDto, ['ruc'] as const),
) {}
