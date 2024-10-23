import * as pathOriginal from 'path';

export class RoutesUtils {
  static normalize(str: string): string {
    return str.split('\\').join('/');
  }

  static resolve(...paths: string[]): string {
    return RoutesUtils.normalize(pathOriginal.resolve(...paths));
  }

  static relative(from: string, to: string): string {
    return RoutesUtils.normalize(pathOriginal.relative(from, to));
  }

  static dirname(path: string): string {
    return RoutesUtils.normalize(pathOriginal.dirname(path));
  }

  static basename(path: string, suffix?: string): string {
    return RoutesUtils.normalize(pathOriginal.basename(path, suffix));
  }

  static join(...paths: string[]): string {
    return RoutesUtils.normalize(pathOriginal.join(...paths));
  }
}
