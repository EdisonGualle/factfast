import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ValidadorIdentificacion } from '../../common/utils/validador-identificacion';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // SERVICIOS PARA CLIENTES
  // ─────────────────────────────────────────────

  async createCliente(dto: CreateClienteDto) {
    // 1. Validar formato matemático del RUC o Cédula según SRI
    const esValida = ValidadorIdentificacion.validar(dto.tipo_identificacion, dto.identificacion);
    if (!esValida) {
      throw new BadRequestException('El número de identificación no es válido para el tipo especificado');
    }

    // 2. Verificar duplicados por empresa
    const existente = await this.prisma.cliente.findUnique({
      where: {
        empresa_id_identificacion: {
          empresa_id: dto.empresa_id,
          identificacion: dto.identificacion,
        },
      },
    });

    if (existente) {
      if (existente.deleted_at === null) {
        throw new ConflictException('Ya existe un cliente con esta identificación registrado en la empresa');
      } else {
        // Si estaba soft-deleted, lo reactivamos
        return this.prisma.cliente.update({
          where: { id: existente.id },
          data: {
            ...dto,
            deleted_at: null,
            activo: true,
          },
        });
      }
    }

    return this.prisma.cliente.create({
      data: {
        empresa_id: dto.empresa_id,
        tipo_identificacion: dto.tipo_identificacion,
        identificacion: dto.identificacion,
        razon_social: dto.razon_social,
        nombre_comercial: dto.nombre_comercial,
        correo: dto.correo,
        telefono: dto.telefono,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        es_consumidor_final: dto.es_consumidor_final ?? false,
        activo: true,
      },
    });
  }

  async findAllClientes(empresaId: string) {
    return this.prisma.cliente.findMany({
      where: { empresa_id: empresaId, deleted_at: null },
      orderBy: { razon_social: 'asc' },
    });
  }

  async findOneCliente(id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, deleted_at: null },
    });
    if (!cliente) {
      throw new NotFoundException('El cliente especificado no existe');
    }
    return cliente;
  }

  async updateCliente(id: string, dto: UpdateClienteDto) {
    const cliente = await this.findOneCliente(id);

    if (dto.identificacion && dto.tipo_identificacion) {
      const esValida = ValidadorIdentificacion.validar(dto.tipo_identificacion, dto.identificacion);
      if (!esValida) {
        throw new BadRequestException('La identificación modificada no es válida');
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: dto,
    });
  }

  async removeCliente(id: string) {
    await this.findOneCliente(id);
    return this.prisma.cliente.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });
  }

  // ─────────────────────────────────────────────
  // SERVICIOS PARA PROVEEDORES
  // ─────────────────────────────────────────────

  async createProveedor(dto: CreateProveedorDto) {
    // 1. Validar formato matemático del RUC o Cédula
    const esValida = ValidadorIdentificacion.validar(dto.tipo_identificacion, dto.identificacion);
    if (!esValida) {
      throw new BadRequestException('El número de identificación no es válido para el tipo especificado');
    }

    // 2. Verificar duplicados
    const existente = await this.prisma.proveedor.findUnique({
      where: {
        empresa_id_identificacion: {
          empresa_id: dto.empresa_id,
          identificacion: dto.identificacion,
        },
      },
    });

    if (existente) {
      if (existente.deleted_at === null) {
        throw new ConflictException('Ya existe un proveedor con esta identificación registrado en la empresa');
      } else {
        // Reactivar
        return this.prisma.proveedor.update({
          where: { id: existente.id },
          data: {
            ...dto,
            deleted_at: null,
            activo: true,
          },
        });
      }
    }

    return this.prisma.proveedor.create({
      data: {
        empresa_id: dto.empresa_id,
        tipo_identificacion: dto.tipo_identificacion,
        identificacion: dto.identificacion,
        razon_social: dto.razon_social,
        nombre_comercial: dto.nombre_comercial,
        correo: dto.correo,
        telefono: dto.telefono,
        direccion: dto.direccion,
        activo: true,
      },
    });
  }

  async findAllProveedores(empresaId: string) {
    return this.prisma.proveedor.findMany({
      where: { empresa_id: empresaId, deleted_at: null },
      orderBy: { razon_social: 'asc' },
    });
  }

  async findOneProveedor(id: string) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, deleted_at: null },
    });
    if (!proveedor) {
      throw new NotFoundException('El proveedor especificado no existe');
    }
    return proveedor;
  }

  async updateProveedor(id: string, dto: UpdateProveedorDto) {
    await this.findOneProveedor(id);

    if (dto.identificacion && dto.tipo_identificacion) {
      const esValida = ValidadorIdentificacion.validar(dto.tipo_identificacion, dto.identificacion);
      if (!esValida) {
        throw new BadRequestException('La identificación modificada no es válida');
      }
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async removeProveedor(id: string) {
    await this.findOneProveedor(id);
    return this.prisma.proveedor.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });
  }
}
