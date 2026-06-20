import { Module } from '@nestjs/common';
import { CajasService } from './cajas.service';
import { CajasController } from './cajas.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CajaAbiertaGuard } from './guards/caja-abierta.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [CajasController],
  providers: [CajasService, CajaAbiertaGuard],
  exports: [CajasService, CajaAbiertaGuard],
})
export class CajasModule {}
