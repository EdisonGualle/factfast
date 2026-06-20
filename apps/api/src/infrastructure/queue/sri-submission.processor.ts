import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { SriSoapService } from './sri-soap.service';
import { SRI_QUEUE } from '../../common/constants/queues';
import { RidePdfService } from '../documents/ride-pdf.service';
import { MailService } from '../mail/mail.service';

interface SubmitJob {
  voucherId: string;
  signedXml: string;
  accessKey: string;
  environment: '1' | '2';
}

@Processor(SRI_QUEUE)
export class SriSubmissionProcessor {
  private readonly logger = new Logger(SriSubmissionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sriSoap: SriSoapService,
    private readonly ridePdf: RidePdfService,
    private readonly mail: MailService,
  ) {}

  @Process('submit-voucher')
  async handleSubmit(job: Job<SubmitJob>) {
    const { voucherId, signedXml, accessKey, environment } = job.data;
    this.logger.log(
      `Processing voucher ${accessKey} (attempt ${job.attemptsMade + 1})`,
    );

    const voucher = await this.prisma.comprobante.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new Error(`Voucher ${voucherId} not found in database`);
    }

    await this.prisma.comprobante.update({
      where: { id: voucherId },
      data: { intentos_envio: { increment: 1 } },
    });

    let currentStatus = voucher.estado;

    // Solo llamamos a recepción si NO se ha enviado previamente con éxito
    if (voucher.estado !== 'ENVIADO' && voucher.estado !== 'AUTORIZADO') {
      // Step 1: Reception
      const receptionResult = await this.sriSoap.receive(
        signedXml,
        environment,
      );

      if (receptionResult.status !== 'RECIBIDA') {
        const errorMsg = receptionResult.messages.join('; ');
        await this.prisma.comprobante.update({
          where: { id: voucherId },
          data: {
            estado: 'FALLIDO',
            ultimo_error: errorMsg,
            respuesta_sri_raw: receptionResult.rawResponse,
          },
        });
        throw new Error(`SRI rejected: ${errorMsg}`);
      }

      await this.prisma.comprobante.update({
        where: { id: voucherId },
        data: { estado: 'ENVIADO' },
      });
      currentStatus = 'ENVIADO';
    }

