import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RpaController } from './rpa.controller';
import { RpaService } from './rpa.service';
import { RpaProcessor } from './rpa.processor';
import { RPA_QUEUE } from '../../common/constants/queues';
import { CertificadosModule } from '../certificados/certificados.module';
import { XmlParserModule } from '../xml-parser/xml-parser.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: RPA_QUEUE }),
    CertificadosModule,
    XmlParserModule,
  ],
  controllers: [RpaController],
  providers: [RpaService, RpaProcessor],
  exports: [RpaService],
})
export class RpaModule {}
