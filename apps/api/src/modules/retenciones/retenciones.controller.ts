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
} from '@nestjs/common';
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
import { RetencionesService } from './retenciones.service';
import { CrearRetencionDto } from './dto/crear-retencion.dto';
import {
  ItemListadoComprobanteDto,
  RespuestaComprobanteEmitidoDto,
  RespuestaDetalleComprobanteDto,
} from '../../common/dto/respuesta-comprobante.dto';
import {
  ApiAuthResponses,
  ApiPaginatedResponse,
} from '../../common/swagger/api-responses.decorator';

@ApiTags('Retenciones')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/retenciones')
export class RetencionesController {
  constructor(private readonly retenciones: RetencionesService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir comprobante de retencion electronico' })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description: 'Retencion firmada y encolada para autorizacion del SRI',
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
    @Body() dto: CrearRetencionDto,
  ) {
    return this.retenciones.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar comprobantes de retencion' })
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
    return this.retenciones.listar(empresaId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de retencion con desglose de impuestos',
  })
  @ApiOkResponse({
    type: RespuestaDetalleComprobanteDto,
    description: 'Retencion encontrada',
  })
  @ApiNotFoundResponse({ description: 'Retencion no encontrada' })
  @ApiBadRequestResponse({ description: 'empresaId o id no es un UUID valido' })
  obtenerUno(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.retenciones.obtenerUno(empresaId, id);
  }
}