    // Step 2: Authorization (poll with delay)
    if (currentStatus === 'ENVIADO' && voucher.estado !== 'AUTORIZADO') {
      await this.sleep(3000);
      const authResult = await this.sriSoap.authorize(accessKey, environment);

      if (authResult.status === 'AUTORIZADO') {
        await this.prisma.comprobante.update({
          where: { id: voucherId },
          data: {
            estado: 'AUTORIZADO',
            numero_autorizacion: authResult.authorizationNumber,
            fecha_autorizacion: authResult.authorizationDate,
            respuesta_sri_raw: authResult.rawResponse,
          },
        });
        await this.generateRideAndNotify(voucherId);
        this.logger.log(`Voucher ${accessKey} AUTHORIZED`);
      } else {
        const errorMsg = authResult.messages.join('; ');
        await this.prisma.comprobante.update({
          where: { id: voucherId },
          data: {
            ultimo_error: `Intento de autorización fallido: ${errorMsg}`,
            respuesta_sri_raw: authResult.rawResponse,
          },
        });
        throw new Error(`SRI authorization pending or failed: ${errorMsg}`);
      }
    }
  }

  @Process('check-lote-authorization')
  async handleCheckLoteAuthorization(job: Job<{ claveAccesoLote: string; comprobanteIds: string[]; environment: '1' | '2' }>) {
    const { claveAccesoLote, comprobanteIds, environment } = job.data;
    this.logger.log(`Checking Lote authorization for ${claveAccesoLote} (attempt ${job.attemptsMade + 1})`);

    const authResult = await this.sriSoap.authorizeLote(claveAccesoLote, environment);

    // If the SRI responds with error or rawResponse is empty, we throw to retry later
    if (authResult.authorizations.length === 0 && (!authResult.rawResponse || authResult.rawResponse.includes('ERROR'))) {
      throw new Error(`SRI lote authorization pending or failed. Will retry. Raw: ${authResult.rawResponse}`);
    }

    let allAuthorizedOrProcessed = true;

    for (const id of comprobanteIds) {
      const voucher = await this.prisma.comprobante.findUnique({ where: { id } });
      if (!voucher) continue;
      if (voucher.estado === 'AUTORIZADO') continue; // Ya procesado

      // Buscar la autorización en la respuesta
      const auth = authResult.authorizations.find((a) => a.accessKey === voucher.clave_acceso);
      if (!auth) {
        // En lote, a veces los comprobantes se procesan en diferido y aún no aparecen en la autorización
        allAuthorizedOrProcessed = false;
        continue;
      }

      if (auth.status === 'AUTORIZADO') {
        await this.prisma.comprobante.update({
          where: { id },
          data: {
            estado: 'AUTORIZADO',
            numero_autorizacion: auth.authorizationNumber,
            fecha_autorizacion: auth.authorizationDate,
            respuesta_sri_raw: authResult.rawResponse, // Opcional, guarda la respuesta maestra
          },
        });
        await this.generateRideAndNotify(id);
        this.logger.log(`Voucher ${voucher.clave_acceso} from Lote ${claveAccesoLote} AUTHORIZED`);
      } else if (auth.status === 'NO_AUTORIZADO' || auth.status === 'ERROR') {
        const errorMsg = auth.messages.join('; ');
        await this.prisma.comprobante.update({
          where: { id },
          data: {
            estado: 'FALLIDO', // O podría quedar en devuelta para revisión
            ultimo_error: `Intento de autorización de LOTE fallido: ${errorMsg}`,
            respuesta_sri_raw: authResult.rawResponse,
          },
        });
        this.logger.warn(`Voucher ${voucher.clave_acceso} from Lote ${claveAccesoLote} REJECTED: ${errorMsg}`);
      }
    }

    if (!allAuthorizedOrProcessed) {
      throw new Error(`Lote ${claveAccesoLote} still has pending authorizations. Requeueing.`);
    }

    this.logger.log(`Lote ${claveAccesoLote} processing completed.`);
  }

  @OnQueueFailed()
  async onFailed(job: Job<any>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );

    // After all retries exhausted mark as permanently failed
    if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
      await this.prisma.comprobante.update({
        where: { id: job.data.voucherId },
        data: {
          estado: 'FALLIDO',
          ultimo_error: `Max retries reached: ${error.message}`,
        },
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateRideAndNotify(voucherId: string): Promise<void> {
    const voucher = await this.prisma.comprobante.findUnique({
      where: { id: voucherId },
      include: {
        empresa: true,
        punto_emision: { include: { sucursal: true } },
        lineas: { orderBy: { numero_linea: 'asc' } },
        formas_pago: true,
        campos_adicionales: true,
      },
    });

    if (!voucher) {
      this.logger.warn(
        `Voucher ${voucherId} not found for RIDE/email generation`,
      );
      return;
    }

    try {
      const pdfPath = await this.ridePdf.generateRidePdf(voucher);
      await this.prisma.comprobante.update({
        where: { id: voucherId },
        data: { url_pdf: pdfPath },
      });

      if (!voucher.url_xml) {
        this.logger.warn(
          `Voucher ${voucher.clave_acceso} has no XML path for email attachment`,
        );
        return;
      }

      const mailResult = await this.mail.sendAuthorizedInvoice({
        to: voucher.correo_comprador,
        buyerName: voucher.razon_social_comprador,
        accessKey: voucher.clave_acceso,
        pdfPath,
        xmlPath: voucher.url_xml,
      });

      await this.prisma.registroAuditoria.create({
        data: {
          empresa_id: voucher.empresa_id,
          entidad: 'comprobantes',
          entidad_id: voucher.id,
          accion: `EMAIL_${mailResult.status}`,
          valores_despues: mailResult,
        },
      });

      if (mailResult.status === 'SKIPPED') {
        this.logger.warn(
          `Email skipped for ${voucher.clave_acceso}: ${mailResult.reason}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `RIDE/email post-authorization failed for ${voucher.clave_acceso}: ${(error as Error).message}`,
      );
    }
  }
}
