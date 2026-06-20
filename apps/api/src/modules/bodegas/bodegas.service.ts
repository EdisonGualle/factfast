import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBodegaDto } from './dto/create-bodega.dto';
import { UpdateBodegaDto } from './dto/update-bodega.dto';
import { RegistrarMovimientoDto } from './dto/registrar-movimiento.dto';
import { TipoMovimientoInventario, Prisma } from '@prisma/client';

@Injectable()
export class BodegasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBodegaDto: CreateBodegaDto) {
    // Validar que la sucursal exista
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id: createBodegaDto.sucursal_id, deleted_at: null },
    });

    if (!sucursal) {
      throw new NotFoundException('La sucursal especificada no existe');
    }

    return this.prisma.bodega.create({
      data: {
        nombre: createBodegaDto.nombre,
        sucursal_id: createBodegaDto.sucursal_id,
        activo: true,
      },
    });
  }

  async findAll() {
    return this.prisma.bodega.findMany({
      where: { deleted_at: null },
      include: { sucursal: true },
    });
  }

  async findOne(id: string) {
    const bodega = await this.prisma.bodega.findFirst({
      where: { id, deleted_at: null },
      include: { sucursal: true },
    });

    if (!bodega) {
      throw new NotFoundException('La bodega especificada no existe');
    }

    return bodega;
  }

  async update(id: string, updateBodegaDto: UpdateBodegaDto) {
    await this.findOne(id);

    return this.prisma.bodega.update({
      where: { id },
      data: updateBodegaDto,
    });
  }

  async remove(id: string) {
    const bodega = await this.findOne(id);

    // Verificar si hay stock en la bodega
    const stockExistente = await this.prisma.stockProducto.findFirst({
      where: { bodega_id: id, amount: { gt: 0 } },
    });

    if (stockExistente) {
      throw new BadRequestException('No se puede eliminar una bodega que aún contiene stock de productos');
    }

    return this.prisma.bodega.update({
      where: { id },
      data: { deleted_at: new Date(), activo: false },
    });
  }

  // ─────────────────────────────────────────────
  // GESTIÓN DE STOCK E INVENTARIO (KARDEX)
  // ─────────────────────────────────────────────

  async getStock(productoId: string, bodegaId: string) {
    const stock = await this.prisma.stockProducto.findUnique({
      where: { producto_id_bodega_id: { producto_id: productoId, bodega_id: bodegaId } },
    });
    return stock ? Number(stock.amount) : 0;
  }

  async getStocksByProducto(productoId: string) {
    const stocks = await this.prisma.stockProducto.findMany({
      where: { producto_id: productoId },
      include: { bodega: true },
    });
    return stocks.map((s) => ({
      bodega_id: s.bodega_id,
      nombre_bodega: s.bodega.nombre,
      cantidad: Number(s.amount),
    }));
  }

  async registrarMovimiento(dto: RegistrarMovimientoDto, userId: string) {
    // 1. Validar que la bodega exista y esté activa
    const bodega = await this.findOne(dto.bodega_id);
    if (!bodega.activo) {
      throw new BadRequestException('La bodega de destino está inactiva');
    }

    // 2. Validar que el producto exista y esté activo
    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.producto_id, deleted_at: null },
    });
    if (!producto) {
      throw new NotFoundException('El producto especificado no existe');
    }
    if (!producto.activo) {
      throw new BadRequestException('El producto especificado está inactivo');
    }

    // 3. Determinar el impacto en el stock
    const esEntrada = ([
      TipoMovimientoInventario.ENTRADA_COMPRA,
      TipoMovimientoInventario.AJUSTE_POSITIVO,
      TipoMovimientoInventario.TRANSFERENCIA_ENTRADA,
      TipoMovimientoInventario.DEVOLUCION_CLIENTE,
    ] as TipoMovimientoInventario[]).includes(dto.tipo);

    const cantidadMovimiento = new Prisma.Decimal(dto.cantidad);
    const stockActual = await this.getStock(dto.producto_id, dto.bodega_id);
    
    let saldoResultante: Prisma.Decimal;
    if (esEntrada) {
      saldoResultante = new Prisma.Decimal(stockActual).add(cantidadMovimiento);
    } else {
      saldoResultante = new Prisma.Decimal(stockActual).sub(cantidadMovimiento);
      
      // Validar stock insuficiente
      if (saldoResultante.lessThan(0)) {
        throw new BadRequestException(
          `Stock insuficiente para el producto '${producto.nombre}' en la bodega '${bodega.nombre}'. ` +
          `Disponible: ${stockActual}, Requerido: ${dto.cantidad}`
        );
      }
    }

    // 4. Transacción atómica
    return this.prisma.$transaction(async (tx) => {
      // A. Actualizar o crear stock
      await tx.stockProducto.upsert({
        where: { producto_id_bodega_id: { producto_id: dto.producto_id, bodega_id: dto.bodega_id } },
        update: { amount: saldoResultante },
        create: {
          producto_id: dto.producto_id,
          bodega_id: dto.bodega_id,
          amount: saldoResultante,
        },
      });

      // B. Registrar movimiento en Kardex
      return tx.movimientoInventario.create({
        data: {
          producto_id: dto.producto_id,
          bodega_id: dto.bodega_id,
          tipo: dto.tipo,
          cantidad: cantidadMovimiento,
          saldo: saldoResultante,
          costo: dto.costo ? new Prisma.Decimal(dto.costo) : null,
          referencia: dto.referencia,
          nota: dto.nota,
          usuario_id: userId,
        },
        include: {
          producto: true,
          bodega: true,
        },
      });
    });
  }

  async obtenerKardex(productoId: string, bodegaId?: string) {
    return this.prisma.movimientoInventario.findMany({
      where: {
        producto_id: productoId,
        ...(bodegaId ? { bodega_id: bodegaId } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        bodega: true,
        producto: true,
      },
    });
  }
}
