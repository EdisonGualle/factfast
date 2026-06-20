import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CrearPuntoEmisionDto } from './dto/crear-punto-emision.dto';

@Injectable()
export class PuntosEmisionService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(sucursalId: string, dto: CrearPuntoEmisionDto) {
    const existente = await this.prisma.puntoEmision.findUnique({
      where: {
        sucursal_id_codigo: { sucursal_id: sucursalId, codigo: dto.codigo },
      },
    });
    if (existente) {
      throw new ConflictException(
        `El codigo de punto de emision ${dto.codigo} ya existe en esta sucursal`,
      );
    }

    return this.prisma.puntoEmision.create({
      data: {
        sucursal_id: sucursalId,
        codigo: dto.codigo,
        nombre: dto.nombre,
      },
    });
  }

  async listar(sucursalId: string) {
    return this.prisma.puntoEmision.findMany({
      where: { sucursal_id: sucursalId, activo: true, deleted_at: null },
      orderBy: { codigo: 'asc' },
    });
  }

  async obtenerUno(sucursalId: string, puntoEmisionId: string) {
    const punto = await this.prisma.puntoEmision.findFirst({
      where: {
        id: puntoEmisionId,
        sucursal_id: sucursalId,
        activo: true,
        deleted_at: null,
      },
    });
    if (!punto) {
      throw new NotFoundException(
        `Punto de emision ${puntoEmisionId} no encontrado`,
      );
    }
    return punto;
  }

  async eliminar(sucursalId: string, puntoEmisionId: string) {
    await this.obtenerUno(sucursalId, puntoEmisionId);
    return this.prisma.puntoEmision.update({
      where: { id: puntoEmisionId },
      data: { activo: false, deleted_at: new Date() },
    });
  }
}
