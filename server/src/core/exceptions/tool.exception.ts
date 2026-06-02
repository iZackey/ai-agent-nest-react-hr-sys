import { AppException } from './app.exception';
export class ToolException extends AppException {
  constructor(msg: string = '工具执行失败') { super(500, msg, null); }
}
