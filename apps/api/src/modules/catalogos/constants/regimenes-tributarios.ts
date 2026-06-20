import { ItemCatalogo } from './tipos-identificacion';

/**
 * Regimenes tributarios del contribuyente.
 * Determina campos del XML como `regimenMicroempresas`.
 */
export const REGIMENES_TRIBUTARIOS: ItemCatalogo[] = [
  { codigo: '1', descripcion: 'Regimen General' },
  { codigo: '2', descripcion: 'RIMPE - Emprendedor' },
  { codigo: '3', descripcion: 'RIMPE - Negocio Popular' },
  { codigo: '4', descripcion: 'Agente de Retencion' },
];

/**
 * Ambientes SRI (Tabla 4).
 * 1 = Pruebas (celcer.sri.gob.ec), 2 = Produccion (cel.sri.gob.ec).
 */
export const AMBIENTES_SRI: ItemCatalogo[] = [
  { codigo: '1', descripcion: 'Pruebas' },
  { codigo: '2', descripcion: 'Produccion' },
];

/**
 * Tipos de emision (Tabla 2).
 * 1 = Normal, 2 = Offline (indisponibilidad del sistema).
 */
export const TIPOS_EMISION: ItemCatalogo[] = [
  { codigo: '1', descripcion: 'Emision normal' },
  {
    codigo: '2',
    descripcion: 'Emision por indisponibilidad del sistema (offline)',
  },
];
