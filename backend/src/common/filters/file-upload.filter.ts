import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError, Error)
export class FileUploadExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = '文件上传失败';

    if (exception instanceof MulterError) {
      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          status = 413;
          message = '文件大小超过限制，最大允许 500MB';
          break;
        case 'LIMIT_FILE_COUNT':
          status = 400;
          message = '文件数量超过限制';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          status = 400;
          message = '意外的文件字段';
          break;
        case 'LIMIT_PART_COUNT':
          status = 400;
          message = '表单部分数量超过限制';
          break;
        case 'LIMIT_FIELD_KEY':
          status = 400;
          message = '字段名过长';
          break;
        case 'LIMIT_FIELD_VALUE':
          status = 400;
          message = '字段值过长';
          break;
        case 'LIMIT_FIELD_COUNT':
          status = 400;
          message = '字段数量超过限制';
          break;
        default:
          message = `文件上传错误: ${exception.message}`;
      }
    } else if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || '请求参数错误';
    } else if (exception instanceof PayloadTooLargeException) {
      status = exception.getStatus();
      message = '请求体过大';
    } else {
      message = exception.message || '服务器内部错误';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
