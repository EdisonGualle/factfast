// Constantes SRI Ecuador — Tablas oficiales del esquema offline v2.32

// Tabla 6 — Tipos de identificación
export const TIPO_IDENTIFICACION = {
  RUC: '04',
  CEDULA: '05',
  PASAPORTE: '06',
  VENTA_CONSUMIDOR_FINAL: '07',
  IDENTIFICACION_EXTERIOR: '08',
  PLACA: '09',
} as const;

// Tabla 16 — Códigos de impuesto
export const CODIGO_IMPUESTO = {
  IVA: '2',
  ICE: '3',
  IRBPNR: '5',
} as const;

// Tabla 17 — Porcentajes de IVA (código de tarifa)
export const TARIFA_IVA = {
  IVA_0: { codigo: 0, porcentaje: 0 },
  IVA_5: { codigo: 5, porcentaje: 5 },
  IVA_12: { codigo: 2, porcentaje: 12 },
  IVA_15: { codigo: 4, porcentaje: 15 },  // Tarifa vigente 2024+
  NO_OBJETO: { codigo: 6, porcentaje: 0 },
  EXENTO: { codigo: 7, porcentaje: 0 },
} as const;

// Tabla 24 — Formas de pago SRI
export const FORMA_PAGO = {
  SIN_UTILIZACION_SISTEMA_FINANCIERO: '01',
  COMPENSACION_DEUDAS: '15',
  TARJETA_DEBITO: '16',
  DINERO_ELECTRONICO: '17',
  TARJETA_PREPAGO: '18',
  TARJETA_CREDITO: '19',
  OTROS_CON_UTILIZACION_SISTEMA: '20',
  ENDOSO_TITULOS: '21',
} as const;

// Tipos de comprobante SRI
export const TIPO_COMPROBANTE_CODIGO = {
  FACTURA: '01',
  LIQUIDACION_COMPRA: '03',
  NOTA_CREDITO: '04',
  NOTA_DEBITO: '05',
  GUIA_REMISION: '06',
  RETENCION: '07',
} as const;

// Ambientes SRI
export const AMBIENTE_SRI = {
  PRUEBAS: '1',
  PRODUCCION: '2',
} as const;

// URL SRI por ambiente
export const URL_SRI = {
  PRUEBAS: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
  PRODUCCION: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
} as const;

// Planes SaaS
export const PLANES_FACTFAST = {
  EMPRENDEDOR: {
    slug: 'emprendedor',
    max_empresas: 1,
    max_sucursales: 1,
    max_cajas: 1,
    max_usuarios: 2,
    max_comprobantes_mes: 100,
    max_productos: 200,
    max_bodegas: 1,
    incluye_api: false,
    incluye_webhooks: false,
    incluye_lotes: false,
  },
  PRO: {
    slug: 'pro',
    max_empresas: 3,
    max_sucursales: 5,
    max_cajas: 10,
    max_usuarios: 10,
    max_comprobantes_mes: 1000,
    max_productos: 2000,
    max_bodegas: 5,
    incluye_api: false,
    incluye_webhooks: false,
    incluye_lotes: false,
  },
  BUSINESS: {
    slug: 'business',
    max_empresas: 10,
    max_sucursales: 20,
    max_cajas: 50,
    max_usuarios: 50,
    max_comprobantes_mes: 5000,
    max_productos: 10000,
    max_bodegas: 20,
    incluye_api: true,
    incluye_webhooks: true,
    incluye_lotes: true,
  },
} as const;

// Eventos de webhooks
export const WEBHOOK_EVENTOS = [
  'comprobante.autorizado',
  'comprobante.rechazado',
  'comprobante.devuelto',
  'factura.creada',
  'venta.creada',
  'stock.critico',
  'suscripcion.vencida',
  'caja.cerrada',
] as const;

export type WebhookEvento = typeof WEBHOOK_EVENTOS[number];
