export const configuration = {
  PORT: +process.env.PORT || 3000,
  DATABASE: process.env.DATABASE,
  FOLDERS: (process.env.FOLDERS || '').split(','),
};
