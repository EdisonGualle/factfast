import { Module } from '@nestjs/common';
import { PuntosEmisionController } from './puntos-emision.controller';
import { PuntosEmisionService } from './puntos-emision.service';

@Module({
  controllers: [PuntosEmisionController],
  providers: [PuntosEmisionService],
  exports: [PuntosEmisionService],
})
export class PuntosEmisionModule {}
