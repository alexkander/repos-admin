import * as pathOriginal from 'path';

export const routes = {
  normalize(str: string): string {
    return str.split('\\').join('/');
  },
  resolve(...paths: string[]): string {
    return routes.normalize(pathOriginal.resolve(...paths));
  },
  relative(from: string, to: string): string {
    return routes.normalize(pathOriginal.relative(from, to));
  },
  dirname(path: string): string {
    return routes.normalize(pathOriginal.dirname(path));
  },
  basename(path: string, suffix?: string): string {
    return routes.normalize(pathOriginal.basename(path, suffix));
  },
  join(...paths: string[]): string {
    return routes.normalize(pathOriginal.join(...paths));
  },
};
