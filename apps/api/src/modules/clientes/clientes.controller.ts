import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@ApiTags('Clientes')
@ApiBearerAuth('access-token')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado con éxito' })
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.createCliente(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los clientes de una empresa' })
  @ApiQuery({ name: 'empresa_id', required: true, description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Listado de clientes' })
  async findAll(@Query('empresa_id') empresaId: string) {
    return this.clientesService.findAllClientes(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un cliente' })
  @ApiResponse({ status: 200, description: 'Detalles del cliente' })
  async findOne(@Param('id') id: string) {
    return this.clientesService.findOneCliente(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado con éxito' })
  async update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.updateCliente(id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Cliente eliminado con éxito' })
  async remove(@Param('id') id: string) {
    return this.clientesService.removeCliente(id);
  }
}
