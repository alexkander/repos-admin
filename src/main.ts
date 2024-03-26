import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configuration } from './configuration/configuration';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  await app.listen(configuration.PORT);
}
bootstrap();
