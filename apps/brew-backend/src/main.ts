import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // All routes under /v1 (API versioning per the contracts).
  app.setGlobalPrefix('');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });

  // Request validation (reject unknown/invalid payloads at the edge).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Tamper-evident audit logging of every request.
  app.useGlobalInterceptors(new AuditInterceptor());

  // Swagger / OpenAPI served at /docs.
  const config = new DocumentBuilder()
    .setTitle('Project Brew API')
    .setDescription('Café operations platform — modular monolith (mock adapters in dev).')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  new Logger('Bootstrap').log(`brew-backend on http://localhost:${port} (docs at /docs)`);
}

void bootstrap();
