import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FacturasModule } from '../facturas/facturas.module';
import { BodegasModule } from '../bodegas/bodegas.module';
import { CajasModule } from '../cajas/cajas.module';

@Module({
  imports: [
    DatabaseModule,
    FacturasModule,
    BodegasModule,
    CajasModule,
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
