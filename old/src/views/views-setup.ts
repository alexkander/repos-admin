import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';
import { resolve } from 'path';
import * as helpers from './helpers';

export const viewsSetup = (app: NestExpressApplication) => {
  app.useStaticAssets(resolve('public'));
  app.setBaseViewsDir(resolve('src/views/pages'));
  hbs.registerPartials(resolve('src/views/partials'));
  app.setViewEngine('hbs');

  Object.entries(helpers).forEach(([helperName, func]) => {
    hbs.registerHelper(helperName, func);
  });
};
