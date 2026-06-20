import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { RpaService } from './rpa.service';
import { RPA_QUEUE } from '../../common/constants/queues';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface SincronizarComprasJob {
  empresaId: string;
  anio: number;
  mes: number;
}

@Processor(RPA_QUEUE)
export class RpaProcessor {
  private readonly logger = new Logger(RpaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rpaService: RpaService,
  ) {}

  @Process('sincronizar-compras')
  async handleSincronizarCompras(job: Job<SincronizarComprasJob>) {
    const { empresaId, anio, mes } = job.data;
    this.logger.log(
      `Iniciando tarea programada en cola RPA para la empresa ${empresaId} (${anio}-${mes})`,
    );

    try {
      const result = await this.rpaService.sincronizarCompras(
        empresaId,
        anio,
        mes,
      );

      this.logger.log(
        `Tarea RPA terminada. Se encontraron ${result.total} claves, procesando ${result.nuevas} nuevas.`,
      );

      await this.prisma.registroAuditoria.create({
        data: {
          empresa_id: empresaId,
          entidad: 'empresas',
          entidad_id: empresaId,
          accion: 'RPA_SINCRONIZACION_EXITOSA',
          valores_despues: {
            anio,
            mes,
            clavesSincronizadas: result.total,
            nuevasRegistradas: result.nuevas,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Fallo en la tarea de segundo plano RPA de la empresa ${empresaId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<SincronizarComprasJob>, error: Error) {
    this.logger.error(
      `Cola RPA - El Job ${job.id} falló tras todos sus intentos: ${error.message}`,
    );

    await this.prisma.registroAuditoria.create({
      data: {
        empresa_id: job.data.empresaId,
        entidad: 'empresas',
        entidad_id: job.data.empresaId,
        accion: 'RPA_SINCRONIZACION_FALLIDA',
        valores_despues: {
          anio: job.data.anio,
          mes: job.data.mes,
          error: error.message,
        },
      },
    });
  }
}
