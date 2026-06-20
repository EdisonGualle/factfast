// Tipos de enumeraciones compartidas
export type TipoComprobante =
  | 'FACTURA'
  | 'LIQUIDACION_COMPRA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'GUIA_REMISION'
  | 'RETENCION';

export type EstadoComprobante =
  | 'BORRADOR'
  | 'FIRMADO'
  | 'ENVIADO'
  | 'AUTORIZADO'
  | 'FALLIDO'
  | 'ANULADO';

export type AmbienteSRI = 'PRUEBAS' | 'PRODUCCION';

export type RegimenTributario =
  | 'GENERAL'
  | 'RIMPE_EMPRENDEDOR'
  | 'RIMPE_NEGOCIO_POPULAR'
  | 'AGENTE_RETENCION';

export type TipoProducto = 'PRODUCTO' | 'SERVICIO' | 'COMBO';

export type EstadoSuscripcion =
  | 'TRIAL'
  | 'ACTIVA'
  | 'SUSPENDIDA'
  | 'CANCELADA'
  | 'VENCIDA';

// Interfaces de entidades principales

export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
}

export interface Empresa {
  id: string;
  tenant_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  regimen_tributario: RegimenTributario;
  ambiente_sri: AmbienteSRI;
  activo: boolean;
}

export interface Sucursal {
  id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  activo: boolean;
}

export interface Caja {
  id: string;
  sucursal_id: string;
  nombre: string;
  activo: boolean;
}

export interface Bodega {
  id: string;
  sucursal_id: string;
  nombre: string;
  activo: boolean;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  nombre_comercial?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

export interface Producto {
  id: string;
  empresa_id: string;
  codigo?: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto;
  precio_venta: number;
  codigo_tarifa_iva: number;
  stock_minimo: number;
  activo: boolean;
}

// Estado global del contexto operativo (para Zustand en el frontend)
export interface AppContextState {
  tenantId: string | null;
  tenantNombre: string | null;
  empresaId: string | null;
  empresaNombre: string | null;
  empresaRuc: string | null;
  sucursalId: string | null;
  sucursalNombre: string | null;
  cajaId: string | null;
  cajaNombre: string | null;
  sesionCajaId: string | null;
  bodegaId: string | null;
  bodegaNombre: string | null;
  puntoEmisionId: string | null;
  ambienteSri: AmbienteSRI | null;
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Respuesta estándar de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
