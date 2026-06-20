import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ValidateSlugDto } from './dto/validate-slug.dto';
import { Publico } from '../../common/decorators/publico.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Publico()
  @Post('registro')
  @ApiOperation({ summary: 'Registrar y aprovisionar un nuevo Tenant con su usuario administrador' })
  @ApiResponse({ status: 201, description: 'Tenant aprovisionado con éxito' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Slug o correo ya en uso' })
  async registrar(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.provisionTenant(createTenantDto);
  }

  @Publico()
  @Get('validar-slug')
  @ApiOperation({ summary: 'Verificar la disponibilidad de un slug para un nuevo Tenant' })
  @ApiResponse({ status: 200, description: 'Resultado de disponibilidad' })
  async validarSlug(@Query() query: ValidateSlugDto) {
    return this.tenantsService.validateSlugAvailability(query.slug);
  }

  @ApiBearerAuth('access-token')
  @Roles(RolUsuario.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un Tenant y su plan actual (Solo Superadmin)' })
  @ApiResponse({ status: 200, description: 'Datos del Tenant' })
  @ApiResponse({ status: 400, description: 'Tenant no encontrado' })
  async obtenerDetalle(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
}
