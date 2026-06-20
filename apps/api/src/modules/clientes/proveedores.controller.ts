import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@ApiTags('Proveedores')
@ApiBearerAuth('access-token')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado con éxito' })
  async create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.clientesService.createProveedor(createProveedorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los proveedores de una empresa' })
  @ApiQuery({ name: 'empresa_id', required: true, description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Listado de proveedores' })
  async findAll(@Query('empresa_id') empresaId: string) {
    return this.clientesService.findAllProveedores(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un proveedor' })
  @ApiResponse({ status: 200, description: 'Detalles del proveedor' })
  async findOne(@Param('id') id: string) {
    return this.clientesService.findOneProveedor(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado con éxito' })
  async update(@Param('id') id: string, @Body() updateProveedorDto: UpdateProveedorDto) {
    return this.clientesService.updateProveedor(id, updateProveedorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un proveedor (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Proveedor eliminado con éxito' })
  async remove(@Param('id') id: string) {
    return this.clientesService.removeProveedor(id);
  }
}
