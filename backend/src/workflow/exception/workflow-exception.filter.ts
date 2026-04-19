import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 工作流异常码
 */
export enum WorkflowErrorCode {
  // 流程定义相关
  DEFINITION_NOT_FOUND = 'WF001',
  DEFINITION_ALREADY_EXISTS = 'WF002',
  DEFINITION_NOT_PUBLISHED = 'WF003',
  
  // 流程实例相关
  INSTANCE_NOT_FOUND = 'WF004',
  INSTANCE_ALREADY_CANCELLED = 'WF005',
  INSTANCE_ALREADY_SUSPENDED = 'WF006',
  
  // 任务相关
  TASK_NOT_FOUND = 'WF007',
  TASK_NOT_ASSIGNED = 'WF008',
  TASK_ALREADY_COMPLETED = 'WF009',
  
  // 表单相关
  FORM_NOT_FOUND = 'WF010',
  FORM_CODE_EXISTS = 'WF011',
  FORM_VALIDATION_ERROR = 'WF012',
  
  // 权限相关
  PERMISSION_DENIED = 'WF013',
  
  // 系统相关
  SYSTEM_ERROR = 'WF999',
}

/**
 * 工作流异常
 */
export class WorkflowException extends Error {
  constructor(
    public readonly errorCode: WorkflowErrorCode,
    public readonly message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'WorkflowException';
  }
}

/**
 * 工作流异常过滤器
 */
@Catch(WorkflowException)
export class WorkflowExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WorkflowExceptionFilter.name);

  catch(exception: WorkflowException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;

    this.logger.error(
      `[${exception.errorCode}] ${exception.message}`,
      exception.stack,
      `${request.method} ${request.url}`
    );

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.details,
      });
  }
}
