import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});


  app.enableCors({
    origin: 'http://localhost:3000', 
    credentials: true, 
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
