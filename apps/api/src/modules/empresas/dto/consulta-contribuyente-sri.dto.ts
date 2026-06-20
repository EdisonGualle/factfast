import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbienteSri, RegimenTributario } from './crear-empresa.dto';

/**
 * Sugerencia de payload para POST /v1/empresas
 * basado en los datos publicos del catastro SRI.
 */
export class EmpresaSugeridaDto {
  @ApiProperty({ example: '0993375482001' })
  ruc: string;

  @ApiProperty({ example: 'NEOCAMIONES S.A.S.' })
  razon_social: string;

  @ApiPropertyOptional({ example: 'NEOCAMIONES S.A.S.', nullable: true })
  nombre_comercial?: string | null;

  @ApiProperty({ enum: RegimenTributario, example: RegimenTributario.GENERAL })
  regimen_tributario: RegimenTributario;

  @ApiProperty({ enum: AmbienteSri, example: AmbienteSri.PRUEBAS })
  ambiente_sri: AmbienteSri;

  @ApiPropertyOptional({ example: null, nullable: true })
  direccion_matriz?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  telefono?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  correo?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  numero_resolucion?: string | null;

  @ApiProperty({ example: true })
  obligado_contabilidad: boolean;
}

/**
 * Respuesta del endpoint GET /v1/empresas/buscar-ruc/:ruc
 * Espeja los campos del catastro SRI publico.
 */
export class RespuestaConsultaContribuyenteDto {
  @ApiProperty({ example: '0993375482001' })
  numeroRuc: string;

  @ApiProperty({ example: 'NEOCAMIONES S.A.S.' })
  razonSocial: string;

  @ApiProperty({ example: 'ACTIVO' })
  estadoContribuyenteRuc: string;

  @ApiPropertyOptional({
    example: 'VENTA DE VEHICULOS NUEVOS Y USADOS',
    nullable: true,
  })
  actividadEconomicaPrincipal?: string | null;

  @ApiPropertyOptional({ example: 'SOCIEDAD', nullable: true })
  tipoContribuyente?: string | null;

  @ApiPropertyOptional({ example: 'GENERAL', nullable: true })
  regimen?: string | null;

  @ApiPropertyOptional({ example: 'NEGOCIO POPULAR', nullable: true })
  categoria?: string | null;

  @ApiProperty({ example: true })
  obligadoLlevarContabilidad: boolean;

  @ApiProperty({ example: false })
  agenteRetencion: boolean;

  @ApiProperty({ example: false })
  contribuyenteEspecial: boolean;

  @ApiProperty({
    type: EmpresaSugeridaDto,
    description: 'Payload sugerido para crear la empresa via POST /v1/empresas',
  })
  empresa_sugerida: EmpresaSugeridaDto;
}
