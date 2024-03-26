export const configuration = {
  PORT: +process.env.PORT || 3000,
  DATABASE: process.env.DATABASE,
  REPOSITORIES_DIRECTORIES: (process.env.REPOSITORIES_DIRECTORIES || '').split(
    ',',
  ),
};
