import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { PuntosEmisionService } from './puntos-emision.service';
import { CrearPuntoEmisionDto } from './dto/crear-punto-emision.dto';
import { RespuestaPuntoEmisionDto } from './dto/respuesta-punto-emision.dto';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';

@ApiTags('Puntos de emision')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('sucursales/:sucursalId/puntos-emision')
export class PuntosEmisionController {
  constructor(private readonly puntosEmision: PuntosEmisionService) {}

  @Post()
  @ApiOperation({ summary: 'Crear punto de emision (caja) para una sucursal' })
  @ApiCreatedResponse({
    type: RespuestaPuntoEmisionDto,
    description: 'Punto de emision creado correctamente',
  })
  @ApiConflictResponse({
    description: 'El codigo del punto de emision ya existe en esta sucursal',
  })
  @ApiBadRequestResponse({
    description: 'Error de validacion o sucursalId no es un UUID valido',
  })
  crear(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Body() dto: CrearPuntoEmisionDto,
  ) {
    return this.puntosEmision.crear(sucursalId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar puntos de emision de una sucursal' })
  @ApiOkResponse({
    type: [RespuestaPuntoEmisionDto],
    description: 'Puntos de emision activos de la sucursal',
  })
  @ApiBadRequestResponse({ description: 'sucursalId no es un UUID valido' })
  listar(@Param('sucursalId', ParseUUIDPipe) sucursalId: string) {
    return this.puntosEmision.listar(sucursalId);
  }

  @Get(':puntoEmisionId')
  @ApiOperation({
    summary:
      'Obtener detalle del punto de emision con sus secuenciales actuales',
  })
  @ApiOkResponse({
    type: RespuestaPuntoEmisionDto,
    description: 'Punto de emision encontrado',
  })
  @ApiNotFoundResponse({ description: 'Punto de emision no encontrado' })
  @ApiBadRequestResponse({
    description: 'sucursalId o puntoEmisionId no es un UUID valido',
  })
  obtenerUno(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Param('puntoEmisionId', ParseUUIDPipe) puntoEmisionId: string,
  ) {
    return this.puntosEmision.obtenerUno(sucursalId, puntoEmisionId);
  }

  @Delete(':puntoEmisionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar punto de emision' })
  @ApiNoContentResponse({ description: 'Punto de emision desactivado' })
  @ApiNotFoundResponse({ description: 'Punto de emision no encontrado' })
  @ApiBadRequestResponse({
    description: 'sucursalId o puntoEmisionId no es un UUID valido',
  })
  eliminar(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Param('puntoEmisionId', ParseUUIDPipe) puntoEmisionId: string,
  ) {
    return this.puntosEmision.eliminar(sucursalId, puntoEmisionId);
  }
}
