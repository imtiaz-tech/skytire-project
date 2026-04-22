import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const prismaService = app.get(PrismaService);

  // Register cookie plugin
  await app.register(fastifyCookie);

  // Register session plugin
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key-123!',
    cookieName: 'sessionId',
    store: new PrismaSessionStore(
      prismaService as any,
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    ),

    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    },
  });


  // Enable Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Use PORT from environment variables correctly
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
  await app.listen(port, '0.0.0.0');
  console.log(`\n\x1b[32m[NestJS] Application is running on: http://localhost:${port}/api\x1b[0m\n`);
}
bootstrap();
