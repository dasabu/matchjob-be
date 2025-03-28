import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Config port
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');

  // Apply jwt auth guard for all routes
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  // Global transform response interceptor
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.enableCors({
    origin: '*', // http://localhost:3000
    methods: 'GET, POST, PUT, PATCH, DELETE, HEAD',
    preflightContinue: false,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'], // v1, v2
  });

  await app.listen(port);
}
bootstrap();
