import * as dotenv from 'dotenv';

dotenv.config();

export const configuration = {
  PORT: +process.env.PORT || 3000,
  DATABASE: process.env.DATABASE,
  REPOSITORIES_DIRECTORY: process.env.REPOSITORIES_DIRECTORY || '/repositories',
  ALLOW_DESTRUCTIVE_ACTIONS: process.env.ALLOW_DESTRUCTIVE_ACTIONS === 'true',
  SWAGGER_ACTIVE: process.env.SWAGGER_ACTIVE === 'true',
};
