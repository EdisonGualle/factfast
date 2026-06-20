import { Module } from '@nestjs/common';
import { GuiasRemisionController } from './guias-remision.controller';
import { GuiasRemisionService } from './guias-remision.service';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';

@Module({
  imports: [CertificadosModule, XmlEngineModule],
  controllers: [GuiasRemisionController],
  providers: [GuiasRemisionService],
})
export class GuiasRemisionModule {}
