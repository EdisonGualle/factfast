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
import { XmlBuilderService } from '../../infrastructure/xml-engine/xml-builder.service';
import { XmlSignerService } from '../../infrastructure/xml-engine/xml-signer.service';
import { CrearGuiaRemisionDto } from './dto/crear-guia-remision.dto';
import { SRI_QUEUE } from '../../common/constants/queues';

type EmpresaXml = {
  razon_social: string;
  ruc: string;
  nombre_comercial: string | null;
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
export class GuiasRemisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificados: CertificadosService,
    private readonly accessKey: AccessKeyService,
    private readonly xmlBuilder: XmlBuilderService,
    private readonly xmlSigner: XmlSignerService,
    @InjectQueue(SRI_QUEUE) private readonly sriQueue: Queue,
  ) {}

  async crear(empresaId: string, dto: CrearGuiaRemisionDto) {
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
        data: { secuencia_guia_remision: { increment: 1 } },
      }),
    ]);
    const sequential = updatedPoint.secuencia_guia_remision - 1;

    const key = this.accessKey.generate({
      issueDate: new Date(),
      voucherTypeCode: '06',
      ruc: company.ruc,
      environment: environment,
      branchCode: branch.codigo,
      emissionPointCode: point.codigo,
      sequential,
    });

    const unsignedXml = this.buildXml(
      dto,
      key,
      company,
      branch,
      point,
      sequential,
      environment,
    );
    const { p12Buffer, password } =
      await this.certificados.obtenerCertificadoDescifrado(empresaId);
    const signedXml = this.xmlSigner.sign(unsignedXml, p12Buffer, password);

    const serie = `${branch.codigo}${point.codigo}`;

    // Aplanar los detalles de los destinatarios para guardarlos como líneas de comprobante
    const lineasToCreate: any[] = [];
    let lineNum = 1;
    for (const dest of dto.destinatarios) {
      for (const det of dest.detalles) {
        lineasToCreate.push({
          numero_linea: lineNum++,
          codigo_principal: det.codigo_principal,
          descripcion: `${dest.razon_social_destinatario} - ${det.descripcion}`,
          cantidad: new Prisma.Decimal(det.cantidad),
          precio_unitario: new Prisma.Decimal(0),
          descuento: new Prisma.Decimal(0),
          precio_total_sin_impuesto: new Prisma.Decimal(0),
        });
      }
    }

    const voucher = await this.prisma.comprobante.create({
      data: {
        empresa_id: empresaId,
        punto_emision_id: point.id,
        tipo_comprobante: 'GUIA_REMISION',
        estado: 'FIRMADO',
        clave_acceso: key,
        clave_idempotencia: dto.clave_idempotencia,
        serie,
        numero_secuencial: String(sequential).padStart(9, '0'),
        tipo_identificacion_comprador: '04',
        identificacion_comprador: dto.ruc_transportista,
        razon_social_comprador: dto.razon_social_transportista,
        subtotal_sin_impuestos: new Prisma.Decimal(0),
        total_descuento: new Prisma.Decimal(0),
        total_iva: new Prisma.Decimal(0),
        importe_total: new Prisma.Decimal(0),
        lineas: {
          create: lineasToCreate,
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
    dto: CrearGuiaRemisionDto,
    key: string,
    company: EmpresaXml,
    branch: SucursalXml,
    point: PuntoEmisionXml,
    sequential: number,
    environment: '1' | '2',
  ): string {
    const destinatarios = dto.destinatarios.map((d) => ({
      identificacionDestinatario: d.identificacion_destinatario,
      razonSocialDestinatario: d.razon_social_destinatario,
      dirDestinatario: d.direccion_destinatario,
      motivoTraslado: dto.motivo_traslado,
      codEstabDestino: branch.codigo,
      docSustentoCode: d.codigo_documento_sustento,
      docSustentoNumber: d.numero_documento_sustento,
      docSustentoAuthNumber: d.clave_acceso_sustento,
      docSustentoIssueDate: d.fecha_emision_sustento,
      details: d.detalles.map((det) => ({
        mainCode: det.codigo_principal,
        description: det.descripcion,
        quantity: det.cantidad,
      })),
    }));

    return this.xmlBuilder.buildWaybill({
      accessKey: key,
      environment,
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
      taxRegimeCode: this.taxRegimeCode(company.regimen_tributario),
      agenteRetencionResolucion:
        company.resolucion_agente_retencion ?? undefined,
      startAddress: dto.direccion_partida,
      carrierName: dto.razon_social_transportista,
      carrierIdType: '04',
      carrierId: dto.ruc_transportista,
      startDate: dto.fecha_inicio_transporte,
      endDate: dto.fecha_fin_transporte,
      plate: dto.placa ?? undefined,
      destinatarios,
      additionalFields: dto.campos_adicionales?.map((f) => ({
        name: f.nombre,
        value: f.valor,
      })),
    });
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
        where: { empresa_id: empresaId, tipo_comprobante: 'GUIA_REMISION' },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          clave_acceso: true,
          estado: true,
          serie: true,
          numero_secuencial: true,
          created_at: true,
        },
      }),
      this.prisma.comprobante.count({
        where: { empresa_id: empresaId, tipo_comprobante: 'GUIA_REMISION' },
      }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async obtenerUno(empresaId: string, id: string) {
    const v = await this.prisma.comprobante.findFirst({
      where: { id, empresa_id: empresaId, tipo_comprobante: 'GUIA_REMISION' },
      include: {
        lineas: true,
        campos_adicionales: true,
      },
    });
    if (!v) throw new NotFoundException(`Guia de remision ${id} no encontrada`);
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
