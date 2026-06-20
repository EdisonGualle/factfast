import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Prisma } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CertificadosService } from '../certificados/certificados.service';
import { AccessKeyService } from '../../infrastructure/xml-engine/access-key.service';
import {
  XmlBuilderService,
  TaxTotalData,
} from '../../infrastructure/xml-engine/xml-builder.service';
import { XmlSignerService } from '../../infrastructure/xml-engine/xml-signer.service';
import { CrearNotaDebitoDto } from './dto/crear-nota-debito.dto';
import { SRI_QUEUE } from '../../common/constants/queues';

type EmpresaXml = {
  razon_social: string;
  ruc: string;
  direccion_matriz: string | null;
  obligado_contabilidad: boolean;
  numero_resolucion: string | null;
  resolucion_agente_retencion: string | null;
  regimen_tributario: string;
};

type SucursalXml = {
  codigo: string;
  direccion: string;
};

type PuntoEmisionXml = {
  codigo: string;
};

@Injectable()
export class NotasDebitoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificados: CertificadosService,
    private readonly accessKey: AccessKeyService,
    private readonly xmlBuilder: XmlBuilderService,
    private readonly xmlSigner: XmlSignerService,
    @InjectQueue(SRI_QUEUE) private readonly sriQueue: Queue,
  ) {}

  async crear(empresaId: string, dto: CrearNotaDebitoDto) {
    if (dto.clave_idempotencia) {
      const existing = await this.prisma.comprobante.findUnique({
        where: { clave_idempotencia: dto.clave_idempotencia },
      });
      if (existing) return existing;
    }

    const point = await this.prisma.puntoEmision.findFirst({
      where: { id: dto.punto_emision_id, activo: true },
      include: { sucursal: { include: { empresa: true } } },
    });
    if (!point) throw new NotFoundException('Punto de emision no encontrado');
    if (point.sucursal.empresa.id !== empresaId)
      throw new BadRequestException(
        'El punto de emision no pertenece a esta empresa',
      );

    const company = point.sucursal.empresa;
    const branch = point.sucursal;
    const environment = company.ambiente_sri === 'PRODUCCION' ? '2' : '1';

    const [updatedPoint] = await this.prisma.$transaction([
      this.prisma.puntoEmision.update({
        where: { id: point.id },
        data: { secuencia_nota_debito: { increment: 1 } },
      }),
    ]);
    const sequential = updatedPoint.secuencia_nota_debito - 1;

    const key = this.accessKey.generate({
      issueDate: new Date(),
      voucherTypeCode: '05',
      ruc: company.ruc,
      environment: environment,
      branchCode: branch.codigo,
      emissionPointCode: point.codigo,
      sequential,
    });

    const totalWithoutTax = dto.motivos.reduce((s, m) => s + m.valor, 0);
    const totalIva = dto.impuestos
      .filter((t) => t.codigo_impuesto === '2')
      .reduce((s, t) => s + t.valor, 0);
    const grandTotal = Number((totalWithoutTax + totalIva).toFixed(2));

    const unsignedXml = this.buildXml(
      dto,
      key,
      company,
      branch,
      point,
      sequential,
      environment,
      totalWithoutTax,
      grandTotal,
    );
    const { p12Buffer, password } =
      await this.certificados.obtenerCertificadoDescifrado(empresaId);
    const signedXml = this.xmlSigner.sign(unsignedXml, p12Buffer, password);

    const serie = `${branch.codigo}${point.codigo}`;

    let iva0Subtotal = 0;
    let iva5Subtotal = 0;
    let iva12Subtotal = 0;
    let iva15Subtotal = 0;
    for (const t of dto.impuestos) {
      if (t.codigo_impuesto === '2') {
        if (t.codigo_porcentaje === '0') iva0Subtotal += t.base_imponible;
        else if (t.codigo_porcentaje === '5') iva5Subtotal += t.base_imponible;
        else if (t.codigo_porcentaje === '2') iva12Subtotal += t.base_imponible;
        else if (t.codigo_porcentaje === '4') iva15Subtotal += t.base_imponible;
      }
    }

    const voucher = await this.prisma.comprobante.create({
      data: {
        empresa_id: empresaId,
        punto_emision_id: point.id,
        tipo_comprobante: 'NOTA_DEBITO',
        estado: 'FIRMADO',
        clave_acceso: key,
        clave_idempotencia: dto.clave_idempotencia,
        serie,
        numero_secuencial: String(sequential).padStart(9, '0'),
        tipo_identificacion_comprador: dto.tipo_identificacion_comprador,
        identificacion_comprador: dto.identificacion_comprador,
        razon_social_comprador: dto.razon_social_comprador,
        correo_comprador: dto.correo_comprador,
        subtotal_sin_impuestos: new Prisma.Decimal(totalWithoutTax.toFixed(2)),
        total_descuento: 0,
        subtotal_iva_0: new Prisma.Decimal(iva0Subtotal.toFixed(2)),
        subtotal_iva_5: new Prisma.Decimal(iva5Subtotal.toFixed(2)),
        subtotal_iva_12: new Prisma.Decimal(iva12Subtotal.toFixed(2)),
        subtotal_iva_15: new Prisma.Decimal(iva15Subtotal.toFixed(2)),
        total_iva: new Prisma.Decimal(totalIva.toFixed(2)),
        importe_total: new Prisma.Decimal(grandTotal.toFixed(2)),
        lineas: {
          create: dto.motivos.map((m, i) => ({
            numero_linea: i + 1,
            descripcion: m.razon,
            cantidad: new Prisma.Decimal(1),
            precio_unitario: new Prisma.Decimal(m.valor),
            descuento: new Prisma.Decimal(0),
            precio_total_sin_impuesto: new Prisma.Decimal(m.valor),
          })),
        },
        impuestos: {
          create: dto.impuestos.map((t) => ({
            tipo_impuesto:
              t.codigo_impuesto === '2'
                ? 'IVA'
                : t.codigo_impuesto === '3'
                  ? 'ICE'
                  : 'IRBPNR',
            codigo_impuesto: t.codigo_impuesto,
            codigo_porcentaje: t.codigo_porcentaje,
            base_imponible: new Prisma.Decimal(t.base_imponible.toFixed(2)),
            valor: new Prisma.Decimal(t.valor.toFixed(2)),
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
      voucher.id,
      key,
      unsignedXml,
      signedXml,
    );
    await this.prisma.comprobante.update({
      where: { id: voucher.id },
      data: { url_xml: xmlPaths.signedPath },
    });

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
      serie: `${point.sucursal.codigo}-${point.codigo}-${String(sequential).padStart(9, '0')}`,
    };
  }

  private buildXml(
    dto: CrearNotaDebitoDto,
    key: string,
    company: EmpresaXml,
    branch: SucursalXml,
    point: PuntoEmisionXml,
    sequential: number,
    environment: '1' | '2',
    totalWithoutTax: number,
    grandTotal: number,
  ): string {
    const taxTotals: TaxTotalData[] = dto.impuestos.map((t) => ({
      taxCode: t.codigo_impuesto,
      rateCode: t.codigo_porcentaje,
      taxableBase: t.base_imponible,
      value: t.valor,
    }));

    return this.xmlBuilder.buildDebitNote({
      accessKey: key,
      environment,
      issueDate: this.today(),
      sequential: String(sequential).padStart(9, '0'),
      branchCode: branch.codigo,
      emissionPointCode: point.codigo,
      emissionType: '1',
      ruc: company.ruc,
      businessName: company.razon_social,
      mainAddress: company.direccion_matriz ?? '',
      branchAddress: branch.direccion,
      requiredToKeepAccounts: company.obligado_contabilidad,
      resolutionNumber: company.numero_resolucion ?? undefined,
      taxRegimeCode: this.taxRegimeCode(company.regimen_tributario),
      agenteRetencionResolucion:
        company.resolucion_agente_retencion ?? undefined,
      buyerIdType: dto.tipo_identificacion_comprador,
      buyerId: dto.identificacion_comprador,
      buyerName: dto.razon_social_comprador,
      buyerAddress: undefined,
      modifiedDocumentCode: '01',
      modifiedDocumentNumber: dto.numero_documento_modificado,
      modifiedDocumentIssueDate: dto.fecha_emision_documento_modificado,
      totalWithoutTax,
      grandTotal,
      taxTotals,
      reasons: dto.motivos.map((m) => ({
        reason: m.razon,
        value: m.valor,
      })),
      additionalFields: dto.campos_adicionales?.map((f) => ({
        name: f.nombre,
        value: f.valor,
      })),
    });
  }

  private today(): string {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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

  async listar(empresaId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.comprobante.findMany({
        where: { empresa_id: empresaId, tipo_comprobante: 'NOTA_DEBITO' },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          clave_acceso: true,
          estado: true,
          serie: true,
          numero_secuencial: true,
          importe_total: true,
          created_at: true,
        },
      }),
      this.prisma.comprobante.count({
        where: { empresa_id: empresaId, tipo_comprobante: 'NOTA_DEBITO' },
      }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async obtenerUno(empresaId: string, id: string) {
    const v = await this.prisma.comprobante.findFirst({
      where: { id, empresa_id: empresaId, tipo_comprobante: 'NOTA_DEBITO' },
      include: {
        lineas: true,
        impuestos: true,
        formas_pago: true,
        campos_adicionales: true,
      },
    });
    if (!v) throw new NotFoundException(`Nota de debito ${id} no encontrada`);
    return v;
  }

  private async saveXmlFiles(
    voucherId: string,
    accessKey: string,
    unsignedXml: string,
    signedXml: string,
  ): Promise<{ unsignedPath: string; signedPath: string }> {
    const directory = join(process.cwd(), 'storage', 'xml', voucherId);
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
