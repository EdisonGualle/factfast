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
  BadRequestException,
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
import { EmpresasService } from './empresas.service';
import { ContribuyenteSriService } from './contribuyente-sri.service';
import { CrearEmpresaDto } from './dto/crear-empresa.dto';
import { ActualizarEmpresaDto } from './dto/actualizar-empresa.dto';
import { RespuestaEmpresaDto } from './dto/respuesta-empresa.dto';
import { RespuestaConsultaContribuyenteDto } from './dto/consulta-contribuyente-sri.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioAutenticado } from '../../modules/autenticacion/strategies/jwt.strategy';

@ApiTags('Empresas')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly empresas: EmpresasService,
    private readonly contribuyenteSri: ContribuyenteSriService,
  ) {}

  @Get('buscar-ruc/:ruc')
  @Roles('SUPERADMIN', 'ADMIN', 'OWNER_TENANT')
  @ApiOperation({
    summary: 'Consultar contribuyente por RUC en el SRI',
    description:
      'Consulta el catastro publico del SRI y devuelve los datos normalizados, incluyendo un payload sugerido (`empresa_sugerida`) para crear la empresa.',
  })
  @ApiOkResponse({
    type: RespuestaConsultaContribuyenteDto,
    description: 'Informacion del contribuyente encontrada',
  })
  @ApiBadRequestResponse({ description: 'RUC invalido' })
  @ApiNotFoundResponse({ description: 'RUC no encontrado en el SRI' })
  consultarPorRuc(@Param('ruc') ruc: string) {
    return this.contribuyenteSri.consultarPorRuc(ruc);
  }

  @Post()
  @Roles('SUPERADMIN', 'OWNER_TENANT')
  @ApiOperation({
    summary: 'Registrar una nueva empresa',
    description:
      'Crea una empresa o contribuyente en el sistema. El RUC se valida con el algoritmo oficial Modulo 11 del SRI.',
  })
  @ApiCreatedResponse({
    type: RespuestaEmpresaDto,
    description: 'Empresa creada correctamente',
  })
  @ApiConflictResponse({ description: 'El RUC ya esta registrado' })
  @ApiBadRequestResponse({ description: 'RUC invalido o error de validacion' })
  crear(
    @Body() dto: CrearEmpresaDto & { tenant_id?: string },
    @UsuarioActual() usuario?: any,
  ) {
    const tenantId = usuario?.tenant_id || dto.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('El tenant_id es requerido');
    }
    return this.empresas.crear(dto, tenantId);
  }

  @Get()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Listar empresas activas' })
  @ApiOkResponse({
    type: [RespuestaEmpresaDto],
    description: 'Listado de empresas',
  })
  listar() {
    return this.empresas.listar();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de empresa',
    description: 'Retorna la empresa con sus sucursales activas.',
  })
  @ApiOkResponse({
    type: RespuestaEmpresaDto,
    description: 'Empresa encontrada',
  })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  obtenerUna(@Param('id', ParseUUIDPipe) id: string) {
    return this.empresas.obtenerUna(id);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Actualizar informacion de empresa',
    description: 'El RUC NO puede modificarse despues de la creacion.',
  })
  @ApiOkResponse({
    type: RespuestaEmpresaDto,
    description: 'Empresa actualizada',
  })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  @ApiBadRequestResponse({ description: 'Error de validacion' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEmpresaDto,
  ) {
    return this.empresas.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPERADMIN')
  @ApiOperation({
    summary: 'Desactivar empresa',
    description:
      'Marca la empresa como inactiva (soft delete). La informacion se conserva para auditoria.',
  })
  @ApiNoContentResponse({ description: 'Empresa desactivada' })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.empresas.eliminar(id);
  }
}
