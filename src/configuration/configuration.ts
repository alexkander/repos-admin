export const configuration = {
  PORT: +process.env.PORT || 3000,
  DATABASE: process.env.DATABASE,
  REPOSITORIES_DIRECTORY: process.env.REPOSITORIES_DIRECTORY || '/repositories',
};
