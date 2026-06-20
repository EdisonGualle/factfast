import { z } from 'zod';

// Esquema de Cliente
export const ClienteSchema = z.object({
  tipo_identificacion: z.enum(['04', '05', '06', '07', '08', '09']),
  identificacion: z.string().min(5).max(20),
  razon_social: z.string().min(1).max(300),
  nombre_comercial: z.string().max(300).optional(),
  correo: z.string().email().optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  direccion: z.string().max(300).optional().nullable(),
});

export type ClienteDto = z.infer<typeof ClienteSchema>;

// Esquema de Producto
export const ProductoSchema = z.object({
  codigo: z.string().max(25).optional().nullable(),
  codigo_barras: z.string().max(50).optional().nullable(),
  nombre: z.string().min(1).max(300),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(['PRODUCTO', 'SERVICIO', 'COMBO']).default('PRODUCTO'),
  precio_venta: z.number().positive(),
  precio_costo: z.number().positive().optional().nullable(),
  codigo_tarifa_iva: z.number().int().default(4),
  stock_minimo: z.number().min(0).default(0),
  categoria_id: z.string().uuid().optional().nullable(),
});

export type ProductoDto = z.infer<typeof ProductoSchema>;

// Esquema de Apertura de Caja
export const AperturaCajaSchema = z.object({
  caja_id: z.string().uuid(),
  monto_apertura: z.number().min(0),
});

export type AperturaCajaDto = z.infer<typeof AperturaCajaSchema>;

// Esquema de Venta POS
export const VentaPosSchema = z.object({
  sesion_caja_id: z.string().uuid(),
  bodega_id: z.string().uuid(),
  cliente_id: z.string().uuid().optional(), // Si no hay = consumidor final
  punto_emision_id: z.string().uuid(),
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    cantidad: z.number().positive(),
    precio_unitario: z.number().positive(),
    descuento: z.number().min(0).default(0),
  })).min(1),
  forma_pago: z.string().length(2), // Código Tabla 24 SRI
  monto_recibido: z.number().positive().optional(),
  correo_comprador: z.string().email().optional().nullable(),
});

export type VentaPosDto = z.infer<typeof VentaPosSchema>;
