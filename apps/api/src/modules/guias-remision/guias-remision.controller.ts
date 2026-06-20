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
import { GuiasRemisionService } from './guias-remision.service';
import { CrearGuiaRemisionDto } from './dto/crear-guia-remision.dto';
import {
  ItemListadoComprobanteDto,
  RespuestaComprobanteEmitidoDto,
  RespuestaDetalleComprobanteDto,
} from '../../common/dto/respuesta-comprobante.dto';
import {
  ApiAuthResponses,
  ApiPaginatedResponse,
} from '../../common/swagger/api-responses.decorator';

@ApiTags('Guias de remision')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/guias-remision')
export class GuiasRemisionController {
  constructor(private readonly guiasRemision: GuiasRemisionService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir guia de remision electronica' })
  @ApiCreatedResponse({
    type: RespuestaComprobanteEmitidoDto,
    description:
      'Guia de remision firmada y encolada para autorizacion del SRI',
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
    @Body() dto: CrearGuiaRemisionDto,
  ) {
    return this.guiasRemision.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar guias de remision' })
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
    return this.guiasRemision.listar(empresaId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de guia de remision' })
  @ApiOkResponse({
    type: RespuestaDetalleComprobanteDto,
    description: 'Guia de remision encontrada',
  })
  @ApiNotFoundResponse({ description: 'Guia de remision no encontrada' })
  @ApiBadRequestResponse({ description: 'empresaId o id no es un UUID valido' })
  obtenerUno(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.guiasRemision.obtenerUno(empresaId, id);
  }
}
