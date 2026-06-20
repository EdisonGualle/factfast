import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { LotesService } from './lotes.service';
import { LotesController } from './lotes.controller';
import { XmlEngineModule } from '../../infrastructure/xml-engine/xml-engine.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { SRI_QUEUE } from '../../common/constants/queues';

@Module({
  imports: [
    XmlEngineModule,
    QueueModule,
    BullModule.registerQueue({
      name: SRI_QUEUE,
    }),
  ],
  controllers: [LotesController],
  providers: [LotesService],
  exports: [LotesService],
})
export class LotesModule {}
