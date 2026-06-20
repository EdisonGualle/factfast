import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CajasService } from './cajas.service';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { AperturaCajaDto } from './dto/apertura-caja.dto';
import { CierreCajaDto } from './dto/cierre-caja.dto';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../autenticacion/strategies/jwt.strategy';

@ApiTags('Cajas y POS')
@ApiBearerAuth('access-token')
@Controller('cajas')
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva caja para POS' })
  @ApiResponse({ status: 201, description: 'Caja creada con éxito' })
  async create(@Body() createCajaDto: CreateCajaDto) {
    return this.cajasService.create(createCajaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cajas' })
  @ApiResponse({ status: 200, description: 'Listado de cajas' })
  async findAll() {
    return this.cajasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una caja' })
  @ApiResponse({ status: 200, description: 'Detalles de la caja' })
  async findOne(@Param('id') id: string) {
    return this.cajasService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una caja' })
  @ApiResponse({ status: 200, description: 'Caja actualizada con éxito' })
  async update(@Param('id') id: string, @Body() updateCajaDto: UpdateCajaDto) {
    return this.cajasService.update(id, updateCajaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una caja (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Caja eliminada con éxito' })
  async remove(@Param('id') id: string) {
    return this.cajasService.remove(id);
  }

  // ─────────────────────────────────────────────
  // ENDPOINTS DE SESIONES DE CAJA
  // ─────────────────────────────────────────────

  @Get(':id/sesion-activa')
  @ApiOperation({ summary: 'Obtener la sesión activa (abierta) de la caja' })
  @ApiResponse({ status: 200, description: 'Sesión activa' })
  async getSesionActiva(@Param('id') id: string) {
    return this.cajasService.getSesionActiva(id);
  }

  @Post(':id/abrir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abrir una sesión de caja' })
  @ApiResponse({ status: 200, description: 'Caja abierta con éxito' })
  async abrirCaja(
    @Param('id') id: string,
    @Body() aperturaDto: AperturaCajaDto,
    @UsuarioActual() user: UsuarioAutenticado,
  ) {
    return this.cajasService.abrirSesion(id, aperturaDto, user.id);
  }

  @Post(':id/cerrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una sesión de caja activa' })
  @ApiResponse({ status: 200, description: 'Caja cerrada con éxito' })
  async cerrarCaja(
    @Param('id') id: string,
    @Body() cierreDto: CierreCajaDto,
    @UsuarioActual() user: UsuarioAutenticado,
  ) {
    return this.cajasService.cerrarSesion(id, cierreDto, user.id, user.rol);
  }
}
