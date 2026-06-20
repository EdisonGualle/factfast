import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';

// ─────────────────────────────────────────────
// INTERFACES GENERALES Y FACTURA
// ─────────────────────────────────────────────

export interface InvoiceXmlData {
  accessKey: string;
  environment: '1' | '2';
  issueDate: string;        // dd/MM/yyyy
  sequential: string;       // 9 digits
  branchCode: string;       // 3 digits
  emissionPointCode: string;// 3 digits
  emissionType: '1' | '2';

  // Emisor
  ruc: string;
  businessName: string;
  tradeName?: string;
  mainAddress: string;
  branchAddress: string;
  requiredToKeepAccounts: boolean;
  resolutionNumber?: string;
  taxRegimeCode: string;    // '1'=General, '2'=RIMPE Emprendedor, etc.
  agenteRetencionResolucion?: string;

  // Comprador
  buyerIdType: string;
  buyerId: string;
  buyerName: string;
  buyerAddress?: string;
  buyerEmail?: string;

  // Totales
  totalWithoutTax: number;
  totalDiscount: number;
  iva0Subtotal: number;
  iva5Subtotal: number;
  iva15Subtotal: number;
  nonTaxableSubtotal: number;
  exemptSubtotal: number;
  totalIce: number;
  totalIva: number;
  tip: number;
  grandTotal: number;

  // Líneas de detalle
  lines: InvoiceLineData[];

  // Impuestos totales (totalConImpuestos)
  taxTotals: TaxTotalData[];

  // Pagos
  payments: PaymentData[];

  // Reembolsos (Opcional)
  codDocReembolso?: string;
  totalComprobantesReembolso?: number;
  totalBaseImponibleReembolso?: number;
  totalImpuestoReembolso?: number;
  reembolsos?: ReembolsoDetailData[];

  // Campos adicionales opcionales
  additionalFields?: { name: string; value: string }[];
}

export interface ReembolsoDetailData {
  tipoIdentificacionProveedorReembolso: string;
  identificacionProveedorReembolso: string;
  codPaisPagoProveedorReembolso: string;
  tipoProveedorReembolso: string;
  codDocReembolso: string;
  estabDocReembolso: string;
  ptoEmiDocReembolso: string;
  secuencialDocReembolso: string;
  fechaEmisionDocReembolso: string;
  numeroautorizacionDocReemb: string;
  detalleImpuestos: TaxTotalData[];
}

export interface InvoiceLineData {
  lineNumber: number;
  mainCode?: string;
  auxCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalWithoutTax: number;
  taxes: LineTaxData[];
}

export interface LineTaxData {
  taxCode: string;           // '2'=IVA, '3'=ICE, '5'=IRBPNR
  rateCode: string;          // código porcentaje Tabla 17
  rate: number;              // tarifa (ej: 15.00)
  taxableBase: number;
  value: number;
}

export interface TaxTotalData {
  taxCode: string;
  rateCode: string;
  taxableBase: number;
  value: number;
}

export interface PaymentData {
  method: string;   // código Tabla 24
  total: number;
  termDays?: number;
  timeUnit?: string;
}

// ─────────────────────────────────────────────
// INTERFACES NOTA DE CRÉDITO
// ─────────────────────────────────────────────

export interface CreditNoteXmlData {
  accessKey: string;
  environment: '1' | '2';
  issueDate: string;
  sequential: string;
  branchCode: string;
  emissionPointCode: string;
  emissionType: '1' | '2';

  ruc: string;
  businessName: string;
  tradeName?: string;
  mainAddress: string;
  branchAddress: string;
  requiredToKeepAccounts: boolean;
  resolutionNumber?: string;
  taxRegimeCode: string;
  agenteRetencionResolucion?: string;

  buyerIdType: string;
  buyerId: string;
  buyerName: string;
  buyerAddress?: string;

  modifiedDocumentCode: string;
  modifiedDocumentNumber: string;
  modifiedDocumentIssueDate: string;
  reason: string;

