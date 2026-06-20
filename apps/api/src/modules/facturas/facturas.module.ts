import { Module } from '@nestjs/common';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';
import { NotasCreditoModule } from '../notas-credito/notas-credito.module';

@Module({
  imports: [CertificadosModule, XmlEngineModule, NotasCreditoModule],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],
})
export class FacturasModule {}
