import { ItemCatalogo } from './tipos-identificacion';

/**
 * Tabla 2 SRI - Tipos de comprobantes electronicos
 * Codigos oficiales para cada tipo de documento (`codDoc`).
 */
export const TIPOS_COMPROBANTE: ItemCatalogo[] = [
  { codigo: '01', descripcion: 'Factura' },
  {
    codigo: '03',
    descripcion: 'Liquidacion de Compra de Bienes y Prestacion de Servicios',
  },
  { codigo: '04', descripcion: 'Nota de Credito' },
  { codigo: '05', descripcion: 'Nota de Debito' },
  { codigo: '06', descripcion: 'Guia de Remision' },
  { codigo: '07', descripcion: 'Comprobante de Retencion' },
];
