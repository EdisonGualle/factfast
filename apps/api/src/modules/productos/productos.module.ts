import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { CategoriasController } from './categorias.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductosController, CategoriasController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
