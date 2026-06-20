import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { Publico } from '../../common/decorators/publico.decorator';

class ItemCatalogoDto {
  @ApiProperty({ example: '01' })
  codigo: string;

  @ApiProperty({ example: 'Descripcion del item' })
  descripcion: string;
}

class TarifaImpuestoDto {
  @ApiProperty({ example: '4' })
  codigo: string;

  @ApiProperty({ example: 15, nullable: true })
  tarifa: number | null;

  @ApiProperty({ example: 'IVA 15% (vigente)' })
  descripcion: string;
}

class TarifaRetencionDto {
  @ApiProperty({ example: '303' })
  codigo: string;

  @ApiProperty({ example: 'Honorarios profesionales y dietas' })
  descripcion: string;

  @ApiProperty({ example: 10 })
  tarifa: number;
}

@ApiTags('Catalogos')
@Publico()
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  @Get('tipos-identificacion')
  @ApiOperation({
    summary: 'Tabla 6 SRI - tipos de identificacion del comprador',
    description:
      'Codigos usados en `tipoIdentificacionComprador` de los comprobantes.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de tipos de identificacion',
  })
  obtenerTiposIdentificacion() {
    return this.catalogos.obtenerTiposIdentificacion();
  }

  @Get('tipos-comprobante')
  @ApiOperation({
    summary: 'Tabla 2 SRI - tipos de comprobantes electronicos',
    description: 'Codigos oficiales para cada tipo de documento (`codDoc`).',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de tipos de comprobante',
  })
  obtenerTiposComprobante() {
    return this.catalogos.obtenerTiposComprobante();
  }

  @Get('formas-pago')
  @ApiOperation({
    summary: 'Tabla 24 SRI - formas de pago aceptadas',
    description: 'Codigos usados en `formaPago` de las facturas.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de formas de pago',
  })
  obtenerFormasPago() {
    return this.catalogos.obtenerFormasPago();
  }

  @Get('tarifas-iva')
  @ApiOperation({
    summary: 'Tabla 17 SRI - tarifas de IVA',
    description:
      'Codigos de tarifas de IVA. Use `codigo` como `codigoPorcentaje` al construir impuestos por linea. Tarifa vigente: codigo 4 = 15%.',
  })
  @ApiOkResponse({
    type: [TarifaImpuestoDto],
    description: 'Listado de tarifas de IVA',
  })
  obtenerTarifasIva() {
    return this.catalogos.obtenerTarifasIva();
  }

  @Get('codigos-impuesto')
  @ApiOperation({
    summary: 'Tabla 13 SRI - codigos de tipos de impuesto',
    description:
      'Usado en el campo `codigo` de cada impuesto. 2=IVA, 3=ICE, 5=IRBPNR.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de codigos de impuesto',
  })
  obtenerCodigosImpuesto() {
    return this.catalogos.obtenerCodigosImpuesto();
  }

  @Get('retenciones-renta')
  @ApiOperation({
    summary: 'Tabla 18 SRI - porcentajes de retencion en la fuente',
    description:
      'Use `codigo` como `codigoRetencion` y `tarifa` como `porcentajeRetener`.',
  })
  @ApiOkResponse({
    type: [TarifaRetencionDto],
    description: 'Listado de retenciones en la fuente',
  })
  obtenerRetencionesRenta() {
    return this.catalogos.obtenerRetencionesRenta();
  }

  @Get('retenciones-iva')
  @ApiOperation({
    summary: 'Tabla 19 SRI - porcentajes de retencion de IVA',
    description: 'Porcentajes usados en comprobantes de retencion de IVA.',
  })
  @ApiOkResponse({
    type: [TarifaRetencionDto],
    description: 'Listado de retenciones de IVA',
  })
  obtenerRetencionesIva() {
    return this.catalogos.obtenerRetencionesIva();
  }

  @Get('motivos-traslado')
  @ApiOperation({
    summary: 'Motivos de traslado para guias de remision',
    description: 'Usado en `motivoTraslado` de las guias de remision.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de motivos de traslado',
  })
  obtenerMotivosTraslado() {
    return this.catalogos.obtenerMotivosTraslado();
  }

  @Get('tipos-transporte')
  @ApiOperation({ summary: 'Tipos de transporte para guias de remision' })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de tipos de transporte',
  })
  obtenerTiposTransporte() {
    return this.catalogos.obtenerTiposTransporte();
  }

  @Get('motivos-nota-credito')
  @ApiOperation({
    summary: 'Tabla 26 SRI - motivos de emision de notas de credito',
    description: 'Usado en el campo `motivo` de las notas de credito.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de motivos de nota de credito',
  })
  obtenerMotivosNotaCredito() {
    return this.catalogos.obtenerMotivosNotaCredito();
  }

  @Get('regimenes-tributarios')
  @ApiOperation({
    summary: 'Regimenes tributarios del contribuyente',
    description:
      'Usado al registrar una empresa. Determina campos del XML como `regimenMicroempresas`.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de regimenes tributarios',
  })
  obtenerRegimenesTributarios() {
    return this.catalogos.obtenerRegimenesTributarios();
  }

  @Get('ambientes-sri')
  @ApiOperation({
    summary: 'Ambientes SRI',
    description:
      '1 = Pruebas (celcer.sri.gob.ec), 2 = Produccion (cel.sri.gob.ec).',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de ambientes SRI',
  })
  obtenerAmbientesSri() {
    return this.catalogos.obtenerAmbientesSri();
  }

  @Get('tipos-emision')
  @ApiOperation({
    summary: 'Tipos de emision',
    description:
      '1 = Normal, 2 = Offline (indisponibilidad del sistema). Use 1 para operaciones normales.',
  })
  @ApiOkResponse({
    type: [ItemCatalogoDto],
    description: 'Listado de tipos de emision',
  })
  obtenerTiposEmision() {
    return this.catalogos.obtenerTiposEmision();
  }
}
