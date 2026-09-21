import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // El frontend consume `http://localhost:8080/api`.
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('API Ladrillera')
    .setDescription(
      'Servicios REST sobre la base `ladrilleraspitalito`: autenticacion, usuarios y roles, ' +
        'empresas y sedes, catalogo de ladrillos, inventario con su libro de movimientos ' +
        'y ordenes de venta.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('health', 'Estado del servicio')
    .addTag('auth', 'Login, registro y sesion')
    .addTag('users', 'Usuarios y sus roles')
    .addTag('roles', 'Roles del sistema')
    .addTag('document-types', 'Tipos de documento')
    .addTag('companies', 'Empresas')
    .addTag('brick-yards', 'Sedes / ladrilleras')
    .addTag('brick-categories', 'Categorias de ladrillo')
    .addTag('materials', 'Materiales')
    .addTag('bricks', 'Catalogo de ladrillos')
    .addTag('inventory', 'Existencias por sede y movimientos')
    .addTag('orders', 'Ordenes de venta')
    .build();

  const document = SwaggerModule.createDocument(app, swagger);

  // UI en /api/docs y el JSON crudo en /api/docs-json.
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
  });

  const port = config.get<number>('PORT', 8080);
  await app.listen(port);

  console.log(`API en http://localhost:${port}/api`);
  console.log(`Swagger en http://localhost:${port}/api/docs`);
}

void bootstrap();
