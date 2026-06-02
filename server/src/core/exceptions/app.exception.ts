import { HttpException } from '@nestjs/common';
export class AppException extends HttpException {
  code: number;
  msg: string;
  data: any;
  constructor(code: number, msg: string, data: any = null) {
    super(msg, code);
    this.code = code;
    this.msg = msg;
    this.data = data;
  }
}
