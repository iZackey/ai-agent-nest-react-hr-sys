import { AppException } from './app.exception';
export class SessionException extends AppException {
  constructor(msg: string) { super(400, msg, null); }
}
