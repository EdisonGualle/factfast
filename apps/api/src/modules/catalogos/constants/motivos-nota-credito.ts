import { ItemCatalogo } from './tipos-identificacion';

/**
 * Tabla 26 SRI - Motivos de emision de notas de credito
 * Usado en el campo `motivo` de las notas de credito.
 */
export const MOTIVOS_NOTA_CREDITO: ItemCatalogo[] = [
  { codigo: '01', descripcion: 'Devolucion y descuento' },
  { codigo: '02', descripcion: 'Anulacion' },
  { codigo: '03', descripcion: 'Rebaja de precio' },
  { codigo: '04', descripcion: 'Ajuste de precio' },
  { codigo: '05', descripcion: 'Ajuste por diferencia de cambio' },
  { codigo: '06', descripcion: 'Devolucion de mercaderia' },
];
