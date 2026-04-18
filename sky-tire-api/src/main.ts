import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Enable Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Use PORT from environment variables correctly
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
  await app.listen(port, '0.0.0.0');
  console.log(`\n\x1b[32m[NestJS] Application is running on: http://localhost:${port}/api\x1b[0m\n`);
}
bootstrap();
