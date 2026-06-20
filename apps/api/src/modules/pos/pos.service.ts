import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { VentaPosDto } from './dto/venta-pos.dto';
import { FacturasService } from '../facturas/facturas.service';
import { BodegasService } from '../bodegas/bodegas.service';
import { TipoMovimientoInventario, RolUsuario } from '@prisma/client';
import { CrearFacturaDto } from '../facturas/dto/crear-factura.dto';
import { TipoIdentificacionComprador } from '../../common/dto/solicitud-comprobante.dto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facturasService: FacturasService,
    private readonly bodegasService: BodegasService,
  ) {}

  async registrarVentaPos(empresaId: string, dto: VentaPosDto, userId: string, sesionCaja: any) {
    // 1. Validar que la caja corresponda a la de la sesión activa
    if (sesionCaja.caja_id !== dto.caja_id) {
      throw new BadRequestException('La caja de la venta no coincide con la sesión de caja activa');
    }

    // 2. Validar que el cliente exista
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: dto.cliente_id, deleted_at: null },
    });
    if (!cliente) {
      throw new NotFoundException('El cliente especificado no existe');
    }

    // 3. Buscar punto de emisión activo para la sucursal de la caja
    const puntoEmision = await this.prisma.puntoEmision.findFirst({
      where: { sucursal_id: sesionCaja.caja.sucursal_id, activo: true, deleted_at: null },
    });
    if (!puntoEmision) {
      throw new BadRequestException('No se encontró un punto de emisión activo para la sucursal de esta caja');
    }

    // 4. Orquestar la transacción atómica
    return this.prisma.$transaction(async (tx) => {
      const lineasFactura = [];

      // A. Descontar stock y estructurar líneas de venta
      for (const linea of dto.lineas) {
        const producto = await tx.producto.findFirst({
          where: { id: linea.producto_id, deleted_at: null },
        });

        if (!producto) {
          throw new NotFoundException(`El producto con ID ${linea.producto_id} no existe`);
        }

        // Si es de tipo PRODUCTO (físico), descontar stock
        if (producto.tipo === 'PRODUCTO') {
          // Obtener stock actual en la combinación tx de transacción para evitar race conditions
          const stock = await tx.stockProducto.findUnique({
            where: { producto_id_bodega_id: { producto_id: linea.producto_id, bodega_id: dto.bodega_id } },
          });
          const stockActual = stock ? Number(stock.amount) : 0;
          const nuevoStock = stockActual - linea.cantidad;

          if (nuevoStock < 0) {
            throw new BadRequestException(
              `Stock insuficiente para '${producto.nombre}'. Disponible: ${stockActual}, Requerido: ${linea.cantidad}`
            );
          }

          // Actualizar stock
          await tx.stockProducto.upsert({
            where: { producto_id_bodega_id: { producto_id: linea.producto_id, bodega_id: dto.bodega_id } },
            update: { amount: nuevoStock },
            create: {
              producto_id: linea.producto_id,
              bodega_id: dto.bodega_id,
              amount: nuevoStock,
            },
          });

          // Registrar movimiento en Kardex
          await tx.movimientoInventario.create({
            data: {
              tenant_id: sesionCaja.tenant_id,
              producto_id: linea.producto_id,
              bodega_id: dto.bodega_id,
              tipo: TipoMovimientoInventario.SALIDA_VENTA,
              cantidad: linea.cantidad,
              saldo: nuevoStock,
              costo: producto.precio_costo,
              referencia: dto.clave_idempotencia ? `POS-${dto.clave_idempotencia.substring(0, 8)}` : 'POS-VENTA',
              nota: `Salida automática por venta POS - Sesión Caja: ${sesionCaja.id.substring(0, 8)}`,
              usuario_id: userId,
            },
          });
        }

        // Añadir a las líneas del DTO de facturación
        lineasFactura.push({
          codigo_principal: producto.codigo || undefined,
          codigo_auxiliar: producto.codigo_barras || undefined,
          descripcion: producto.nombre,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
          descuento: linea.descuento || 0,
          impuestos: [
            {
              codigo_impuesto: '2', // IVA
              codigo_porcentaje: String(producto.codigo_tarifa_iva),
              tarifa: 0, // se calcula dinámicamente
              base_imponible: 0,
              valor: 0,
            },
          ],
        });
      }

      // B. Construir el DTO de facturación
      const crearFacturaDto: CrearFacturaDto = {
        punto_emision_id: puntoEmision.id,
        tipo_identificacion_comprador: cliente.tipo_identificacion as TipoIdentificacionComprador,
        identificacion_comprador: cliente.identificacion,
        razon_social_comprador: cliente.razon_social,
        correo_comprador: cliente.correo || undefined,
        direccion_comprador: cliente.direccion || undefined,
        lineas: lineasFactura,
        formas_pago: dto.formas_pago.map((p) => ({
          forma_pago: p.forma_pago,
          total: p.total,
          plazo: p.plazo,
          unidad_tiempo: p.unidad_tiempo,
        })),
        campos_adicionales: [
          { nombre: 'Caja', valor: sesionCaja.caja.nombre },
          { nombre: 'SesionCajaId', valor: sesionCaja.id },
          { nombre: 'VendedorId', valor: userId },
        ],
        clave_idempotencia: dto.clave_idempotencia,
      };

      // C. Invocar al servicio de facturación para firmar, guardar y encolar
      const facturaResultado = await this.facturasService.crear(empresaId, crearFacturaDto);

      // D. Actualizar totales acumulados en la sesión de caja
      const totalVenta = dto.formas_pago.reduce((sum, p) => sum + p.total, 0);
      const totalEfectivo = dto.formas_pago.filter((p) => p.forma_pago === '01').reduce((sum, p) => sum + p.total, 0);
      const totalTarjeta = dto.formas_pago.filter((p) => p.forma_pago === '19').reduce((sum, p) => sum + p.total, 0);

      await tx.sesionCaja.update({
        where: { id: sesionCaja.id },
        data: {
          total_ventas: { increment: totalVenta },
          total_efectivo: { increment: totalEfectivo },
          total_tarjeta: { increment: totalTarjeta },
        },
      });

      return {
        mensaje: 'Venta registrada con éxito',
        factura: facturaResultado,
        totales: {
          venta: totalVenta,
          efectivo: totalEfectivo,
          tarjeta: totalTarjeta,
        },
      };
    });
  }
}
