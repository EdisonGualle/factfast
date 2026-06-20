export interface TarifaRetencion {
  codigo: string;
  descripcion: string;
  tarifa: number;
}

/**
 * Tabla 18 SRI - Porcentajes de retencion en la fuente (Renta)
 * Use `codigo` como `codigoRetencion` y `tarifa` como `porcentajeRetener`.
 */
export const RETENCIONES_RENTA: TarifaRetencion[] = [
  {
    codigo: '303',
    descripcion: 'Honorarios profesionales y dietas',
    tarifa: 10,
  },
  { codigo: '304', descripcion: 'Servicios predomina intelecto', tarifa: 8 },
  { codigo: '307', descripcion: 'Servicios predomina mano de obra', tarifa: 2 },
  { codigo: '308', descripcion: 'Servicios entre sociedades', tarifa: 2 },
  {
    codigo: '309',
    descripcion: 'Servicios publicidad y comunicacion',
    tarifa: 1,
  },
  {
    codigo: '310',
    descripcion: 'Transporte privado de pasajeros o servicio publico',
    tarifa: 1,
  },
  {
    codigo: '312',
    descripcion: 'Transferencia de bienes muebles de naturaleza corporal',
    tarifa: 1,
  },
  { codigo: '319', descripcion: 'Arrendamiento mercantil', tarifa: 1 },
  { codigo: '320', descripcion: 'Arrendamiento bienes inmuebles', tarifa: 8 },
  {
    codigo: '322',
    descripcion: 'Seguros y reaseguros (primas y cesiones)',
    tarifa: 1,
  },
  { codigo: '323', descripcion: 'Por rendimientos financieros', tarifa: 2 },
  {
    codigo: '325',
    descripcion: 'Por loterias, rifas, apuestas y similares',
    tarifa: 15,
  },
  {
    codigo: '327',
    descripcion: 'Por venta de combustibles a comercializadoras',
    tarifa: 2,
  },
  {
    codigo: '328',
    descripcion: 'Por venta de combustibles a distribuidores',
    tarifa: 3,
  },
  { codigo: '332', descripcion: 'Compra de bienes inmuebles', tarifa: 1 },
  {
    codigo: '340',
    descripcion: 'Otras retenciones aplicables el 1%',
    tarifa: 1,
  },
  {
    codigo: '341',
    descripcion: 'Otras retenciones aplicables el 2%',
    tarifa: 2,
  },
  {
    codigo: '342',
    descripcion: 'Otras retenciones aplicables el 8%',
    tarifa: 8,
  },
  {
    codigo: '343',
    descripcion: 'Otras retenciones aplicables el 25%',
    tarifa: 25,
  },
];

/**
 * Tabla 19 SRI - Porcentajes de retencion de IVA
 */
export const RETENCIONES_IVA: TarifaRetencion[] = [
  { codigo: '1', descripcion: 'Retencion del 10% del IVA', tarifa: 10 },
  { codigo: '2', descripcion: 'Retencion del 20% del IVA', tarifa: 20 },
  { codigo: '3', descripcion: 'Retencion del 30% del IVA', tarifa: 30 },
  { codigo: '4', descripcion: 'Retencion del 70% del IVA', tarifa: 70 },
  { codigo: '5', descripcion: 'Retencion del 100% del IVA', tarifa: 100 },
];
