import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { appConfig, validateConfig } from './config/app.config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { AutenticacionModule } from './modules/autenticacion/autenticacion.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CajasModule } from './modules/cajas/cajas.module';
import { BodegasModule } from './modules/bodegas/bodegas.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ProductosModule } from './modules/productos/productos.module';
import { PosModule } from './modules/pos/pos.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { PuntosEmisionModule } from './modules/puntos-emision/puntos-emision.module';
import { CertificadosModule } from './modules/certificados/certificados.module';
import { XmlEngineModule } from './infrastructure/xml-engine/xml-engine.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { NotasCreditoModule } from './modules/notas-credito/notas-credito.module';
import { NotasDebitoModule } from './modules/notas-debito/notas-debito.module';
import { GuiasRemisionModule } from './modules/guias-remision/guias-remision.module';
import { RetencionesModule } from './modules/retenciones/retenciones.module';
import { LiquidacionesModule } from './modules/liquidaciones/liquidaciones.module';
import { LotesModule } from './modules/lotes/lotes.module';
import { AtsModule } from './modules/ats/ats.module';
import { RpaModule } from './modules/rpa/rpa.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AccesoEmpresaGuard } from './common/guards/acceso-empresa.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TenantMiddleware } from './common/context/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
      cache: true,
    }),

    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('app.env', 'development');
        const isProd = env === 'production';
        return {
          transports: [
            new winston.transports.Console({
              format: isProd
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, context }) =>
                      `${timestamp} [${context ?? 'App'}] ${level}: ${message}`,
                    ),
                  ),
            }),
          ],
        };
      },
    }),

    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),

    DatabaseModule,
    HealthModule,
    CatalogosModule,
    AutenticacionModule,
    TenantsModule,
    CajasModule,
    BodegasModule,
    ClientesModule,
    ProductosModule,
    PosModule,
    EmpresasModule,
    SucursalesModule,
    PuntosEmisionModule,
    CertificadosModule,
    XmlEngineModule,
    QueueModule,
    FacturasModule,
    NotasCreditoModule,
    NotasDebitoModule,
    GuiasRemisionModule,
    RetencionesModule,
    LiquidacionesModule,
    LotesModule,
    AtsModule,
    RpaModule,
  ],
  providers: [
    // JWT guard applied globally — use @Publico() to skip on specific routes
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: AccesoEmpresaGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
