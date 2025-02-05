import * as dotenv from 'dotenv';

dotenv.config();

export const configuration = {
  REPOSITORIES_DIRECTORY: process.env.REPOSITORIES_DIRECTORY || '/repositories',
  ALLOW_DESTRUCTIVE_ACTIONS: process.env.ALLOW_DESTRUCTIVE_ACTIONS === 'true',
};
