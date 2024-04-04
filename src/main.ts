import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { configuration } from './configuration/configuration';
import { viewsSetup } from './views/views-setup';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  viewsSetup(app);

  await app.listen(configuration.PORT);
  const url = await app.getUrl();
  console.info('server runing in', url);
}

bootstrap();
