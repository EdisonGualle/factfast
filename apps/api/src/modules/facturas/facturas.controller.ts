import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { CrearFacturaDto } from './dto/crear-factura.dto';
import {
  ItemListadoComprobanteDto,
  RespuestaComprobanteEmitidoDto,
  RespuestaDetalleComprobanteDto,
} from '../../common/dto/respuesta-comprobante.dto';
import { AnularFacturaDto } from './dto/anular-factura.dto';
import {
  ApiAuthResponses,
  ApiPaginatedResponse,
} from '../../common/swagger/api-responses.decorator';

@ApiTags('Facturas')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/facturas')
export class FacturasController {
  constructor(private readonly facturas: FacturasService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir factura electronica' })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description: 'Factura firmada y encolada para autorizacion del SRI',
  })
  @ApiBadRequestResponse({
    description:
      'Error de validacion, punto de emision no corresponde o UUID invalido',
  })
  @ApiNotFoundResponse({
    description: 'Punto de emision o certificado activo no encontrado',
  })
  crear(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() dto: CrearFacturaDto,
  ) {
    return this.facturas.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas de una empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiPaginatedResponse(ItemListadoComprobanteDto)
  @ApiBadRequestResponse({
    description: 'empresaId no es un UUID valido o la paginacion es invalida',
  })
  listar(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.facturas.listar(empresaId, page, limit);
  }

  @Get(':id/xml')
  @ApiOperation({ summary: 'Descargar XML de la factura' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['signed', 'unsigned'],
    example: 'signed',
  })
  @ApiOkResponse({ description: 'Archivo XML firmado o sin firmar' })
  @ApiNotFoundResponse({ description: 'Factura o XML no encontrado' })
  async descargarXml(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type: 'signed' | 'unsigned' = 'signed',
    @Res({ passthrough: true }) response: Response,
  ) {
    const xml = await this.facturas.obtenerArchivoXml(
      empresaId,
      id,
      type === 'unsigned' ? 'unsigned' : 'signed',
    );
    response.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${xml.filename}"`,
    });

    return new StreamableFile(xml.buffer);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar RIDE/PDF de la factura autorizada' })
  @ApiOkResponse({ description: 'Archivo PDF RIDE' })
  @ApiNotFoundResponse({ description: 'Factura o PDF no encontrado' })
  async descargarPdf(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const pdf = await this.facturas.obtenerArchivoPdf(empresaId, id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
    });

    return new StreamableFile(pdf.buffer);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de factura con lineas e impuestos',
  })
  @ApiOkResponse({
    type: RespuestaDetalleComprobanteDto,
    description: 'Factura encontrada',
  })
  @ApiNotFoundResponse({ description: 'Factura no encontrada' })
  @ApiBadRequestResponse({ description: 'empresaId o id no es un UUID valido' })
  obtenerUno(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.facturas.obtenerUno(empresaId, id);
  }

  @Post(':id/anular')
  @ApiOperation({
    summary: 'Anular factura (Genera Nota de Crédito automáticamente)',
  })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description: 'Nota de crédito generada y encolada para autorización',
  })
  @ApiNotFoundResponse({ description: 'Factura no encontrada' })
  @ApiBadRequestResponse({
    description: 'La factura no puede ser anulada en su estado actual',
  })
  anular(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularFacturaDto,
  ) {
    return this.facturas.anular(empresaId, id, dto);
  }
}
