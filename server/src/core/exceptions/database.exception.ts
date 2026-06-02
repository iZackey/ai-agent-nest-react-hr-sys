import { AppException } from './app.exception';
export class DatabaseException extends AppException {
  constructor(msg: string = '服务器内部错误') { super(500, msg, null); }
}
