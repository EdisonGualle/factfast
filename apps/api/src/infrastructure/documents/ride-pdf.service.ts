import { Injectable } from '@nestjs/common';
import { mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as bwipjs from 'bwip-js';
import { DOMParser } from '@xmldom/xmldom';

type XmlDocument = ReturnType<DOMParser['parseFromString']>;
type XmlElement = NonNullable<XmlDocument['documentElement']>;

type VoucherForRide = {
  id: string;
  tipo_comprobante: string;
  clave_acceso: string;
  url_xml: string | null;
  numero_autorizacion: string | null;
  fecha_autorizacion: Date | null;
  serie: string;
  numero_secuencial: string;
  razon_social_comprador: string;
  identificacion_comprador: string;
  direccion_comprador: string | null;
  correo_comprador: string | null;
  subtotal_sin_impuestos: unknown;
  total_descuento: unknown;
  subtotal_iva_0?: unknown;
  subtotal_iva_5?: unknown;
  subtotal_iva_12?: unknown;
  subtotal_iva_15?: unknown;
  subtotal_no_objeto?: unknown;
  subtotal_exento?: unknown;
  total_ice?: unknown;
  total_irbpnr?: unknown;
  total_iva: unknown;
  propina?: unknown;
  importe_total: unknown;
  created_at?: Date;
  empresa: {
    ruc: string;
    razon_social: string;
    nombre_comercial: string | null;
    direccion_matriz: string | null;
    telefono: string | null;
    correo: string | null;
    ambiente_sri: string;
    obligado_contabilidad?: boolean | null;
    numero_resolucion?: string | null;
  };
  punto_emision: {
    sucursal: {
      codigo: string;
      nombre: string;
      direccion: string;
    };
  };
  lineas: Array<{
    codigo_principal: string | null;
    codigo_auxiliar?: string | null;
    descripcion: string;
    cantidad: unknown;
    precio_unitario: unknown;
    descuento: unknown;
    precio_total_sin_impuesto: unknown;
  }>;
  formas_pago: Array<{
    forma_pago: string;
    total: unknown;
  }>;
  campos_adicionales?: Array<{
    nombre: string;
    valor: string;
  }>;
};

type RideTemplateData = Omit<
  VoucherForRide,
  'lineas' | 'formas_pago' | 'campos_adicionales'
> & {
  fecha_autorizacion_str: string;
  fecha_emision_str: string;
  ambiente_sri: string;
  documento_titulo: string;
  es_factura: boolean;
  es_nota_credito: boolean;
  es_nota_debito: boolean;
  es_guia_remision: boolean;
  es_retencion: boolean;
  subtotal_sin_impuestos_fmt: string;
  total_descuento_fmt: string;
  total_iva_fmt: string;
  importe_total_fmt: string;
  total_gravado_fmt: string;
  barcodeBase64: string;
  lineas: Array<
    VoucherForRide['lineas'][number] & {
      cantidad_fmt: string;
      precio_unitario_fmt: string;
      descuento_fmt: string;
      precio_total_sin_impuesto_fmt: string;
    }
  >;
  formas_pago: Array<{
    forma_pago: string;
    total: unknown;
    total_fmt: string;
  }>;
  campos_adicionales: NonNullable<VoucherForRide['campos_adicionales']>;
  info_especifica: Array<{ etiqueta: string; valor: string }>;
  tabla_principal: { headers: string[]; rows: string[][] };
  totales_especificos: Array<{ etiqueta: string; valor: string }>;
};

@Injectable()
export class RidePdfService {
  private templateCache: HandlebarsTemplateDelegate | null = null;

  private async getTemplate(): Promise<HandlebarsTemplateDelegate> {
    if (!this.templateCache) {
      const templatePath = join(
        process.cwd(),
        'src',
        'infrastructure',
        'documents',
        'templates',
        'ride.hbs',
      );
      const templateContent = await readFile(templatePath, 'utf8');
      this.templateCache = Handlebars.compile(templateContent);
    }
    return this.templateCache;
  }

  private async generateBarcode(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: 'code128',
          text: text,
          scale: 3,
          height: 12,
          includetext: false,
        },
        (err, png) => {
          if (err) reject(err instanceof Error ? err : new Error(String(err)));
          else resolve(`data:image/png;base64,${png.toString('base64')}`);
        },
      );
    });
  }

  async generateRidePdf(voucher: VoucherForRide): Promise<string> {
    const directory = join(process.cwd(), 'storage', 'pdf', voucher.id);
    await mkdir(directory, { recursive: true });

    const pdfPath = join(directory, `${voucher.clave_acceso}.pdf`);

    const templateData = await this.prepareData(voucher);

    const template = await this.getTemplate();
    const html = template(templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        printBackground: true,
      });
    } finally {
      await browser.close();
    }

    return pdfPath;
  }

  async generateInvoicePdf(voucher: VoucherForRide): Promise<string> {
    return this.generateRidePdf(voucher);
  }

  private async prepareData(
    voucher: VoucherForRide,
  ): Promise<RideTemplateData> {
    const xml = await this.readXml(voucher);

    const authDate = voucher.fecha_autorizacion || new Date();
    const fechaAutorizacion = this.formatDateTime(authDate);
    const fechaEmision = this.formatDate(voucher.created_at || new Date());

    const ambienteSri =
      voucher.empresa.ambiente_sri === 'PRODUCCION' ? 'PRODUCCIÓN' : 'PRUEBAS';
    const subtotalSinImpuestos = this.money(voucher.subtotal_sin_impuestos);

    const lineas = voucher.lineas.map((l) => ({
      ...l,
      cantidad_fmt: Number(l.cantidad).toFixed(2),
      precio_unitario_fmt: this.money(l.precio_unitario),
      descuento_fmt: this.money(l.descuento),
      precio_total_sin_impuesto_fmt: this.money(l.precio_total_sin_impuesto),
    }));

    const formasPago = voucher.formas_pago.map((f) => ({
      forma_pago: this.getPaymentMethodName(f.forma_pago),
      total: f.total,
      total_fmt: this.money(f.total),
    }));

    return {
      ...voucher,
      fecha_autorizacion_str: fechaAutorizacion,
      fecha_emision_str: fechaEmision,
      ambiente_sri: ambienteSri,
      documento_titulo: this.getDocumentTitle(voucher.tipo_comprobante),
      es_factura: voucher.tipo_comprobante === 'FACTURA',
      es_nota_credito: voucher.tipo_comprobante === 'NOTA_CREDITO',
      es_nota_debito: voucher.tipo_comprobante === 'NOTA_DEBITO',
      es_guia_remision: voucher.tipo_comprobante === 'GUIA_REMISION',
      es_retencion: voucher.tipo_comprobante === 'RETENCION',
      subtotal_sin_impuestos_fmt: subtotalSinImpuestos,
      total_descuento_fmt: this.money(voucher.total_descuento),
      total_iva_fmt: this.money(voucher.total_iva),
      importe_total_fmt: this.money(voucher.importe_total),
      total_gravado_fmt: subtotalSinImpuestos,
      barcodeBase64: await this.generateBarcode(voucher.clave_acceso),
      lineas,
      formas_pago: formasPago,
      campos_adicionales: voucher.campos_adicionales ?? [],
      info_especifica: this.buildSpecificInfo(voucher, xml),
      tabla_principal: this.buildMainTable(voucher, xml),
      totales_especificos: this.buildSpecificTotals(voucher, xml),
    };
  }

  private async readXml(voucher: VoucherForRide): Promise<XmlDocument | null> {
    if (!voucher.url_xml) return null;
    try {
      const xml = await readFile(voucher.url_xml, 'utf8');
      return new DOMParser().parseFromString(xml, 'text/xml');
    } catch {
      return null;
    }
  }

  private getDocumentTitle(type: string): string {
    const titles: Record<string, string> = {
      FACTURA: 'F A C T U R A',
      NOTA_CREDITO: 'N O T A  D E  C R É D I T O',
      NOTA_DEBITO: 'N O T A  D E  D É B I T O',
      GUIA_REMISION: 'G U Í A  D E  R E M I S I Ó N',
      RETENCION: 'C O M P R O B A N T E  D E  R E T E N C I Ó N',
    };
    return titles[type] ?? type;
  }

  private buildSpecificInfo(
    voucher: VoucherForRide,
    xml: XmlDocument | null,
  ): Array<{ etiqueta: string; valor: string }> {
    if (!xml) return [];

    if (voucher.tipo_comprobante === 'NOTA_CREDITO') {
      return [
        { etiqueta: 'Comprobante que se modifica', valor: 'FACTURA' },
        {
          etiqueta: 'No. documento modificado',
          valor: this.text(xml, 'numDocModificado'),
        },
        {
          etiqueta: 'Fecha documento modificado',
          valor: this.text(xml, 'fechaEmisionDocSustento'),
        },
        { etiqueta: 'Motivo', valor: this.text(xml, 'motivo') },
      ];
    }

    if (voucher.tipo_comprobante === 'NOTA_DEBITO') {
      return [
        { etiqueta: 'Comprobante que se modifica', valor: 'FACTURA' },
        {
          etiqueta: 'No. documento modificado',
          valor: this.text(xml, 'numDocModificado'),
        },
        {
          etiqueta: 'Fecha documento modificado',
          valor: this.text(xml, 'fechaEmisionDocSustento'),
        },
      ];
    }

    if (voucher.tipo_comprobante === 'GUIA_REMISION') {
      return [
        { etiqueta: 'Dirección partida', valor: this.text(xml, 'dirPartida') },
        {
          etiqueta: 'Razón social transportista',
          valor: this.text(xml, 'razonSocialTransportista'),
        },
        {
          etiqueta: 'RUC transportista',
          valor: this.text(xml, 'rucTransportista'),
        },
        {
          etiqueta: 'Fecha inicio transporte',
          valor: this.text(xml, 'fechaIniTransporte'),
        },
        {
          etiqueta: 'Fecha fin transporte',
          valor: this.text(xml, 'fechaFinTransporte'),
        },
        { etiqueta: 'Placa', valor: this.text(xml, 'placa') },
      ];
    }

    if (voucher.tipo_comprobante === 'RETENCION') {
      return [
        {
          etiqueta: 'Sujeto retenido',
          valor: this.text(xml, 'razonSocialSujetoRetenido'),
        },
        {
          etiqueta: 'Identificación sujeto retenido',
          valor: this.text(xml, 'identificacionSujetoRetenido'),
        },
        { etiqueta: 'Periodo fiscal', valor: this.text(xml, 'periodoFiscal') },
      ];
    }

    return [];
  }

  private buildMainTable(
    voucher: VoucherForRide,
    xml: XmlDocument | null,
  ): {
    headers: string[];
    rows: string[][];
  } {
    if (voucher.tipo_comprobante === 'NOTA_DEBITO' && xml) {
      return {
        headers: ['Razón', 'Valor'],
        rows: this.nodes(xml, 'motivo').map((node) => [
          this.childText(node, 'razon'),
          this.money(this.childText(node, 'valor')),
        ]),
      };
    }

    if (voucher.tipo_comprobante === 'GUIA_REMISION' && xml) {
      return {
        headers: [
          'Destinatario',
          'Identificación',
          'Motivo',
          'Doc. sustento',
          'Código',
          'Descripción',
          'Cantidad',
        ],
        rows: this.nodes(xml, 'destinatario').flatMap((destinatario) => {
          const destinatarioNombre = this.childText(
            destinatario,
            'razonSocialDestinatario',
          );
          const identificacion = this.childText(
            destinatario,
            'identificacionDestinatario',
          );
          const motivo = this.childText(destinatario, 'motivoTraslado');
          const sustento = this.childText(destinatario, 'numDocSustento');
          return this.childNodes(destinatario, 'detalle').map((detalle) => [
            destinatarioNombre,
            identificacion,
            motivo,
            sustento,
            this.childText(detalle, 'codigoInterno'),
            this.childText(detalle, 'descripcion'),
            this.childText(detalle, 'cantidad'),
          ]);
        }),
      };
    }

    if (voucher.tipo_comprobante === 'RETENCION' && xml) {
      const retenciones = [
        ...this.nodes(xml, 'retencion'),
        ...this.nodes(xml, 'impuestoRetenido'),
      ];
      return {
        headers: [
          'Doc. sustento',
          'Fecha',
          'Impuesto',
          'Código retención',
          'Base imponible',
          '%',
          'Valor retenido',
        ],
        rows: retenciones.map((retencion) => {
          const doc = this.closestParent(retencion, 'docSustento');
          return [
            doc ? this.childText(doc, 'numDocSustento') : '',
            doc ? this.childText(doc, 'fechaEmisionDocSustento') : '',
            this.childText(retencion, 'codigo'),
            this.childText(retencion, 'codigoRetencion'),
            this.money(this.childText(retencion, 'baseImponible')),
            this.childText(retencion, 'porcentajeRetener'),
            this.money(this.childText(retencion, 'valorRetenido')),
          ];
        }),
      };
    }

    return {
      headers: [
        'Cod. Principal',
        'Cant.',
        'Descripción',
        'Precio Unitario',
        'Descuento',
        'Precio Total',
      ],
      rows: voucher.lineas.map((linea) => [
        linea.codigo_principal ?? '',
        Number(linea.cantidad).toFixed(2),
        linea.descripcion,
        this.money(linea.precio_unitario),
        this.money(linea.descuento),
        this.money(linea.precio_total_sin_impuesto),
      ]),
    };
  }

  private buildSpecificTotals(
    voucher: VoucherForRide,
    xml: XmlDocument | null,
  ): Array<{ etiqueta: string; valor: string }> {
    if (voucher.tipo_comprobante === 'GUIA_REMISION') return [];

    if (voucher.tipo_comprobante === 'RETENCION') {
      return [
        {
          etiqueta: 'TOTAL RETENIDO',
          valor: this.money(voucher.importe_total),
        },
      ];
    }

    if (voucher.tipo_comprobante === 'NOTA_CREDITO' && xml) {
      return [
        {
          etiqueta: 'VALOR MODIFICACIÓN',
          valor: this.money(
            this.text(xml, 'valorModificacion') || voucher.importe_total,
          ),
        },
      ];
    }

    const totals: Array<{ etiqueta: string; valor: string }> = [];

    const addIfValid = (label: string, val: unknown) => {
      const num = Number(val ?? 0);
      if (num > 0) {
        totals.push({ etiqueta: label, valor: this.money(num) });
      }
    };

    addIfValid('SUBTOTAL IVA 15%', voucher.subtotal_iva_15);
    addIfValid('SUBTOTAL IVA 12%', voucher.subtotal_iva_12);
    addIfValid('SUBTOTAL IVA 5%', voucher.subtotal_iva_5);

    // Subtotal 0% se suele mostrar siempre en la estructura RIDE
    totals.push({
      etiqueta: 'SUBTOTAL IVA 0%',
      valor: this.money(voucher.subtotal_iva_0),
    });

    addIfValid('SUBTOTAL NO OBJETO DE IVA', voucher.subtotal_no_objeto);
    addIfValid('SUBTOTAL EXENTO DE IVA', voucher.subtotal_exento);

    totals.push({
      etiqueta: 'SUBTOTAL SIN IMPUESTOS',
      valor: this.money(voucher.subtotal_sin_impuestos),
    });

    totals.push({
      etiqueta: 'TOTAL DESCUENTO',
      valor: this.money(voucher.total_descuento),
    });

    addIfValid('ICE', voucher.total_ice);
    addIfValid('IRBPNR', voucher.total_irbpnr);

    let ivaLabel = 'IVA 15%';
    if (
      Number(voucher.subtotal_iva_12 ?? 0) > 0 &&
      Number(voucher.subtotal_iva_15 ?? 0) === 0
    ) {
      ivaLabel = 'IVA 12%';
    } else if (
      Number(voucher.subtotal_iva_5 ?? 0) > 0 &&
      Number(voucher.subtotal_iva_15 ?? 0) === 0
    ) {
      ivaLabel = 'IVA 5%';
    }

    totals.push({
      etiqueta: ivaLabel,
      valor: this.money(voucher.total_iva),
    });

    addIfValid('PROPINA', voucher.propina);

    totals.push({
      etiqueta: 'VALOR TOTAL',
      valor: this.money(voucher.importe_total),
    });

    return totals;
  }

  private text(xml: XmlDocument, tag: string): string {
    return xml.getElementsByTagName(tag).item(0)?.textContent?.trim() ?? '';
  }

  private nodes(xml: XmlDocument, tag: string): XmlElement[] {
    return Array.from(xml.getElementsByTagName(tag));
  }

  private childText(node: XmlElement, tag: string): string {
    return node.getElementsByTagName(tag).item(0)?.textContent?.trim() ?? '';
  }

  private childNodes(node: XmlElement, tag: string): XmlElement[] {
    return Array.from(node.getElementsByTagName(tag));
  }

  private closestParent(node: XmlElement, tag: string): XmlElement | null {
    let current = node.parentNode;
    while (current) {
      if (current.nodeType === 1 && (current as XmlElement).tagName === tag) {
        return current as XmlElement;
      }
      current = current.parentNode;
    }
    return null;
  }

  private getPaymentMethodName(code: string): string {
    const methods: Record<string, string> = {
      '01': 'SIN UTILIZACION DEL SISTEMA FINANCIERO',
      '15': 'COMPENSACIÓN DE DEUDAS',
      '16': 'TARJETA DE DÉBITO',
      '17': 'DINERO ELECTRÓNICO',
      '18': 'TARJETA PREPAGO',
      '19': 'TARJETA DE CRÉDITO',
      '20': 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
      '21': 'ENDOSO DE TÍTULOS',
    };
    return methods[code] || `OTROS (${code})`;
  }

  private money(value: unknown): string {
    return Number(value ?? 0).toFixed(2);
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
  }
}
