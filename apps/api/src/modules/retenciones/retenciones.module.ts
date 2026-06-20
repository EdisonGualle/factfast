import { Module } from '@nestjs/common';
import { RetencionesController } from './retenciones.controller';
import { RetencionesService } from './retenciones.service';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';

@Module({
  imports: [CertificadosModule, XmlEngineModule],
  controllers: [RetencionesController],
  providers: [RetencionesService],
  exports: [RetencionesService],
})
export class RetencionesModule {}
