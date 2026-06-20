import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ProveedoresController } from './proveedores.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ClientesController, ProveedoresController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
