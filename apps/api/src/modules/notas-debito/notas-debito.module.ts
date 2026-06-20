import { Module } from '@nestjs/common';
import { NotasDebitoController } from './notas-debito.controller';
import { NotasDebitoService } from './notas-debito.service';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';

@Module({
  imports: [CertificadosModule, XmlEngineModule],
  controllers: [NotasDebitoController],
  providers: [NotasDebitoService],
})
export class NotasDebitoModule {}
