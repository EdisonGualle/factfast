import { ItemCatalogo } from './tipos-identificacion';

/**
 * Motivos de traslado para guias de remision
 * Usado en `motivoTraslado` de las guias de remision.
 */
export const MOTIVOS_TRASLADO: ItemCatalogo[] = [
  { codigo: '01', descripcion: 'Venta' },
  { codigo: '02', descripcion: 'Compra' },
  { codigo: '03', descripcion: 'Devolucion' },
  {
    codigo: '04',
    descripcion: 'Traslado de mercaderia entre establecimientos',
  },
  { codigo: '05', descripcion: 'Consignacion' },
  { codigo: '06', descripcion: 'Produccion' },
  { codigo: '07', descripcion: 'Distribucion' },
  { codigo: '08', descripcion: 'Transformacion' },
  { codigo: '09', descripcion: 'Importacion' },
  { codigo: '10', descripcion: 'Exportacion' },
  {
    codigo: '11',
    descripcion: 'Traslado por emisor itinerante de comprobantes',
  },
  { codigo: '12', descripcion: 'Reparacion' },
  { codigo: '13', descripcion: 'Otros' },
];

export const TIPOS_TRANSPORTE: ItemCatalogo[] = [
  { codigo: '01', descripcion: 'Transporte publico' },
  { codigo: '02', descripcion: 'Transporte propio' },
  { codigo: '03', descripcion: 'Transporte tercerizado' },
];
