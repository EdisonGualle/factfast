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
import { NotasCreditoService } from './notas-credito.service';
import { CrearNotaCreditoDto } from './dto/crear-nota-credito.dto';
import {
  ItemListadoComprobanteDto,
  RespuestaComprobanteEmitidoDto,
  RespuestaDetalleComprobanteDto,
} from '../../common/dto/respuesta-comprobante.dto';
import {
  ApiAuthResponses,
  ApiPaginatedResponse,
} from '../../common/swagger/api-responses.decorator';

@ApiTags('Notas de credito')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/notas-credito')
export class NotasCreditoController {
  constructor(private readonly notasCredito: NotasCreditoService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir nota de credito electronica' })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description: 'Nota de credito firmada y encolada para autorizacion del SRI',
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
    @Body() dto: CrearNotaCreditoDto,
  ) {
    return this.notasCredito.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notas de credito' })
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
    return this.notasCredito.listar(empresaId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de nota de credito' })
  @ApiOkResponse({
    type: RespuestaDetalleComprobanteDto,
    description: 'Nota de credito encontrada',
  })
  @ApiNotFoundResponse({ description: 'Nota de credito no encontrada' })
  @ApiBadRequestResponse({ description: 'empresaId o id no es un UUID valido' })
  obtenerUno(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notasCredito.obtenerUno(empresaId, id);
  }
}
