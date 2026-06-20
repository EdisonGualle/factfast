export interface ItemCatalogo {
  codigo: string;
  descripcion: string;
}

/**
 * Tabla 6 SRI - Tipos de identificacion del comprador
 * Codigos usados en el campo `tipoIdentificacionComprador` de los comprobantes.
 */
export const TIPOS_IDENTIFICACION: ItemCatalogo[] = [
  { codigo: '04', descripcion: 'RUC' },
  { codigo: '05', descripcion: 'Cedula' },
  { codigo: '06', descripcion: 'Pasaporte' },
  { codigo: '07', descripcion: 'Consumidor Final' },
  { codigo: '08', descripcion: 'Identificacion del Exterior' },
];
