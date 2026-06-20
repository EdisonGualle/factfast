import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class CertificadosCronService {
  private readonly logger = new Logger(CertificadosCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Ejecuta la verificación de certificados diariamente a la 01:00 AM.
   */
  @Cron('0 1 * * *')
  async verificarVencimientos() {
    this.logger.log(
      'Iniciando verificación cron de vencimiento de firmas digitales...',
    );

    try {
      const certificados = await this.prisma.certificadoDigital.findMany({
        where: { activo: true },
        include: { empresa: true },
      });

      const hoy = new Date();
      const fechaHoy = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate(),
      );

      for (const cert of certificados) {
        const vencimiento = new Date(cert.fecha_vencimiento);
        const fechaVenc = new Date(
          vencimiento.getFullYear(),
          vencimiento.getMonth(),
          vencimiento.getDate(),
        );

        const diferenciaMs = fechaVenc.getTime() - fechaHoy.getTime();
        const diasRestantes = Math.round(diferenciaMs / (1000 * 60 * 60 * 24));

        // Alertar solo en los días clave: 30, 15, 5, 1
        if ([30, 15, 5, 1].includes(diasRestantes)) {
          this.logger.warn(
            `Firma digital de la empresa ${cert.empresa.razon_social} vencerá en ${diasRestantes} días (Fecha: ${cert.fecha_vencimiento.toISOString()})`,
          );

          // Obtener correos destinatarios
          let destinatarios: string[] = [];
          if (cert.empresa.correo) {
            destinatarios.push(cert.empresa.correo);
          } else {
            // Fallback: buscar administradores de la empresa
            const admins = await this.prisma.usuario.findMany({
              where: {
                empresa_id: cert.empresa_id,
                rol: 'ADMIN_EMPRESA',
                activo: true,
              },
              select: { correo: true },
            });
            destinatarios = admins.map((a) => a.correo);
          }

          if (destinatarios.length === 0) {
            this.logger.error(
              `No se encontraron correos destinatarios para la empresa ${cert.empresa.razon_social} (RUC: ${cert.empresa.ruc}) para enviar alerta de vencimiento.`,
            );
            continue;
          }

          // Enviar alerta a todos los destinatarios
          for (const email of destinatarios) {
            await this.mail.sendExpirationAlert({
              to: email,
              razonSocial: cert.empresa.razon_social,
              titular: cert.nombre_titular,
              ruc: cert.ruc_titular,
              fechaVencimiento: cert.fecha_vencimiento,
              diasRestantes,
            });
          }
        }
      }

      this.logger.log(
        'Verificación cron de vencimiento de firmas digitales finalizada con éxito.',
      );
    } catch (error) {
      this.logger.error(
        'Error al ejecutar la verificación de firmas digitales:',
        error,
      );
    }
  }
}
