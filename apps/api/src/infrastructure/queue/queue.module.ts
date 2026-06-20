import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SriSubmissionProcessor } from './sri-submission.processor';
import { SriSoapService } from './sri-soap.service';
import { SRI_QUEUE } from '../../common/constants/queues';
import { RidePdfService } from '../documents/ride-pdf.service';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('app.redis.host'),
          port: config.get('app.redis.port'),
          password: config.get('app.redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: SRI_QUEUE }),
    MailModule,
  ],
  providers: [SriSubmissionProcessor, SriSoapService, RidePdfService],
  exports: [BullModule, SriSoapService],
})
export class QueueModule {}
