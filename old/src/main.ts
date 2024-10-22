import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configuration } from './configuration/configuration';
import { viewsSetup } from './views/views-setup';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  viewsSetup(app);

  if (configuration.SWAGGER_ACTIVE) {
    const options = new DocumentBuilder()
      .setTitle('API Repo admin')
      .setDescription('API Repo Admin')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-documentation', app, document);
  }

  await app.listen(configuration.PORT);
  const url = await app.getUrl();
  console.info('server running in', url);
}

bootstrap();
