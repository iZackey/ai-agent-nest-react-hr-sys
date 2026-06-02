import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../../core/exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    if (exception instanceof AppException) {
      this.logger.error(`AppException - Path: ${request.url}, Code: ${exception.code}, Msg: ${exception.msg}`);
      return response.status(exception.code).json({ code: exception.code, data: exception.data, msg: exception.msg });
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let msg = '请求处理失败';
      if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
        const messages = (exceptionResponse as any).message;
        msg = Array.isArray(messages) ? messages[0] : messages;
      }
      this.logger.warn(`ValidationError - Path: ${request.url}`);
      return response.status(status).json({ code: status, data: null, msg: `参数验证失败: ${msg}` });
    }
    this.logger.error(`UnhandledException - Path: ${request.url}, Error: ${exception}`, exception instanceof Error ? exception.stack : undefined);
    return response.status(500).json({ code: 500, data: null, msg: '服务器内部错误' });
  }
}
