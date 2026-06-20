import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { AperturaCajaDto } from './dto/apertura-caja.dto';
import { CierreCajaDto } from './dto/cierre-caja.dto';

@Injectable()
export class CajasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCajaDto: CreateCajaDto) {
    // Verificar que la sucursal exista (el tenant scoping de Prisma validará el tenant)
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id: createCajaDto.sucursal_id, deleted_at: null },
    });

    if (!sucursal) {
      throw new NotFoundException('La sucursal especificada no existe');
    }

    return this.prisma.caja.create({
      data: {
        nombre: createCajaDto.nombre,
        sucursal_id: createCajaDto.sucursal_id,
        activo: true,
      },
    });
  }

  async findAll() {
    return this.prisma.caja.findMany({
      where: { deleted_at: null },
      include: { sucursal: true },
    });
  }

  async findOne(id: string) {
    const caja = await this.prisma.caja.findFirst({
      where: { id, deleted_at: null },
      include: { sucursal: true },
    });

    if (!caja) {
      throw new NotFoundException('La caja especificada no existe');
    }

    return caja;
  }

  async update(id: string, updateCajaDto: UpdateCajaDto) {
    await this.findOne(id);

    return this.prisma.caja.update({
      where: { id },
      data: updateCajaDto,
    });
  }

  async remove(id: string) {
    const caja = await this.findOne(id);

    // Verificar si hay sesiones abiertas
    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { caja_id: id, cerrada_en: null },
    });

    if (sesionAbierta) {
      throw new ConflictException('No se puede eliminar una caja con una sesión abierta activa');
    }

    // Soft delete
    return this.prisma.caja.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });
  }

  // ─────────────────────────────────────────────
  // GESTIÓN DE SESIONES DE CAJA
  // ─────────────────────────────────────────────

  async getSesionActiva(cajaId: string) {
    return this.prisma.sesionCaja.findFirst({
      where: { caja_id: cajaId, cerrada_en: null },
      include: { caja: true },
    });
  }

  async abrirSesion(cajaId: string, dto: AperturaCajaDto, userId: string) {
    const caja = await this.findOne(cajaId);

    if (!caja.activo) {
      throw new ConflictException('La caja está inactiva y no se puede abrir');
    }

    // Validar si ya hay una sesión abierta
    const sesionActiva = await this.getSesionActiva(cajaId);
    if (sesionActiva) {
      throw new ConflictException('La caja ya tiene una sesión abierta activa');
    }

    return this.prisma.sesionCaja.create({
      data: {
        caja_id: cajaId,
        usuario_id: userId,
        monto_apertura: dto.monto_apertura,
        total_ventas: 0,
        total_efectivo: 0,
        total_tarjeta: 0,
      },
    });
  }

  async cerrarSesion(cajaId: string, dto: CierreCajaDto, userId: string, role: string) {
    const sesion = await this.getSesionActiva(cajaId);
    if (!sesion) {
      throw new NotFoundException('No hay ninguna sesión activa abierta para esta caja');
    }

    // Solo el usuario que abrió la caja o un OWNER/ADMIN puede cerrarla
    if (sesion.usuario_id !== userId && role !== 'SUPERADMIN' && role !== 'OWNER_TENANT' && role !== 'ADMIN_EMPRESA') {
      throw new ForbiddenException('No tiene permisos para cerrar esta sesión de caja');
    }

    // En un POS real, aquí calcularíamos los totales acumulados de las ventas de la sesión.
    // Por ahora, actualizamos con el monto de cierre y cerramos la sesión.
    return this.prisma.sesionCaja.update({
      where: { id: sesion.id },
      data: {
        monto_cierre: dto.monto_cierre,
        observacion: dto.observacion,
        cerrada_en: new Date(),
      },
    });
  }
}
