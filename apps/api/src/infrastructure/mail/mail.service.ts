import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type SendInvoiceEmailInput = {
  to: string | null;
  buyerName: string;
  accessKey: string;
  pdfPath: string;
  xmlPath: string;
};

type SendExpirationAlertInput = {
  to: string;
  razonSocial: string;
  titular: string;
  ruc: string;
  fechaVencimiento: Date;
  diasRestantes: number;
};

type MailResult =
  | { status: 'SENT'; messageId?: string }
  | { status: 'SKIPPED'; reason: string }
  | { status: 'FAILED'; reason: string };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendAuthorizedInvoice(
    input: SendInvoiceEmailInput,
  ): Promise<MailResult> {
    if (!input.to) {
      return {
        status: 'SKIPPED',
        reason: 'La factura no tiene correo del comprador',
      };
    }

    const host = this.config.get<string>('app.mail.host');
    const from = this.config.get<string>('app.mail.from');

    if (!host || !from) {
      return {
        status: 'SKIPPED',
        reason: 'SMTP no configurado en variables de entorno',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('app.mail.port') ?? 587,
        secure: this.config.get<boolean>('app.mail.secure') ?? false,
        auth: this.config.get<string>('app.mail.user')
          ? {
              user: this.config.get<string>('app.mail.user'),
              pass: this.config.get<string>('app.mail.password'),
            }
          : undefined,
      });

      const info = await transporter.sendMail({
        from,
        to: input.to,
        subject: `Factura electronica autorizada ${input.accessKey}`,
        text: [
          `Estimado/a ${input.buyerName},`,
          '',
          'Adjuntamos su factura electronica autorizada por el SRI.',
          `Clave de acceso: ${input.accessKey}`,
          '',
          'Este correo fue generado automaticamente.',
        ].join('\n'),
        attachments: [
          { filename: `${input.accessKey}.pdf`, path: input.pdfPath },
          { filename: `${input.accessKey}.xml`, path: input.xmlPath },
        ],
      });

      this.logger.log(
        `Email sent to ${input.to} for ${input.accessKey}: ${info.messageId}`,
      );
      return { status: 'SENT', messageId: info.messageId };
    } catch (error) {
      const reason = (error as Error).message;
      this.logger.error(`Email failed for ${input.accessKey}: ${reason}`);
      return { status: 'FAILED', reason };
    }
  }

  async sendExpirationAlert(
    input: SendExpirationAlertInput,
  ): Promise<MailResult> {
    const host = this.config.get<string>('app.mail.host');
    const from = this.config.get<string>('app.mail.from');

    if (!host || !from) {
      return {
        status: 'SKIPPED',
        reason: 'SMTP no configurado en variables de entorno',
      };
    }

    // Definir color del badge de advertencia según la gravedad
    let badgeColor = '#eab308'; // Amarillo para 30 días
    if (input.diasRestantes <= 5) {
      badgeColor = '#ef4444'; // Rojo para 5 o 1 día
    } else if (input.diasRestantes <= 15) {
      badgeColor = '#f97316'; // Naranja para 15 días
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('app.mail.port') ?? 587,
        secure: this.config.get<boolean>('app.mail.secure') ?? false,
        auth: this.config.get<string>('app.mail.user')
          ? {
              user: this.config.get<string>('app.mail.user'),
              pass: this.config.get<string>('app.mail.password'),
            }
          : undefined,
      });

      const formattedDate = input.fechaVencimiento.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; color: #ffffff; font-weight: bold; font-size: 14px; margin-bottom: 24px; text-transform: uppercase; }
            .details-table { width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden; }
            .details-table td { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
            .details-table td.value { color: #0f172a; font-weight: 500; }
            .details-table tr:last-child td { border-bottom: none; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 6px; margin-top: 16px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
            .button:hover { background-color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Alerta de Expiración de Firma Electrónica</h1>
            </div>
            <div class="content">
              <div style="text-align: center;">
                <span class="badge" style="background-color: ${badgeColor};">
                  Expira en ${input.diasRestantes} ${input.diasRestantes === 1 ? 'día' : 'días'}
                </span>
              </div>
              <p>Estimado/a representante de <strong>${input.razonSocial}</strong>,</p>
              <p>Le informamos que el certificado de firma electrónica (.p12) registrado en nuestro sistema está próximo a vencer. Una vez expirado, no será posible firmar ni autorizar nuevos comprobantes electrónicos ante el SRI.</p>
              
              <table class="details-table">
                <tr>
                  <td class="label">Titular</td>
                  <td class="value">${input.titular}</td>
                </tr>
                <tr>
                  <td class="label">RUC Titular</td>
                  <td class="value">${input.ruc}</td>
                </tr>
                <tr>
                  <td class="label">Fecha de Vencimiento</td>
                  <td class="value" style="color: #ef4444; font-weight: 700;">${formattedDate}</td>
                </tr>
              </table>

              <p>Le recomendamos renovar su firma electrónica a tiempo y subir el nuevo archivo .p12 para asegurar la continuidad de su facturación.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="#" class="button" style="color: #ffffff;">Subir Nueva Firma</a>
              </div>
            </div>
            <div class="footer">
              Este es un correo automático, por favor no responda a este mensaje.
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await transporter.sendMail({
        from,
        to: input.to,
        subject: `⚠️ URGENTE: Firma electrónica próxima a vencer - ${input.razonSocial}`,
        html: htmlContent,
      });

      this.logger.log(
        `Expiration alert sent to ${input.to} for company ${input.razonSocial}: ${info.messageId}`,
      );
      return { status: 'SENT', messageId: info.messageId };
    } catch (error) {
      const reason = (error as Error).message;
      this.logger.error(
        `Expiration alert failed for company ${input.razonSocial}: ${reason}`,
      );
      return { status: 'FAILED', reason };
    }
  }
}
