import { AppException } from './app.exception';
export class ValidationException extends AppException {
  constructor(msg: string) { super(400, msg, null); }
}
