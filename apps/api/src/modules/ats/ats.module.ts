import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { AtsBuilderService } from './ats-builder.service';

@Module({
  controllers: [AtsController],
  providers: [AtsService, AtsBuilderService],
  exports: [AtsService],
})
export class AtsModule {}
