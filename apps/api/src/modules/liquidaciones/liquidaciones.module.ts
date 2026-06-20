import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { LiquidacionesService } from './liquidaciones.service';
import { LiquidacionesController } from './liquidaciones.controller';
import { CertificadosModule } from '../certificados/certificados.module';
import { RetencionesModule } from '../retenciones/retenciones.module';
import { NotasCreditoModule } from '../notas-credito/notas-credito.module';
import { SRI_QUEUE } from '../../common/constants/queues';
import { AccessKeyService } from '../../infrastructure/xml-engine/access-key.service';
import { XmlBuilderService } from '../../infrastructure/xml-engine/xml-builder.service';
import { XmlSignerService } from '../../infrastructure/xml-engine/xml-signer.service';

@Module({
  imports: [
    CertificadosModule,
    RetencionesModule, // Para el flujo automático
    NotasCreditoModule, // Para la anulación
    BullModule.registerQueue({
      name: SRI_QUEUE,
    }),
  ],
  controllers: [LiquidacionesController],
  providers: [
    LiquidacionesService,
    AccessKeyService,
    XmlBuilderService,
    XmlSignerService,
  ],
  exports: [LiquidacionesService],
})
export class LiquidacionesModule {}
