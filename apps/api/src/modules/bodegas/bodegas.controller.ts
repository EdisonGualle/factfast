import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BodegasService } from './bodegas.service';
import { CreateBodegaDto } from './dto/create-bodega.dto';
import { UpdateBodegaDto } from './dto/update-bodega.dto';
import { RegistrarMovimientoDto } from './dto/registrar-movimiento.dto';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../autenticacion/strategies/jwt.strategy';

@ApiTags('Bodegas e Inventario')
@ApiBearerAuth('access-token')
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly bodegasService: BodegasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva bodega' })
  @ApiResponse({ status: 201, description: 'Bodega creada con éxito' })
  async create(@Body() createBodegaDto: CreateBodegaDto) {
    return this.bodegasService.create(createBodegaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las bodegas' })
  @ApiResponse({ status: 200, description: 'Listado de bodegas' })
  async findAll() {
    return this.bodegasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una bodega' })
  @ApiResponse({ status: 200, description: 'Detalles de la bodega' })
  async findOne(@Param('id') id: string) {
    return this.bodegasService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar detalles de una bodega' })
  @ApiResponse({ status: 200, description: 'Bodega actualizada con éxito' })
  async update(@Param('id') id: string, @Body() updateBodegaDto: UpdateBodegaDto) {
    return this.bodegasService.update(id, updateBodegaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una bodega (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Bodega eliminada con éxito' })
  async remove(@Param('id') id: string) {
    return this.bodegasService.remove(id);
  }

  // ─────────────────────────────────────────────
  // ENDPOINTS DE STOCK E INVENTARIO (KARDEX)
  // ─────────────────────────────────────────────

  @Get('producto/:productoId/stock')
  @ApiOperation({ summary: 'Obtener el stock de un producto distribuido en todas las bodegas del tenant' })
  @ApiResponse({ status: 200, description: 'Distribución de stock' })
  async getStockProducto(@Param('productoId') productoId: string) {
    return this.bodegasService.getStocksByProducto(productoId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Registrar un movimiento de inventario (Entrada / Salida / Ajuste) - Kardex' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado con éxito' })
  async registrarMovimiento(
    @Body() dto: RegistrarMovimientoDto,
    @UsuarioActual() user: UsuarioAutenticado,
  ) {
    return this.bodegasService.registrarMovimiento(dto, user.id);
  }

  @Get('producto/:productoId/kardex')
  @ApiOperation({ summary: 'Consultar el historial de movimientos (Kardex) de un producto' })
  @ApiQuery({ name: 'bodega_id', required: false, description: 'Filtrar opcionalmente por bodega' })
  @ApiResponse({ status: 200, description: 'Historial de movimientos' })
  async obtenerKardex(
    @Param('productoId') productoId: string,
    @Query('bodega_id') bodegaId?: string,
  ) {
    return this.bodegasService.obtenerKardex(productoId, bodegaId);
  }
}
