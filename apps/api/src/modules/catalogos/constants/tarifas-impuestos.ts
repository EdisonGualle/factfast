import { ItemCatalogo } from './tipos-identificacion';

export interface TarifaImpuesto {
  codigo: string;
  tarifa: number | null;
  descripcion: string;
}

/**
 * Tabla 17 SRI - Tarifas de IVA
 * Use `codigo` como `codigoPorcentaje` al construir impuestos por linea.
 * Tarifa vigente: codigo `4` = 15%.
 */
export const TARIFAS_IVA: TarifaImpuesto[] = [
  { codigo: '0', tarifa: 0, descripcion: 'IVA 0%' },
  { codigo: '2', tarifa: 12, descripcion: 'IVA 12% (anterior)' },
  { codigo: '3', tarifa: 14, descripcion: 'IVA 14%' },
  { codigo: '4', tarifa: 15, descripcion: 'IVA 15% (vigente)' },
  { codigo: '5', tarifa: 5, descripcion: 'IVA 5%' },
  { codigo: '6', tarifa: null, descripcion: 'No objeto de impuesto' },
  { codigo: '7', tarifa: null, descripcion: 'Exento de IVA' },
  { codigo: '8', tarifa: null, descripcion: 'IVA diferenciado' },
];

/**
 * Tabla 13 SRI - Codigos de tipos de impuesto
 * Usado en el campo `codigo` de cada impuesto.
 */
export const CODIGOS_IMPUESTO: ItemCatalogo[] = [
  { codigo: '2', descripcion: 'IVA' },
  { codigo: '3', descripcion: 'ICE' },
  { codigo: '5', descripcion: 'IRBPNR' },
];
