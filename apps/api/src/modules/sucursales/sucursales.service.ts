import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CrearSucursalDto } from './dto/crear-sucursal.dto';
import { ActualizarSucursalDto } from './dto/actualizar-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(empresaId: string, dto: CrearSucursalDto) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, activo: true, deleted_at: null },
      select: { id: true },
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} no encontrada`);
    }

    const existente = await this.prisma.sucursal.findUnique({
      where: {
        empresa_id_codigo: { empresa_id: empresaId, codigo: dto.codigo },
      },
    });
    if (existente) {
      throw new ConflictException(
        `El codigo de sucursal ${dto.codigo} ya existe en esta empresa`,
      );
    }

    return this.prisma.sucursal.create({
      data: {
        empresa_id: empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        direccion: dto.direccion,
      },
    });
  }

  async listar(empresaId: string) {
    return this.prisma.sucursal.findMany({
      where: { empresa_id: empresaId, activo: true, deleted_at: null },
      include: {
        puntos_emision: { where: { activo: true, deleted_at: null } },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async obtenerUna(empresaId: string, sucursalId: string) {
    const sucursal = await this.prisma.sucursal.findFirst({
      where: {
        id: sucursalId,
        empresa_id: empresaId,
        activo: true,
        deleted_at: null,
      },
      include: { puntos_emision: { where: { activo: true } } },
    });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal ${sucursalId} no encontrada`);
    }
    return sucursal;
  }

  async actualizar(
    empresaId: string,
    sucursalId: string,
    dto: ActualizarSucursalDto,
  ) {
    await this.obtenerUna(empresaId, sucursalId);
    return this.prisma.sucursal.update({
      where: { id: sucursalId },
      data: {
        nombre: dto.nombre,
        direccion: dto.direccion,
      },
    });
  }

  async eliminar(empresaId: string, sucursalId: string) {
    await this.obtenerUna(empresaId, sucursalId);
    return this.prisma.sucursal.update({
      where: { id: sucursalId },
      data: { activo: false, deleted_at: new Date() },
    });
  }
}
