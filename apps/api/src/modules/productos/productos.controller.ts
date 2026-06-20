import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@ApiTags('Productos')
@ApiBearerAuth('access-token')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto o servicio' })
  @ApiResponse({ status: 201, description: 'Producto creado con éxito' })
  async create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.createProducto(createProductoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los productos de una empresa' })
  @ApiQuery({ name: 'empresa_id', required: true, description: 'ID de la empresa' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o código' })
  @ApiResponse({ status: 200, description: 'Listado de productos' })
  async findAll(
    @Query('empresa_id') empresaId: string,
    @Query('search') search?: string,
  ) {
    return this.productosService.findAllProductos(empresaId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un producto' })
  @ApiResponse({ status: 200, description: 'Detalles del producto' })
  async findOne(@Param('id') id: string) {
    return this.productosService.findOneProducto(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto o servicio' })
  @ApiResponse({ status: 200, description: 'Producto actualizado con éxito' })
  async update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.updateProducto(id, updateProductoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado con éxito' })
  async remove(@Param('id') id: string) {
    return this.productosService.removeProducto(id);
  }
}
