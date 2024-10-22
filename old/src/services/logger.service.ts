import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  doLog(message: string) {
    console.log(message);
  }
}