  totalWithoutTax: number;
  totalModification: number;
  taxTotals: TaxTotalData[];
  lines: CreditNoteLineData[];
  additionalFields?: { name: string; value: string }[];
}

export interface CreditNoteLineData {
  mainCode?: string;
  auxCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalWithoutTax: number;
  taxes: LineTaxData[];
}

// ─────────────────────────────────────────────
// INTERFACES NOTA DE DÉBITO
// ─────────────────────────────────────────────

export interface DebitNoteXmlData {
  accessKey: string;
  environment: '1' | '2';
  issueDate: string;
  sequential: string;
  branchCode: string;
  emissionPointCode: string;
  emissionType: '1' | '2';

  ruc: string;
  businessName: string;
  tradeName?: string;
  mainAddress: string;
  branchAddress: string;
  requiredToKeepAccounts: boolean;
  resolutionNumber?: string;
  taxRegimeCode: string;
  agenteRetencionResolucion?: string;

  buyerIdType: string;
  buyerId: string;
  buyerName: string;
  buyerAddress?: string;

  modifiedDocumentCode: string;
  modifiedDocumentNumber: string;
  modifiedDocumentIssueDate: string;

  totalWithoutTax: number;
  grandTotal: number;
  taxTotals: TaxTotalData[];
  reasons: DebitNoteReasonData[];
  additionalFields?: { name: string; value: string }[];
}

export interface DebitNoteReasonData {
  reason: string;
  value: number;
}

// ─────────────────────────────────────────────
// INTERFACES GUÍA DE REMISIÓN
// ─────────────────────────────────────────────

export interface WaybillXmlData {
  accessKey: string;
  environment: '1' | '2';
  sequential: string;
  branchCode: string;
  emissionPointCode: string;
  emissionType: '1' | '2';

  ruc: string;
  businessName: string;
  tradeName?: string;
  mainAddress: string;
  branchAddress: string;
  requiredToKeepAccounts: boolean;
  resolutionNumber?: string;
  taxRegimeCode: string;
  agenteRetencionResolucion?: string;

  startAddress: string;
  carrierName: string;
  carrierIdType: string;
  carrierId: string;
  startDate: string;
  endDate: string;
  plate?: string;

  destinatarios: WaybillDestinatarioData[];
  additionalFields?: { name: string; value: string }[];
}

export interface WaybillDestinatarioData {
  identificacionDestinatario: string;
  razonSocialDestinatario: string;
  dirDestinatario: string;
  motivoTraslado: string;
  codEstabDestino: string;
  docSustentoCode: string;
  docSustentoNumber: string;
  docSustentoAuthNumber: string;
  docSustentoIssueDate: string;
  details: WaybillDetailData[];
}

export interface WaybillDetailData {
  mainCode: string;
  description: string;
  quantity: number;
}

// ─────────────────────────────────────────────
// INTERFACES COMPROBANTE DE RETENCIÓN
// ─────────────────────────────────────────────

export interface RetentionXmlData {
  accessKey: string;
  environment: '1' | '2';
  issueDate: string;
  sequential: string;
  branchCode: string;
  emissionPointCode: string;
  emissionType: '1' | '2';

  ruc: string;
  businessName: string;
  tradeName?: string;
  mainAddress: string;
  branchAddress: string;
  requiredToKeepAccounts: boolean;
  resolutionNumber?: string;
  taxRegimeCode: string;
  agenteRetencionResolucion?: string;

  retainedSubjectIdType: string;
  retainedSubjectId: string;
  retainedSubjectName: string;
  fiscalPeriod: string;

  docsSustento: RetentionDocSustentoData[];
  additionalFields?: { name: string; value: string }[];
}

export interface RetentionDocSustentoData {
  codSustento: string;
  codDocSustento: string;
  numDocSustento: string;
  fechaEmisionDocSustento: string;
  taxes: RetentionTaxData[];
}

export interface RetentionTaxData {
  codigo: string;          // '1'=Renta, '2'=IVA, etc.
  codigoRetencion: string; // código del porcentaje
  baseImponible: number;
  porcentajeRetener: number;
  valorRetenido: number;
}

