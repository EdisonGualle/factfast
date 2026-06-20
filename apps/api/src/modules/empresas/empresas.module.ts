import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { ContribuyenteSriService } from './contribuyente-sri.service';
import { CertificadosModule } from '../certificados/certificados.module';

@Module({
  imports: [CertificadosModule],
  controllers: [EmpresasController],
  providers: [EmpresasService, ContribuyenteSriService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
