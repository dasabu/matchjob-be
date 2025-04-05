import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static content in public folder (remember to add NestExpressApplication in create AppModule)
  app.useStaticAssets(join(__dirname, '..', 'public')); //js, css, images

  // Config port
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');

  // Cookie
  app.use(cookieParser());

  // Apply jwt auth guard for all routes
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  // Global transform response interceptor
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'], // v1, v2
  });

  app.enableCors({
    origin: 'http://localhost:2800',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'folder_type'],
    credentials: true,
  });

  await app.listen(port);
}
bootstrap();
