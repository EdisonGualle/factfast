import { Test, TestingModule } from '@nestjs/testing';
import {
  XmlBuilderService,
  InvoiceXmlData,
  CreditNoteXmlData,
} from './xml-builder.service';

describe('XmlBuilderService', () => {
  let service: XmlBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XmlBuilderService],
    }).compile();

    service = module.get<XmlBuilderService>(XmlBuilderService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  it('debe construir un XML de Factura válido con agenteRetencion y contribuyenteRimpe', () => {
    const data: InvoiceXmlData = {
      accessKey: '0506202601179294523700110010020000001451234567897',
      environment: '1',
      issueDate: '05/06/2026',
      sequential: '000000145',
      branchCode: '001',
      emissionPointCode: '002',
      emissionType: '1',
      ruc: '1792945237001',
      businessName: 'EMPRESA SA',
      tradeName: 'MI NEGOCIO',
      mainAddress: 'AV. PRINCIPAL 123',
      branchAddress: 'SUCURSAL NORTE',
      requiredToKeepAccounts: true,
      taxRegimeCode: '2', // RIMPE Emprendedor
      agenteRetencionResolucion: '12345678',
      buyerIdType: '05',
      buyerId: '1723456789',
      buyerName: 'JUAN PEREZ',
      totalWithoutTax: 10.0,
      totalDiscount: 0.0,
      iva0Subtotal: 0.0,
      iva5Subtotal: 0.0,
      iva15Subtotal: 10.0,
      nonTaxableSubtotal: 0.0,
      exemptSubtotal: 0.0,
      totalIce: 0.0,
      totalIva: 1.5,
      tip: 0.0,
      grandTotal: 11.5,
      lines: [
        {
          lineNumber: 1,
          mainCode: 'P001',
          description: 'PRODUCTO TEST',
          quantity: 1,
          unitPrice: 10.0,
          discount: 0.0,
          totalWithoutTax: 10.0,
          taxes: [
            {
              taxCode: '2',
              rateCode: '4', // IVA 15%
              rate: 15.0,
              taxableBase: 10.0,
              value: 1.5,
            },
          ],
        },
      ],
      taxTotals: [
        {
          taxCode: '2',
          rateCode: '4',
          taxableBase: 10.0,
          value: 1.5,
        },
      ],
      payments: [
        {
          method: '20',
          total: 11.5,
        },
      ],
    };

    const xml = service.buildInvoice(data);

    expect(xml).toContain('<factura id="comprobante" version="1.1.0">');
    expect(xml).toContain('<agenteRetencion>12345678</agenteRetencion>');
    expect(xml).toContain(
      '<contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>',
    );
    expect(xml).toContain('<codigo>2</codigo>');
    expect(xml).toContain('<codigoPorcentaje>4</codigoPorcentaje>');
    expect(xml).toContain('<baseImponible>10.00</baseImponible>');
    expect(xml).toContain('<valor>1.50</valor>');
  });

  it('debe construir un XML de Nota de Crédito válido', () => {
    const data: CreditNoteXmlData = {
      accessKey: '0506202604179294523700110010020000001451234567897',
      environment: '1',
      issueDate: '05/06/2026',
      sequential: '000000145',
      branchCode: '001',
      emissionPointCode: '002',
      emissionType: '1',
      ruc: '1792945237001',
      businessName: 'EMPRESA SA',
      mainAddress: 'AV. PRINCIPAL 123',
      branchAddress: 'SUCURSAL NORTE',
      requiredToKeepAccounts: true,
      taxRegimeCode: '1', // General
      modifiedDocumentCode: '01',
      modifiedDocumentNumber: '001-002-000000145',
      modifiedDocumentIssueDate: '05/06/2026',
      reason: 'DEVOLUCION',
      buyerIdType: '05',
      buyerId: '1723456789',
      buyerName: 'JUAN PEREZ',
      totalWithoutTax: 10.0,
      totalModification: 11.5,
      taxTotals: [
        {
          taxCode: '2',
          rateCode: '4',
          taxableBase: 10.0,
          value: 1.5,
        },
      ],
      lines: [
        {
          mainCode: 'P001',
          description: 'PRODUCTO TEST',
          quantity: 1,
          unitPrice: 10.0,
          discount: 0.0,
          totalWithoutTax: 10.0,
          taxes: [
            {
              taxCode: '2',
              rateCode: '4',
              rate: 15.0,
              taxableBase: 10.0,
              value: 1.5,
            },
          ],
        },
      ],
    };

    const xml = service.buildCreditNote(data);

    expect(xml).toContain('<notaCredito id="comprobante" version="1.1.0">');
    expect(xml).toContain('<codDocModificado>01</codDocModificado>');
    expect(xml).toContain(
      '<numDocModificado>001-002-000000145</numDocModificado>',
    );
    expect(xml).toContain('<valorModificacion>11.50</valorModificacion>');
    expect(xml).toContain('<motivo>DEVOLUCION</motivo>');
  });

  it('debe construir un XML de Nota de Débito válido con sus motivos', () => {
    const data: any = {
      accessKey: '0506202605179294523700110010020000001451234567897',
      environment: '1',
      issueDate: '05/06/2026',
      sequential: '000000145',
      branchCode: '001',
      emissionPointCode: '002',
      emissionType: '1',
      ruc: '1792945237001',
      businessName: 'EMPRESA SA',
      mainAddress: 'AV. PRINCIPAL 123',
      branchAddress: 'SUCURSAL NORTE',
      requiredToKeepAccounts: true,
      taxRegimeCode: '1',
      modifiedDocumentCode: '01',
      modifiedDocumentNumber: '001-002-000000145',
      modifiedDocumentIssueDate: '05/06/2026',
      totalWithoutTax: 10.0,
      grandTotal: 11.5,
      taxTotals: [
        {
          taxCode: '2',
          rateCode: '4',
          taxableBase: 10.0,
          value: 1.5,
        },
      ],
      reasons: [{ reason: 'INTERESES DE MORA', value: 10.0 }],
    };

    const xml = service.buildDebitNote(data);

    expect(xml).toContain('<notaDebito id="comprobante" version="1.0.0">');
    expect(xml).toContain('<razon>INTERESES DE MORA</razon>');
    expect(xml).toContain('<valor>10.00</valor>');
    expect(xml).toContain('<valorTotal>11.50</valorTotal>');
  });

  it('debe construir un XML de Guía de Remisión válido', () => {
    const data: any = {
      accessKey: '0506202606179294523700110010020000001451234567897',
      environment: '1',
      sequential: '000000145',
      branchCode: '001',
      emissionPointCode: '002',
      emissionType: '1',
      ruc: '1792945237001',
      businessName: 'EMPRESA SA',
      mainAddress: 'AV. PRINCIPAL 123',
      branchAddress: 'SUCURSAL NORTE',
      requiredToKeepAccounts: true,
      taxRegimeCode: '1',
      startAddress: 'BODEGA CENTRAL',
      carrierName: 'TRANSPORTES EXPRESS',
      carrierIdType: '04',
      carrierId: '1799999999001',
      startDate: '05/06/2026',
      endDate: '06/06/2026',
      destinatarios: [
        {
          identificacionDestinatario: '1723456789',
          razonSocialDestinatario: 'JUAN PEREZ',
          dirDestinatario: 'CALLE A 123',
          motivoTraslado: 'VENTA',
          codEstabDestino: '001',
          docSustentoCode: '01',
          docSustentoNumber: '001-002-000000145',
          docSustentoAuthNumber:
            '1234567890123456789012345678901234567890123456789',
          docSustentoIssueDate: '05/06/2026',
          details: [
            {
              mainCode: 'P001',
              description: 'PRODUCTO TEST',
              quantity: 5,
            },
          ],
        },
      ],
    };

    const xml = service.buildWaybill(data);

    expect(xml).toContain('<guiaRemision id="comprobante" version="1.1.0">');
    expect(xml).toContain(
      '<razonSocialTransportista>TRANSPORTES EXPRESS</razonSocialTransportista>',
    );
    expect(xml).toContain(
      '<identificacionDestinatario>1723456789</identificacionDestinatario>',
    );
    expect(xml).toContain('<codigoInterno>P001</codigoInterno>');
    expect(xml).toContain('<cantidad>5.000000</cantidad>');
  });

  it('debe construir un XML de Retención válido', () => {
    const data: any = {
      accessKey: '0506202607179294523700110010020000001451234567897',
      environment: '1',
      issueDate: '05/06/2026',
      sequential: '000000145',
      branchCode: '001',
      emissionPointCode: '002',
      emissionType: '1',
      ruc: '1792945237001',
      businessName: 'EMPRESA SA',
      mainAddress: 'AV. PRINCIPAL 123',
      branchAddress: 'SUCURSAL NORTE',
      requiredToKeepAccounts: true,
      taxRegimeCode: '1',
      retainedSubjectIdType: '04',
      retainedSubjectId: '1792222222001',
      retainedSubjectName: 'PROVEEDOR TEST',
      fiscalPeriod: '06/2026',
      docsSustento: [
        {
          codSustento: '01',
          codDocSustento: '01',
          numDocSustento: '001-002-000000145',
          fechaEmisionDocSustento: '05/06/2026',
          taxes: [
            {
              codigo: '1',
              codigoRetencion: '312',
              baseImponible: 100.0,
              porcentajeRetener: 1.75,
              valorRetenido: 1.75,
            },
          ],
        },
      ],
    };

    const xml = service.buildRetention(data);

    expect(xml).toContain(
      '<comprobanteRetencion id="comprobante" version="2.0.0">',
    );
    expect(xml).toContain(
      '<identificacionSujetoRetenido>1792222222001</identificacionSujetoRetenido>',
    );
    expect(xml).toContain('<codigo>1</codigo>');
    expect(xml).toContain('<codigoRetencion>312</codigoRetencion>');
    expect(xml).toContain('<valorRetenido>1.75</valorRetenido>');
  });
});
