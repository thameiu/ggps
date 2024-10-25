import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from Next.js app
    credentials: true, // Allow cookies or other credentials
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))
  
  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
