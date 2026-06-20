import { Module } from '@nestjs/common';
import { NotasCreditoController } from './notas-credito.controller';
import { NotasCreditoService } from './notas-credito.service';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';

@Module({
  imports: [CertificadosModule, XmlEngineModule],
  controllers: [NotasCreditoController],
  providers: [NotasCreditoService],
  exports: [NotasCreditoService],
})
export class NotasCreditoModule {}
