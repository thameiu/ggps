import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  var cors = require('cors')

  app.use(cors()) // Use this after the variable declaration
  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
