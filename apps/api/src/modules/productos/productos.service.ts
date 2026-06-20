import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // SERVICIOS PARA CATEGORÍAS
  // ─────────────────────────────────────────────

  async createCategoria(dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        nombre: dto.nombre,
        empresa_id: dto.empresa_id,
        activo: true,
      },
    });
  }

  async findAllCategorias(empresaId: string) {
    return this.prisma.categoria.findMany({
      where: { empresa_id: empresaId, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneCategoria(id: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, activo: true },
    });
    if (!categoria) {
      throw new NotFoundException('La categoría especificada no existe');
    }
    return categoria;
  }

  async updateCategoria(id: string, dto: UpdateCategoriaDto) {
    await this.findOneCategoria(id);
    return this.prisma.categoria.update({
      where: { id },
      data: dto,
    });
  }

  async removeCategoria(id: string) {
    await this.findOneCategoria(id);

    // Verificar si hay productos asociados a la categoría
    const productosAsociados = await this.prisma.producto.findFirst({
      where: { categoria_id: id, deleted_at: null },
    });

    if (productosAsociados) {
      throw new BadRequestException('No se puede eliminar una categoría que contiene productos activos');
    }

    return this.prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ─────────────────────────────────────────────
  // SERVICIOS PARA PRODUCTOS
  // ─────────────────────────────────────────────

  async createProducto(dto: CreateProductoDto) {
    // 1. Validar la categoría si se especifica
    if (dto.categoria_id) {
      await this.findOneCategoria(dto.categoria_id);
    }

    // 2. Validar que el código no esté duplicado por empresa
    if (dto.codigo) {
      const codigoExistente = await this.prisma.producto.findFirst({
        where: {
          empresa_id: dto.empresa_id,
          codigo: dto.codigo,
          deleted_at: null,
        },
      });
      if (codigoExistente) {
        throw new BadRequestException(`El código de producto '${dto.codigo}' ya está en uso`);
      }
    }

    // 3. Validar tarifa de IVA según SRI (0=0%, 4=15%, 5=5%, 6=no objeto, 7=exento)
    const tarifasValidas = [0, 4, 5, 6, 7];
    if (!tarifasValidas.includes(dto.codigo_tarifa_iva)) {
      throw new BadRequestException('Código de tarifa IVA inválido según la especificación del SRI');
    }

    return this.prisma.producto.create({
      data: {
        empresa_id: dto.empresa_id,
        categoria_id: dto.categoria_id || null,
        codigo: dto.codigo || null,
        codigo_barras: dto.codigo_barras || null,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        tipo: dto.tipo,
        precio_venta: new Prisma.Decimal(dto.precio_venta),
        precio_costo: dto.precio_costo ? new Prisma.Decimal(dto.precio_costo) : null,
        codigo_tarifa_iva: dto.codigo_tarifa_iva,
        stock_minimo: dto.stock_minimo ? new Prisma.Decimal(dto.stock_minimo) : new Prisma.Decimal(0),
        activo: true,
      },
      include: {
        categoria: true,
      },
    });
  }

  async findAllProductos(empresaId: string, search?: string) {
    return this.prisma.producto.findMany({
      where: {
        empresa_id: empresaId,
        deleted_at: null,
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { codigo: { contains: search, mode: 'insensitive' } },
                { codigo_barras: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        categoria: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneProducto(id: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, deleted_at: null },
      include: {
        categoria: true,
      },
    });
    if (!producto) {
      throw new NotFoundException('El producto especificado no existe');
    }
    return producto;
  }

  async updateProducto(id: string, dto: UpdateProductoDto) {
    const producto = await this.findOneProducto(id);

    if (dto.categoria_id) {
      await this.findOneCategoria(dto.categoria_id);
    }

    if (dto.codigo && dto.codigo !== producto.codigo) {
      const codigoExistente = await this.prisma.producto.findFirst({
        where: {
          empresa_id: producto.empresa_id,
          codigo: dto.codigo,
          deleted_at: null,
        },
      });
      if (codigoExistente) {
        throw new BadRequestException(`El código de producto '${dto.codigo}' ya está en uso`);
      }
    }

    if (dto.codigo_tarifa_iva !== undefined) {
      const tarifasValidas = [0, 4, 5, 6, 7];
      if (!tarifasValidas.includes(dto.codigo_tarifa_iva)) {
        throw new BadRequestException('Código de tarifa IVA inválido');
      }
    }

    // Convertir campos number a Prisma.Decimal antes de actualizar
    const updateData: any = { ...dto };
    if (dto.precio_venta !== undefined) updateData.precio_venta = new Prisma.Decimal(dto.precio_venta);
    if (dto.precio_costo !== undefined) updateData.precio_costo = dto.precio_costo !== null ? new Prisma.Decimal(dto.precio_costo) : null;
    if (dto.stock_minimo !== undefined) updateData.stock_minimo = new Prisma.Decimal(dto.stock_minimo);

    return this.prisma.producto.update({
      where: { id },
      data: updateData,
      include: {
        categoria: true,
      },
    });
  }

  async removeProducto(id: string) {
    await this.findOneProducto(id);
    return this.prisma.producto.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });
  }
}
