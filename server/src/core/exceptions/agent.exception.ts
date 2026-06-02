import { AppException } from './app.exception';
export class AgentException extends AppException {
  constructor(msg: string = '查询处理失败') { super(500, msg, null); }
}
