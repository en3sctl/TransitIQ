import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Sunucu hatası oluştu';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const obj = exResponse as Record<string, unknown>;
        message = (obj.message as string | string[]) || exception.message;
      }
    }

    // Never leak stack traces or internal details
    const isProduction = process.env.NODE_ENV === 'production';

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(isProduction ? {} : { error: exception instanceof Error ? exception.name : 'Error' }),
      timestamp: new Date().toISOString(),
    });
  }
}
