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
import { NotasDebitoService } from './notas-debito.service';
import { CrearNotaDebitoDto } from './dto/crear-nota-debito.dto';
import {
  ItemListadoComprobanteDto,
  RespuestaComprobanteEmitidoDto,
  RespuestaDetalleComprobanteDto,
} from '../../common/dto/respuesta-comprobante.dto';
import {
  ApiAuthResponses,
  ApiPaginatedResponse,
} from '../../common/swagger/api-responses.decorator';

@ApiTags('Notas de debito')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/notas-debito')
export class NotasDebitoController {
  constructor(private readonly notasDebito: NotasDebitoService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir nota de debito electronica' })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description: 'Nota de debito firmada y encolada para autorizacion del SRI',
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
    @Body() dto: CrearNotaDebitoDto,
  ) {
    return this.notasDebito.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notas de debito' })
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
    return this.notasDebito.listar(empresaId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de nota de debito' })
  @ApiOkResponse({
    type: RespuestaDetalleComprobanteDto,
    description: 'Nota de debito encontrada',
  })
  @ApiNotFoundResponse({ description: 'Nota de debito no encontrada' })
  @ApiBadRequestResponse({ description: 'empresaId o id no es un UUID valido' })
  obtenerUno(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notasDebito.obtenerUno(empresaId, id);
  }
}