// ─────────────────────────────────────────────
// SERVICIO PRINCIPAL XMLBUILDERSERVICE
// ─────────────────────────────────────────────

@Injectable()
export class XmlBuilderService {

  buildInvoice(data: InvoiceXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('factura', { id: 'comprobante', version: '1.1.0' });

    this.buildInfoTributaria(doc, data, '01');

    const info = doc.ele('infoFactura');
    info.ele('fechaEmision').txt(data.issueDate);
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    info.ele('tipoIdentificacionComprador').txt(data.buyerIdType);
    info.ele('razonSocialComprador').txt(data.buyerName);
    info.ele('identificacionComprador').txt(data.buyerId);
    if (data.buyerAddress) info.ele('direccionComprador').txt(data.buyerAddress);
    info.ele('totalSinImpuestos').txt(this.dec(data.totalWithoutTax));
    info.ele('totalDescuento').txt(this.dec(data.totalDiscount));

    const totalTaxes = info.ele('totalConImpuestos');
    for (const t of data.taxTotals) {
      const ti = totalTaxes.ele('totalImpuesto');
      ti.ele('codigo').txt(t.taxCode);
      ti.ele('codigoPorcentaje').txt(t.rateCode);
      ti.ele('baseImponible').txt(this.dec(t.taxableBase));
      ti.ele('valor').txt(this.dec(t.value));
    }

    if (data.codDocReembolso) {
      info.ele('codDocReembolso').txt(data.codDocReembolso);
      info.ele('totalComprobantesReembolso').txt(this.dec(data.totalComprobantesReembolso ?? 0));
      info.ele('totalBaseImponibleReembolso').txt(this.dec(data.totalBaseImponibleReembolso ?? 0));
      info.ele('totalImpuestoReembolso').txt(this.dec(data.totalImpuestoReembolso ?? 0));
    }

    info.ele('propina').txt(this.dec(data.tip));
    info.ele('importeTotal').txt(this.dec(data.grandTotal));
    info.ele('moneda').txt('DOLAR');

    const pagos = info.ele('pagos');
    for (const p of data.payments) {
      const pago = pagos.ele('pago');
      pago.ele('formaPago').txt(p.method);
      pago.ele('total').txt(this.dec(p.total));
      if (p.termDays !== undefined) {
        pago.ele('plazo').txt(String(p.termDays));
        pago.ele('unidadTiempo').txt(p.timeUnit ?? 'dias');
      }
    }

    const detalles = doc.ele('detalles');
    for (const line of data.lines) {
      const det = detalles.ele('detalle');
      if (line.mainCode) det.ele('codigoPrincipal').txt(line.mainCode);
      if (line.auxCode)  det.ele('codigoAuxiliar').txt(line.auxCode);
      det.ele('descripcion').txt(line.description);
      det.ele('cantidad').txt(this.dec6(line.quantity));
      det.ele('precioUnitario').txt(this.dec6(line.unitPrice));
      det.ele('descuento').txt(this.dec(line.discount));
      det.ele('precioTotalSinImpuesto').txt(this.dec(line.totalWithoutTax));

      const impuestos = det.ele('impuestos');
      for (const tax of line.taxes) {
        const imp = impuestos.ele('impuesto');
        imp.ele('codigo').txt(tax.taxCode);
        imp.ele('codigoPorcentaje').txt(tax.rateCode);
        imp.ele('tarifa').txt(this.dec(tax.rate));
        imp.ele('baseImponible').txt(this.dec(tax.taxableBase));
        imp.ele('valor').txt(this.dec(tax.value));
      }
    }

    if (data.reembolsos && data.reembolsos.length > 0) {
      const reembolsos = doc.ele('reembolsos');
      for (const r of data.reembolsos) {
        const reem = reembolsos.ele('reembolsoDetalle');
        reem.ele('tipoIdentificacionProveedorReembolso').txt(r.tipoIdentificacionProveedorReembolso);
        reem.ele('identificacionProveedorReembolso').txt(r.identificacionProveedorReembolso);
        reem.ele('codPaisPagoProveedorReembolso').txt(r.codPaisPagoProveedorReembolso);
        reem.ele('tipoProveedorReembolso').txt(r.tipoProveedorReembolso);
        reem.ele('codDocReembolso').txt(r.codDocReembolso);
        reem.ele('estabDocReembolso').txt(r.estabDocReembolso);
        reem.ele('ptoEmiDocReembolso').txt(r.ptoEmiDocReembolso);
        reem.ele('secuencialDocReembolso').txt(r.secuencialDocReembolso);
        reem.ele('fechaEmisionDocReembolso').txt(r.fechaEmisionDocReembolso);
        reem.ele('numeroautorizacionDocReemb').txt(r.numeroautorizacionDocReemb);

        const detalleImpuestos = reem.ele('detalleImpuestos');
        for (const t of r.detalleImpuestos) {
          const detImp = detalleImpuestos.ele('detalleImpuesto');
          detImp.ele('codigo').txt(t.taxCode);
          detImp.ele('codigoPorcentaje').txt(t.rateCode);
          detImp.ele('tarifa').txt(this.dec(t.rateCode === '2' ? 12 : 0)); // Aproximación
          detImp.ele('baseImponibleReembolso').txt(this.dec(t.taxableBase));
          detImp.ele('impuestoReembolso').txt(this.dec(t.value));
        }
      }
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  buildLiquidacionCompra(data: InvoiceXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('liquidacionCompra', { id: 'comprobante', version: '1.1.0' });

    this.buildInfoTributaria(doc, data, '03');

    const info = doc.ele('infoLiquidacionCompra');
    info.ele('fechaEmision').txt(data.issueDate);
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    info.ele('tipoIdentificacionProveedor').txt(data.buyerIdType);
    info.ele('razonSocialProveedor').txt(data.buyerName);
    info.ele('identificacionProveedor').txt(data.buyerId);
    if (data.buyerAddress) info.ele('direccionProveedor').txt(data.buyerAddress);
    info.ele('totalSinImpuestos').txt(this.dec(data.totalWithoutTax));
    info.ele('totalDescuento').txt(this.dec(data.totalDiscount));

    const totalTaxes = info.ele('totalConImpuestos');
    for (const t of data.taxTotals) {
      const ti = totalTaxes.ele('totalImpuesto');
      ti.ele('codigo').txt(t.taxCode);
      ti.ele('codigoPorcentaje').txt(t.rateCode);
      ti.ele('baseImponible').txt(this.dec(t.taxableBase));
      ti.ele('valor').txt(this.dec(t.value));
    }

    info.ele('importeTotal').txt(this.dec(data.grandTotal));
    info.ele('moneda').txt('DOLAR');

    const pagos = info.ele('pagos');
    for (const p of data.payments) {
      const pago = pagos.ele('pago');
      pago.ele('formaPago').txt(p.method);
      pago.ele('total').txt(this.dec(p.total));
      if (p.termDays !== undefined) {
        pago.ele('plazo').txt(String(p.termDays));
        pago.ele('unidadTiempo').txt(p.timeUnit ?? 'dias');
      }
    }

    const detalles = doc.ele('detalles');
    for (const line of data.lines) {
      const det = detalles.ele('detalle');
      if (line.mainCode) det.ele('codigoPrincipal').txt(line.mainCode);
      if (line.auxCode)  det.ele('codigoAuxiliar').txt(line.auxCode);
      det.ele('descripcion').txt(line.description);
      det.ele('cantidad').txt(this.dec6(line.quantity));
      det.ele('precioUnitario').txt(this.dec6(line.unitPrice));
      det.ele('descuento').txt(this.dec(line.discount));
      det.ele('precioTotalSinImpuesto').txt(this.dec(line.totalWithoutTax));

      const impuestos = det.ele('impuestos');
      for (const tax of line.taxes) {
        const imp = impuestos.ele('impuesto');
        imp.ele('codigo').txt(tax.taxCode);
        imp.ele('codigoPorcentaje').txt(tax.rateCode);
        imp.ele('tarifa').txt(this.dec(tax.rate));
        imp.ele('baseImponible').txt(this.dec(tax.taxableBase));
        imp.ele('valor').txt(this.dec(tax.value));
      }
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  buildLote(ruc: string, claveAccesoLote: string, signedXmls: string[]): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('lote', { version: '1.0.0' });

    doc.ele('claveAcceso').txt(claveAccesoLote);
    doc.ele('ruc').txt(ruc);
    
    const comprobantesNode = doc.ele('comprobantes');
    
    for (const xml of signedXmls) {
      const cleanXml = xml.replace(/<\?xml.*?\?>/g, '').trim();
      const comp = comprobantesNode.ele('comprobante');
      comp.dat(cleanXml);
    }

    return doc.end({ prettyPrint: false });
  }

  buildCreditNote(data: CreditNoteXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('notaCredito', { id: 'comprobante', version: '1.1.0' });

    this.buildInfoTributaria(doc, data, '04');

    const info = doc.ele('infoNotaCredito');
    info.ele('fechaEmision').txt(data.issueDate);
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    info.ele('tipoIdentificacionComprador').txt(data.buyerIdType);
    info.ele('razonSocialComprador').txt(data.buyerName);
    info.ele('identificacionComprador').txt(data.buyerId);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('codDocModificado').txt(data.modifiedDocumentCode);
    info.ele('numDocModificado').txt(data.modifiedDocumentNumber);
    info.ele('fechaEmisionDocSustento').txt(data.modifiedDocumentIssueDate);
    info.ele('totalSinImpuestos').txt(this.dec(data.totalWithoutTax));
    info.ele('valorModificacion').txt(this.dec(data.totalModification));
    info.ele('moneda').txt('DOLAR');

    const totalTaxes = info.ele('totalConImpuestos');
    for (const t of data.taxTotals) {
      const ti = totalTaxes.ele('totalImpuesto');
      ti.ele('codigo').txt(t.taxCode);
      ti.ele('codigoPorcentaje').txt(t.rateCode);
      ti.ele('baseImponible').txt(this.dec(t.taxableBase));
      ti.ele('valor').txt(this.dec(t.value));
    }

    info.ele('motivo').txt(data.reason);

    const detalles = doc.ele('detalles');
    for (const line of data.lines) {
      const det = detalles.ele('detalle');
      if (line.mainCode) det.ele('codigoInterno').txt(line.mainCode);
      if (line.auxCode)  det.ele('codigoAdicional').txt(line.auxCode);
      det.ele('descripcion').txt(line.description);
      det.ele('cantidad').txt(this.dec6(line.quantity));
      det.ele('precioUnitario').txt(this.dec6(line.unitPrice));
      det.ele('descuento').txt(this.dec(line.discount));
      det.ele('precioTotalSinImpuesto').txt(this.dec(line.totalWithoutTax));

      const impuestos = det.ele('impuestos');
      for (const tax of line.taxes) {
        const imp = impuestos.ele('impuesto');
        imp.ele('codigo').txt(tax.taxCode);
        imp.ele('codigoPorcentaje').txt(tax.rateCode);
        imp.ele('tarifa').txt(this.dec(tax.rate));
        imp.ele('baseImponible').txt(this.dec(tax.taxableBase));
        imp.ele('valor').txt(this.dec(tax.value));
      }
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  buildDebitNote(data: DebitNoteXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('notaDebito', { id: 'comprobante', version: '1.0.0' });

    this.buildInfoTributaria(doc, data, '05');

    const info = doc.ele('infoNotaDebito');
    info.ele('fechaEmision').txt(data.issueDate);
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    info.ele('tipoIdentificacionComprador').txt(data.buyerIdType);
    info.ele('razonSocialComprador').txt(data.buyerName);
    info.ele('identificacionComprador').txt(data.buyerId);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('codDocModificado').txt(data.modifiedDocumentCode);
    info.ele('numDocModificado').txt(data.modifiedDocumentNumber);
    info.ele('fechaEmisionDocSustento').txt(data.modifiedDocumentIssueDate);
    info.ele('totalSinImpuestos').txt(this.dec(data.totalWithoutTax));

    const totalTaxes = info.ele('impuestos');
    for (const t of data.taxTotals) {
      const ti = totalTaxes.ele('impuesto');
      ti.ele('codigo').txt(t.taxCode);
      ti.ele('codigoPorcentaje').txt(t.rateCode);
      // Se deduce la tarifa multiplicando el valor por 100 y dividiendo por la base
      const rate = t.taxableBase > 0 ? (t.value * 100) / t.taxableBase : 0;
      ti.ele('tarifa').txt(this.dec(rate));
      ti.ele('baseImponible').txt(this.dec(t.taxableBase));
      ti.ele('valor').txt(this.dec(t.value));
    }

    info.ele('valorTotal').txt(this.dec(data.grandTotal));

    const motivos = doc.ele('motivos');
    for (const m of data.reasons) {
      const mot = motivos.ele('motivo');
      mot.ele('razon').txt(m.reason);
      mot.ele('valor').txt(this.dec(m.value));
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  buildWaybill(data: WaybillXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('guiaRemision', { id: 'comprobante', version: '1.1.0' });

    this.buildInfoTributaria(doc, data, '06');

    const info = doc.ele('infoGuiaRemision');
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    info.ele('dirPartida').txt(data.startAddress);
    info.ele('razonSocialTransportista').txt(data.carrierName);
    info.ele('tipoIdentificacionTransportista').txt(data.carrierIdType);
    info.ele('rucTransportista').txt(data.carrierId);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('fechaIniTransporte').txt(data.startDate);
    info.ele('fechaFinTransporte').txt(data.endDate);
    if (data.plate) info.ele('placa').txt(data.plate);

    const dests = doc.ele('destinatarios');
    for (const dest of data.destinatarios) {
      const d = dests.ele('destinatario');
      d.ele('identificacionDestinatario').txt(dest.identificacionDestinatario);
      d.ele('razonSocialDestinatario').txt(dest.razonSocialDestinatario);
      d.ele('dirDestinatario').txt(dest.dirDestinatario);
      d.ele('motivoTraslado').txt(dest.motivoTraslado);
      d.ele('codEstabDestino').txt(dest.codEstabDestino);
      d.ele('codDocSustento').txt(dest.docSustentoCode);
      d.ele('numDocSustento').txt(dest.docSustentoNumber);
      d.ele('numAutDocSustento').txt(dest.docSustentoAuthNumber);
      d.ele('fechaEmisionDocSustento').txt(dest.docSustentoIssueDate);

      const details = d.ele('detalles');
      for (const det of dest.details) {
        const item = details.ele('detalle');
        item.ele('codigoInterno').txt(det.mainCode);
        item.ele('descripcion').txt(det.description);
        item.ele('cantidad').txt(this.dec6(det.quantity));
      }
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  buildRetention(data: RetentionXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('comprobanteRetencion', { id: 'comprobante', version: '2.0.0' });

    this.buildInfoTributaria(doc, data, '07');

    const info = doc.ele('infoCompRetencion');
    info.ele('fechaEmision').txt(data.issueDate);
    info.ele('dirEstablecimiento').txt(data.branchAddress);
    info.ele('obligadoContabilidad').txt(data.requiredToKeepAccounts ? 'SI' : 'NO');
    if (data.resolutionNumber) info.ele('contribuyenteEspecial').txt(data.resolutionNumber);
    info.ele('tipoIdentificacionSujetoRetenido').txt(data.retainedSubjectIdType);
    info.ele('parteRel').txt('NO');
    info.ele('razonSocialSujetoRetenido').txt(data.retainedSubjectName);
    info.ele('identificacionSujetoRetenido').txt(data.retainedSubjectId);
    info.ele('periodoFiscal').txt(data.fiscalPeriod);

    const docs = doc.ele('docsSustento');
    for (const sust of data.docsSustento) {
      const docSust = docs.ele('docSustento');
      docSust.ele('codSustento').txt(sust.codSustento);
      docSust.ele('codDocSustento').txt(sust.codDocSustento);
      docSust.ele('numDocSustento').txt(sust.numDocSustento.replace(/-/g, ''));
      docSust.ele('fechaEmisionDocSustento').txt(sust.fechaEmisionDocSustento);
      docSust.ele('pagoLocExt').txt('01');
      docSust.ele('tipoRegi').txt('01');
      docSust.ele('paisEfecPago').txt('593');
      docSust.ele('aplicConvDobTrib').txt('NO');
      docSust.ele('pagExtSujRetNorLeg').txt('NO');
      docSust.ele('pagoRegFis').txt('NO');

      // Calcular la base imponible y el importe total
      const totalBase = sust.taxes.reduce((sum, tax) => sum + tax.baseImponible, 0);
      docSust.ele('totalSinImpuestos').txt(this.dec(totalBase));
      docSust.ele('importeTotal').txt(this.dec(totalBase));

      const impDocSust = docSust.ele('impuestosDocSustento');
      const imp = impDocSust.ele('impuestoDocSustento');
      imp.ele('codImpuestoDocSustento').txt('2');
      imp.ele('codigoPorcentaje').txt('0');
      imp.ele('baseImponible').txt(this.dec(totalBase));
      imp.ele('tarifa').txt('0.00');
      imp.ele('valorImpuesto').txt('0.00');

      const rets = docSust.ele('retenciones');
      for (const t of sust.taxes) {
        const ret = rets.ele('retencion');
        ret.ele('codigo').txt(t.codigo);
        ret.ele('codigoRetencion').txt(t.codigoRetencion);
        ret.ele('baseImponible').txt(this.dec(t.baseImponible));
        ret.ele('porcentajeRetener').txt(this.dec(t.porcentajeRetener));
        ret.ele('valorRetenido').txt(this.dec(t.valorRetenido));
      }
    }

    this.buildInfoAdicional(doc, data.additionalFields);

    return doc.end({ prettyPrint: false });
  }

  private buildInfoTributaria(
    doc: any,
    data: {
      environment: '1' | '2';
      ruc: string;
      accessKey: string;
      branchCode: string;
      emissionPointCode: string;
      sequential: string;
      businessName: string;
      tradeName?: string;
      mainAddress: string;
      taxRegimeCode: string;
      agenteRetencionResolucion?: string;
    },
    codDoc: string,
  ): void {
    const tax = doc.ele('infoTributaria');
    tax.ele('ambiente').txt(data.environment);
    tax.ele('tipoEmision').txt('1');
    tax.ele('razonSocial').txt(data.businessName);
    if (data.tradeName) tax.ele('nombreComercial').txt(data.tradeName);
    tax.ele('ruc').txt(data.ruc);
    tax.ele('claveAcceso').txt(data.accessKey);
    tax.ele('codDoc').txt(codDoc);
    tax.ele('estab').txt(data.branchCode);
    tax.ele('ptoEmi').txt(data.emissionPointCode);
    tax.ele('secuencial').txt(data.sequential);
    tax.ele('dirMatriz').txt(data.mainAddress);

    if (data.agenteRetencionResolucion) {
      tax.ele('agenteRetencion').txt(data.agenteRetencionResolucion);
    }
    const rimpeLegend = this.rimpeLegend(data.taxRegimeCode);
    if (rimpeLegend) {
      tax.ele('contribuyenteRimpe').txt(rimpeLegend);
    }
  }

  private buildInfoAdicional(doc: any, fields?: { name: string; value: string }[]): void {
    if (fields && fields.length > 0) {
      const additional = doc.ele('infoAdicional');
      for (const f of fields) {
        additional.ele('campoAdicional', { nombre: f.name }).txt(f.value);
      }
    }
  }

  private dec(n: number): string {
    return n.toFixed(2);
  }

  private dec6(n: number): string {
    return n.toFixed(6);
  }

  private rimpeLegend(taxRegimeCode: string): string | null {
    if (taxRegimeCode === '2') return 'CONTRIBUYENTE RÉGIMEN RIMPE';
    if (taxRegimeCode === '3') return 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE';
    return null;
  }
}
