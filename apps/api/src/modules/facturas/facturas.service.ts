import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Prisma } from '@prisma/client';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CertificadosService } from '../certificados/certificados.service';
import { AccessKeyService } from '../../infrastructure/xml-engine/access-key.service';
import {
  XmlBuilderService,
  InvoiceXmlData,
} from '../../infrastructure/xml-engine/xml-builder.service';
import { XmlSignerService } from '../../infrastructure/xml-engine/xml-signer.service';
import { CrearFacturaDto } from './dto/crear-factura.dto';
import { SRI_QUEUE } from '../../common/constants/queues';
import { NotasCreditoService } from '../notas-credito/notas-credito.service';
import { CrearNotaCreditoDto } from '../notas-credito/dto/crear-nota-credito.dto';
import { TipoIdentificacionComprador } from '../../common/dto/solicitud-comprobante.dto';
import { AnularFacturaDto } from './dto/anular-factura.dto';
import { TaxCalculator } from '../../common/utils/tax-calculator.util';

@Injectable()
export class FacturasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificados: CertificadosService,
    private readonly accessKey: AccessKeyService,
    private readonly xmlBuilder: XmlBuilderService,
    private readonly xmlSigner: XmlSignerService,
    @InjectQueue(SRI_QUEUE) private readonly sriQueue: Queue,
    private readonly notasCreditoService: NotasCreditoService,
  ) {}

  async crear(empresaId: string, dto: CrearFacturaDto) {
    this.validarIdentificacionComprador(dto);

    // Idempotency check
    if (dto.clave_idempotencia) {
      const existing = await this.prisma.comprobante.findUnique({
        where: { clave_idempotencia: dto.clave_idempotencia },
      });
      if (existing) return existing;
    }

    // Load emission point with branch and company data
    const point = await this.prisma.puntoEmision.findFirst({
      where: { id: dto.punto_emision_id, activo: true },
      include: {
        sucursal: {
          include: { empresa: true },
        },
      },
    });

    if (!point)
      throw new NotFoundException('Punto de emision no encontrado o inactivo');
    if (point.sucursal.empresa.id !== empresaId) {
      throw new BadRequestException(
        'El punto de emision no pertenece a esta empresa',
      );
    }

    const company = point.sucursal.empresa;
    const branch = point.sucursal;

    // Get next sequential number with SELECT FOR UPDATE to prevent race conditions
    const [updatedPoint] = await this.prisma.$transaction([
      this.prisma.puntoEmision.update({
        where: { id: point.id },
        data: { secuencia_factura: { increment: 1 } },
      }),
    ]);
    const sequential = updatedPoint.secuencia_factura - 1;

    // Generate access key
    const environment = company.ambiente_sri === 'PRODUCCION' ? '2' : '1';
    const key = this.accessKey.generate({
      issueDate: new Date(),
      voucherTypeCode: '01',
      ruc: company.ruc,
      environment: environment,
      branchCode: branch.codigo,
      emissionPointCode: point.codigo,
      sequential,
    });

    // Calculate totals from lines
    TaxCalculator.enriquecerImpuestos(dto.lineas);
    const totals = this.calcularTotales(dto.lineas);

    // Build XML
    const serie = `${branch.codigo}${point.codigo}`;
    const xmlData: InvoiceXmlData = {
      accessKey: key,
      environment: environment,
      issueDate: this.formatDate(new Date()),
      sequential: String(sequential).padStart(9, '0'),
      branchCode: branch.codigo,
      emissionPointCode: point.codigo,
      emissionType: '1',
      ruc: company.ruc,
      businessName: company.razon_social,
      tradeName: company.nombre_comercial ?? undefined,
      mainAddress: company.direccion_matriz ?? '',
      branchAddress: branch.direccion,
      requiredToKeepAccounts: company.obligado_contabilidad,
      resolutionNumber: company.numero_resolucion ?? undefined,
      agenteRetencionResolucion:
        company.resolucion_agente_retencion ?? undefined,
      taxRegimeCode: this.taxRegimeCode(company.regimen_tributario),
      buyerIdType: dto.tipo_identificacion_comprador,
      buyerId: dto.identificacion_comprador,
      buyerName: dto.razon_social_comprador,
      buyerEmail: dto.correo_comprador,
      buyerAddress: dto.direccion_comprador,
      ...totals,
      lines: dto.lineas.map((l, i) => ({
        lineNumber: i + 1,
        mainCode: l.codigo_principal,
        auxCode: l.codigo_auxiliar,
        description: l.descripcion,
        quantity: l.cantidad,
        unitPrice: l.precio_unitario,
        discount: l.descuento,
        totalWithoutTax: Number(
          (l.cantidad * l.precio_unitario - l.descuento).toFixed(2),
        ),
        taxes: l.impuestos.map((t) => ({
          taxCode: t.codigo_impuesto,
          rateCode: t.codigo_porcentaje,
          rate: t.tarifa,
          taxableBase: t.base_imponible,
          value: t.valor,
        })),
      })),
      taxTotals: totals.taxTotals,
      payments: dto.formas_pago.map((p) => ({
        method: p.forma_pago,
        total: p.total,
        termDays: p.plazo,
        timeUnit: p.unidad_tiempo,
      })),
      additionalFields: dto.campos_adicionales?.map((f) => ({
        name: f.nombre,
        value: f.valor,
      })),
    };

    const unsignedXml = this.xmlBuilder.buildInvoice(xmlData);

    // Sign XML with company's active .p12 certificate
    const { p12Buffer, password } =
      await this.certificados.obtenerCertificadoDescifrado(empresaId);
    const signedXml = this.xmlSigner.sign(unsignedXml, p12Buffer, password);

    // Persist voucher in DB
    const voucher = await this.prisma.comprobante.create({
      data: {
        empresa_id: empresaId,
        punto_emision_id: point.id,
        tipo_comprobante: 'FACTURA',
        estado: 'FIRMADO',
        clave_acceso: key,
        clave_idempotencia: dto.clave_idempotencia,
        serie,
        numero_secuencial: String(sequential).padStart(9, '0'),
        tipo_identificacion_comprador: dto.tipo_identificacion_comprador,
        identificacion_comprador: dto.identificacion_comprador,
        razon_social_comprador: dto.razon_social_comprador,
        correo_comprador: dto.correo_comprador,
        direccion_comprador: dto.direccion_comprador,
        subtotal_sin_impuestos: new Prisma.Decimal(totals.totalWithoutTax),
        total_descuento: new Prisma.Decimal(totals.totalDiscount),
        subtotal_iva_0: new Prisma.Decimal(totals.iva0Subtotal),
        subtotal_iva_5: new Prisma.Decimal(totals.iva5Subtotal),
        subtotal_iva_12: new Prisma.Decimal(totals.iva12Subtotal),
        subtotal_iva_15: new Prisma.Decimal(totals.iva15Subtotal),
        total_iva: new Prisma.Decimal(totals.totalIva),
        propina: new Prisma.Decimal(totals.tip),
        importe_total: new Prisma.Decimal(totals.grandTotal),
        lineas: {
          create: dto.lineas.map((l, i) => ({
            numero_linea: i + 1,
            codigo_principal: l.codigo_principal,
            codigo_auxiliar: l.codigo_auxiliar,
            descripcion: l.descripcion,
            cantidad: new Prisma.Decimal(l.cantidad),
            precio_unitario: new Prisma.Decimal(l.precio_unitario),
            descuento: new Prisma.Decimal(l.descuento),
            precio_total_sin_impuesto: new Prisma.Decimal(
              Number((l.cantidad * l.precio_unitario - l.descuento).toFixed(2)),
            ),
            impuestos: {
              create: l.impuestos.map((t) => ({
                tipo_impuesto:
                  t.codigo_impuesto === '2'
                    ? 'IVA'
                    : t.codigo_impuesto === '3'
                      ? 'ICE'
                      : 'IRBPNR',
                codigo_impuesto: t.codigo_impuesto,
                codigo_porcentaje: t.codigo_porcentaje,
                tarifa: new Prisma.Decimal(t.tarifa),
                base_imponible: new Prisma.Decimal(t.base_imponible),
                valor: new Prisma.Decimal(t.valor),
              })),
            },
          })),
        },
        formas_pago: {
          create: dto.formas_pago.map((p) => ({
            forma_pago: p.forma_pago,
            total: new Prisma.Decimal(p.total),
            plazo: p.plazo,
            unidad_tiempo: p.unidad_tiempo,
          })),
        },
        campos_adicionales: dto.campos_adicionales
          ? {
              create: dto.campos_adicionales.map((f) => ({
                nombre: f.nombre,
                valor: f.valor,
              })),
            }
          : undefined,
      },
    });
    const xmlPaths = await this.saveXmlFiles(
      company.ruc,
      branch.codigo,
      point.codigo,
      key,
      unsignedXml,
      signedXml,
    );
    // Enqueue for SRI submission
    await this.prisma.comprobante.update({
      where: { id: voucher.id },
      data: { url_xml: xmlPaths.signedPath },
    });

    // Enqueue for SRI submission
    await this.sriQueue.add(
      'submit-voucher',
      { voucherId: voucher.id, signedXml, accessKey: key, environment },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
      },
    );

    return {
      id: voucher.id,
      clave_acceso: key,
      estado: 'FIRMADO',
      serie: `${serie}-${String(sequential).padStart(9, '0')}`,
      mensaje: 'Factura firmada y encolada para envio al SRI',
      ruta_xml: xmlPaths.signedPath,
      ruta_xml_sin_firmar: xmlPaths.unsignedPath,
    };
  }

  async listar(empresaId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.comprobante.findMany({
        where: { empresa_id: empresaId, tipo_comprobante: 'FACTURA' },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          clave_acceso: true,
          estado: true,
          serie: true,
          numero_secuencial: true,
          razon_social_comprador: true,
          identificacion_comprador: true,
          importe_total: true,
          fecha_autorizacion: true,
          created_at: true,
        },
      }),
      this.prisma.comprobante.count({
        where: { empresa_id: empresaId, tipo_comprobante: 'FACTURA' },
      }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async obtenerUno(empresaId: string, id: string) {
    const voucher = await this.prisma.comprobante.findFirst({
      where: { id, empresa_id: empresaId },
      include: {
        lineas: { include: { impuestos: true } },
        formas_pago: true,
        campos_adicionales: true,
      },
    });
    if (!voucher) throw new NotFoundException(`Factura ${id} no encontrada`);
    return voucher;
  }

  async anular(empresaId: string, facturaId: string, dto: AnularFacturaDto) {
    const invoice = await this.prisma.comprobante.findFirst({
      where: {
        id: facturaId,
        empresa_id: empresaId,
        tipo_comprobante: 'FACTURA',
      },
      include: {
        lineas: { include: { impuestos: true } },
        formas_pago: true,
        campos_adicionales: true,
      },
    });

    if (!invoice)
      throw new NotFoundException(`Factura ${facturaId} no encontrada`);

    if (invoice.estado !== 'AUTORIZADO' && invoice.estado !== 'ENVIADO') {
      throw new BadRequestException(
        `Solo se pueden generar notas de credito para facturas en estado AUTORIZADO o ENVIADO. El estado actual es ${invoice.estado}`,
      );
    }

    // Validación Estricta SRI 2026: Máximo hasta el día 7 del mes siguiente
    const hoy = new Date();
    const fechaOriginal = new Date(invoice.fecha_emision);
    const esMismoMes =
      hoy.getFullYear() === fechaOriginal.getFullYear() &&
      hoy.getMonth() === fechaOriginal.getMonth();

    if (!esMismoMes) {
      const isMesPasado =
        (hoy.getFullYear() === fechaOriginal.getFullYear() &&
          hoy.getMonth() - fechaOriginal.getMonth() === 1) ||
        (hoy.getFullYear() - fechaOriginal.getFullYear() === 1 &&
          hoy.getMonth() === 0 &&
          fechaOriginal.getMonth() === 11);

      if (!isMesPasado || hoy.getDate() > 7) {
        throw new BadRequestException(
          'Cumplimiento SRI 2026: No se puede anular un comprobante de periodos anteriores si ha pasado el día 7 del mes siguiente.',
        );
      }
    }

    const crearNotaCreditoDto: CrearNotaCreditoDto = {
      punto_emision_id: invoice.punto_emision_id,
      numero_documento_modificado: `${invoice.serie.substring(0, 3)}-${invoice.serie.substring(3, 6)}-${invoice.numero_secuencial}`,
      codigo_documento_modificado: '01',
      fecha_emision_documento_modificado: this.formatDate(
        invoice.fecha_emision,
      ),
      motivo: dto.motivo,
      tipo_identificacion_comprador:
        invoice.tipo_identificacion_comprador as TipoIdentificacionComprador,
      identificacion_comprador: invoice.identificacion_comprador,
      razon_social_comprador: invoice.razon_social_comprador,
      correo_comprador: invoice.correo_comprador || undefined,
      lineas: invoice.lineas.map((l) => ({
        codigo_principal: l.codigo_principal || undefined,
        codigo_auxiliar: l.codigo_auxiliar || undefined,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        descuento: Number(l.descuento),
        impuestos: l.impuestos.map((t) => ({
          codigo_impuesto: t.codigo_impuesto,
          codigo_porcentaje: t.codigo_porcentaje,
          tarifa: Number(t.tarifa),
          base_imponible: Number(t.base_imponible),
          valor: Number(t.valor),
        })),
      })),
      formas_pago: invoice.formas_pago.map((p) => ({
        forma_pago: p.forma_pago,
        total: Number(p.total),
        plazo: p.plazo || undefined,
        unidad_tiempo: p.unidad_tiempo || undefined,
      })),
      campos_adicionales: invoice.campos_adicionales.map((f) => ({
        nombre: f.nombre,
        valor: f.valor,
      })),
    };

    return this.notasCreditoService.crear(empresaId, crearNotaCreditoDto);
  }

  async obtenerArchivoXml(
    empresaId: string,
    id: string,
    type: 'signed' | 'unsigned' = 'signed',
  ) {
    const voucher = await this.prisma.comprobante.findFirst({
      where: { id, empresa_id: empresaId, tipo_comprobante: 'FACTURA' },
      select: { id: true, clave_acceso: true, url_xml: true },
    });

    if (!voucher) throw new NotFoundException(`Factura ${id} no encontrada`);
    if (!voucher.url_xml)
      throw new NotFoundException('La factura no tiene XML generado');

    const filePath =
      type === 'signed'
        ? voucher.url_xml
        : voucher.url_xml.replace('.signed.xml', '.unsigned.xml');

    try {
      const buffer = await readFile(filePath);
      return {
        buffer,
        filename: `${voucher.clave_acceso}.${type}.xml`,
      };
    } catch {
      throw new NotFoundException(
        `XML ${type === 'signed' ? 'firmado' : 'sin firmar'} no encontrado`,
      );
    }
  }

  async obtenerArchivoPdf(empresaId: string, id: string) {
    const voucher = await this.prisma.comprobante.findFirst({
      where: { id, empresa_id: empresaId, tipo_comprobante: 'FACTURA' },
      select: { clave_acceso: true, url_pdf: true },
    });

    if (!voucher) throw new NotFoundException(`Factura ${id} no encontrada`);
    if (!voucher.url_pdf)
      throw new NotFoundException('La factura no tiene RIDE/PDF generado');

    try {
      const buffer = await readFile(voucher.url_pdf);
      return {
        buffer,
        filename: `${voucher.clave_acceso}.pdf`,
      };
    } catch {
      throw new NotFoundException('RIDE/PDF no encontrado');
    }
  }

  private calcularTotales(lineas: CrearFacturaDto['lineas']) {
    let totalWithoutTax = 0;
    let totalDiscount = 0;
    let iva0Subtotal = 0;
    let iva5Subtotal = 0;
    let iva12Subtotal = 0;
    let iva15Subtotal = 0;
    let totalIva = 0;
    let totalIce = 0;
    const taxMap = new Map<string, { taxableBase: number; value: number }>();

    for (const line of lineas) {
      const lineTotal = Number(
        (line.cantidad * line.precio_unitario - line.descuento).toFixed(2),
      );
      totalWithoutTax += lineTotal;
      totalDiscount += line.descuento;

      for (const tax of line.impuestos) {
        if (tax.codigo_impuesto === '2') {
          if (tax.codigo_porcentaje === '0') {
            iva0Subtotal += tax.base_imponible;
          } else if (tax.codigo_porcentaje === '5') {
            iva5Subtotal += tax.base_imponible;
          } else if (tax.codigo_porcentaje === '2') {
            iva12Subtotal += tax.base_imponible;
          } else if (tax.codigo_porcentaje === '4') {
            iva15Subtotal += tax.base_imponible;
          }
          totalIva += tax.valor;
        }
        if (tax.codigo_impuesto === '3') totalIce += tax.valor;

        const key = `${tax.codigo_impuesto}-${tax.codigo_porcentaje}`;
        const existing = taxMap.get(key) ?? { taxableBase: 0, value: 0 };
        taxMap.set(key, {
          taxableBase: existing.taxableBase + tax.base_imponible,
          value: existing.value + tax.valor,
        });
      }
    }

    const grandTotal = Number(
      (totalWithoutTax + totalIva + totalIce).toFixed(2),
    );

    const taxTotals = Array.from(taxMap.entries()).map(([k, v]) => {
      const [taxCode, rateCode] = k.split('-');
      return { taxCode, rateCode, taxableBase: v.taxableBase, value: v.value };
    });

    return {
      totalWithoutTax: Number(totalWithoutTax.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      iva0Subtotal: Number(iva0Subtotal.toFixed(2)),
      iva5Subtotal: Number(iva5Subtotal.toFixed(2)),
      iva12Subtotal: Number(iva12Subtotal.toFixed(2)),
      iva15Subtotal: Number(iva15Subtotal.toFixed(2)),
      nonTaxableSubtotal: 0,
      exemptSubtotal: 0,
      totalIce: Number(totalIce.toFixed(2)),
      totalIva: Number(totalIva.toFixed(2)),
      tip: 0,
      grandTotal,
      taxTotals,
    };
  }

  private formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
  }

  private taxRegimeCode(regime: string): string {
    const map: Record<string, string> = {
      GENERAL: '1',
      RIMPE_EMPRENDEDOR: '2',
      RIMPE_NEGOCIO_POPULAR: '3',
      AGENTE_RETENCION: '4',
    };
    return map[regime] ?? '1';
  }

  private validarIdentificacionComprador(dto: CrearFacturaDto): void {
    if (
      dto.razon_social_comprador.trim().toUpperCase() === 'CONSUMIDOR FINAL'
    ) {
      if (
        dto.tipo_identificacion_comprador !==
          TipoIdentificacionComprador.CONSUMIDOR_FINAL ||
        dto.identificacion_comprador !== '9999999999999'
      ) {
        throw new BadRequestException(
          'Para CONSUMIDOR FINAL use tipo_identificacion_comprador "07" e identificacion_comprador "9999999999999"',
        );
      }
      return;
    }

    if (
      dto.tipo_identificacion_comprador ===
        TipoIdentificacionComprador.CEDULA &&
      !this.isValidEcuadorianId(dto.identificacion_comprador)
    ) {
      throw new BadRequestException('La cedula del comprador no es valida');
    }

    if (
      dto.tipo_identificacion_comprador === TipoIdentificacionComprador.RUC &&
      !this.isValidRuc(dto.identificacion_comprador)
    ) {
      throw new BadRequestException('El RUC del comprador no es valido');
    }
  }

  private isValidEcuadorianId(id: string): boolean {
    if (!/^\d{10}$/.test(id)) return false;

    const province = Number(id.slice(0, 2));
    if (province < 1 || province > 24) return false;

    const digits = id.split('').map(Number);
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < coefficients.length; i++) {
      let value = digits[i] * coefficients[i];
      if (value >= 10) value -= 9;
      sum += value;
    }

    const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);
    return verifier === digits[9];
  }

  private isValidRuc(ruc: string): boolean {
    if (!/^\d{13}$/.test(ruc) || !ruc.endsWith('001')) return false;

    const thirdDigit = Number(ruc[2]);
    if (thirdDigit >= 0 && thirdDigit <= 5) {
      return this.isValidEcuadorianId(ruc.slice(0, 10));
    }

    return true;
  }

  private async saveXmlFiles(
    ruc: string,
    branchCode: string,
    pointCode: string,
    accessKey: string,
    unsignedXml: string,
    signedXml: string,
  ): Promise<{ unsignedPath: string; signedPath: string }> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Estructura: storage/comprobantes/[RUC]/emitidos/[SUCURSAL]/[CAJA]/[AÑO]/[MES]/
    const directory = join(
      process.cwd(),
      'storage',
      'comprobantes',
      ruc,
      'emitidos',
      branchCode,
      pointCode,
      year,
      month,
    );
    await mkdir(directory, { recursive: true });

    const unsignedPath = join(directory, `${accessKey}.unsigned.xml`);
    const signedPath = join(directory, `${accessKey}.signed.xml`);

    await Promise.all([
      writeFile(unsignedPath, unsignedXml, 'utf8'),
      writeFile(signedPath, signedXml, 'utf8'),
    ]);

    return { unsignedPath, signedPath };
  }
}
