import { ItemCatalogo } from './tipos-identificacion';

/**
 * Tabla 24 SRI - Formas de pago aceptadas
 * Codigos usados en el campo `formaPago` de las facturas.
 */
export const FORMAS_PAGO: ItemCatalogo[] = [
  { codigo: '01', descripcion: 'Sin utilizacion del sistema financiero' },
  { codigo: '15', descripcion: 'Compensacion de deudas' },
  { codigo: '16', descripcion: 'Tarjeta de debito' },
  { codigo: '17', descripcion: 'Dinero electronico Ecuador' },
  { codigo: '18', descripcion: 'Tarjeta prepago' },
  { codigo: '19', descripcion: 'Tarjeta de credito' },
  { codigo: '20', descripcion: 'Otros con utilizacion del sistema financiero' },
  { codigo: '21', descripcion: 'Endoso de titulos' },
];
