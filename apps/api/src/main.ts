import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const prefix = config.get<string>('app.apiPrefix', 'v1');
  const env = config.get<string>('app.env', 'development');

  app.setGlobalPrefix(prefix);

  app.enableCors({
    origin:
      env === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API de Facturacion Electronica SRI')
      .setDescription(
        'Sistema de facturacion electronica para Ecuador (SRI).\n\n' +
          'Soporta: facturas, notas de credito, notas de debito, guias de remision y comprobantes de retencion.\n\n' +
          'Especificacion tecnica SRI v2.26 - marzo 2024.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de acceso JWT',
        },
        'access-token',
      )
      .addTag('Autenticacion', 'Autenticacion, registro y sesiones')
      .addTag('Empresas', 'Gestion de empresas y contribuyentes')
      .addTag('Sucursales', 'Sucursales y establecimientos')
      .addTag('Puntos de emision', 'Puntos de emision y secuenciales')
      .addTag('Certificados', 'Boveda de certificados digitales (.p12)')
      .addTag('Catalogos', 'Catalogos de referencia SRI (solo lectura)')
      .addTag('Facturas', 'Emision de facturas electronicas')
      .addTag('Notas de credito', 'Notas de credito')
      .addTag('Notas de debito', 'Notas de debito')
      .addTag('Guias de remision', 'Guias de remision')
      .addTag('Retenciones', 'Comprobantes de retencion')
      .addTag('Salud', 'Estado del sistema')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
      customSiteTitle: 'API Facturacion SRI - Documentacion',
    });
  }

  await app.listen(port);

  console.log(`\n🚀 API running:     http://localhost:${port}/${prefix}`);
  console.log(`📖 Swagger docs:    http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check:    http://localhost:${port}/${prefix}/status`);
  console.log(`📊 Metrics:         http://localhost:${port}/${prefix}/metrics\n`);
}

bootstrap();
