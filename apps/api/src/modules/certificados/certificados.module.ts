import { Module } from '@nestjs/common';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';
import { EncryptionService } from './encryption.service';
import { CertificadosCronService } from './certificados-cron.service';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [CertificadosController],
  providers: [CertificadosService, EncryptionService, CertificadosCronService],
  exports: [CertificadosService, EncryptionService],
})
export class CertificadosModule {}
