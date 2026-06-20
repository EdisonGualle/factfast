import {
  Controller,
  Get,
  Post,
  Put,
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
import { SucursalesService } from './sucursales.service';
import { CrearSucursalDto } from './dto/crear-sucursal.dto';
import { ActualizarSucursalDto } from './dto/actualizar-sucursal.dto';
import { RespuestaSucursalDto } from './dto/respuesta-sucursal.dto';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';

@ApiTags('Sucursales')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/sucursales')
export class SucursalesController {
  constructor(private readonly sucursales: SucursalesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear sucursal para una empresa' })
  @ApiCreatedResponse({
    type: RespuestaSucursalDto,
    description: 'Sucursal creada correctamente',
  })
  @ApiConflictResponse({
    description: 'El codigo de sucursal ya existe en esta empresa',
  })
  @ApiBadRequestResponse({
    description: 'Error de validacion o empresaId no es un UUID valido',
  })
  crear(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() dto: CrearSucursalDto,
  ) {
    return this.sucursales.crear(empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sucursales de una empresa' })
  @ApiOkResponse({
    type: [RespuestaSucursalDto],
    description: 'Sucursales activas con sus puntos de emision activos',
  })
  @ApiBadRequestResponse({ description: 'empresaId no es un UUID valido' })
  listar(@Param('empresaId', ParseUUIDPipe) empresaId: string) {
    return this.sucursales.listar(empresaId);
  }

  @Get(':sucursalId')
  @ApiOperation({
    summary: 'Obtener detalle de sucursal con sus puntos de emision',
  })
  @ApiOkResponse({
    type: RespuestaSucursalDto,
    description: 'Sucursal encontrada',
  })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  @ApiBadRequestResponse({
    description: 'empresaId o sucursalId no es un UUID valido',
  })
  obtenerUna(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
  ) {
    return this.sucursales.obtenerUna(empresaId, sucursalId);
  }

  @Put(':sucursalId')
  @ApiOperation({ summary: 'Actualizar informacion de sucursal' })
  @ApiOkResponse({
    type: RespuestaSucursalDto,
    description: 'Sucursal actualizada',
  })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  @ApiBadRequestResponse({
    description: 'Error de validacion o parametro de ruta no es UUID valido',
  })
  actualizar(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Body() dto: ActualizarSucursalDto,
  ) {
    return this.sucursales.actualizar(empresaId, sucursalId, dto);
  }

  @Delete(':sucursalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar sucursal' })
  @ApiNoContentResponse({ description: 'Sucursal desactivada' })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  @ApiBadRequestResponse({
    description: 'empresaId o sucursalId no es un UUID valido',
  })
  eliminar(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
  ) {
    return this.sucursales.eliminar(empresaId, sucursalId);
  }
}
