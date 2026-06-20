import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@ApiTags('Categorías de Productos')
@ApiBearerAuth('access-token')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada con éxito' })
  async create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.productosService.createCategoria(createCategoriaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías de una empresa' })
  @ApiQuery({ name: 'empresa_id', required: true, description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  async findAll(@Query('empresa_id') empresaId: string) {
    return this.productosService.findAllCategorias(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una categoría' })
  @ApiResponse({ status: 200, description: 'Detalles de la categoría' })
  async findOne(@Param('id') id: string) {
    return this.productosService.findOneCategoria(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada con éxito' })
  async update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoriaDto) {
    return this.productosService.updateCategoria(id, updateCategoriaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada con éxito' })
  async remove(@Param('id') id: string) {
    return this.productosService.removeCategoria(id);
  }
}
