import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { configuration } from './configuration/configuration';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  await app.listen(configuration.PORT);
  const url = await app.getUrl();
  console.info('server runing in', url);
}
bootstrap();
