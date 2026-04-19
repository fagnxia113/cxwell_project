import { Injectable } from '@nestjs/common';
import { DataFillHandler } from './data-fill.handler';
import { PermissionHandler } from './permission.handler';
import { TenantHandler } from './tenant.handler';

/**
 * 处理器类型
 */
export enum HandlerType {
  DATA_FILL = 'dataFill',
  PERMISSION = 'permission',
  TENANT = 'tenant',
}

/**
 * 处理器管理器
 */
@Injectable()
export class HandlerManager {
  private handlers: Map<HandlerType, any> = new Map();

  constructor(
    private dataFillHandler: DataFillHandler,
    private permissionHandler: PermissionHandler,
    private tenantHandler: TenantHandler
  ) {
    this.initHandlers();
  }

  /**
   * 初始化处理器
   */
  private initHandlers() {
    this.handlers.set(HandlerType.DATA_FILL, this.dataFillHandler);
    this.handlers.set(HandlerType.PERMISSION, this.permissionHandler);
    this.handlers.set(HandlerType.TENANT, this.tenantHandler);
  }

  /**
   * 获取处理器
   */
  getHandler(type: HandlerType) {
    return this.handlers.get(type);
  }

  /**
   * 注册处理器
   */
  registerHandler(type: HandlerType, handler: any) {
    this.handlers.set(type, handler);
  }

  /**
   * 执行数据填充
   */
  async fillVariables(variables: any, instanceId: bigint): Promise<any> {
    const handler = this.getHandler(HandlerType.DATA_FILL);
    if (handler) {
      return handler.fillVariables(variables, instanceId);
    }
    return variables;
  }

  /**
   * 执行任务数据填充
   */
  async fillTaskData(taskData: any, instanceId: bigint): Promise<any> {
    const handler = this.getHandler(HandlerType.DATA_FILL);
    if (handler) {
      return handler.fillTaskData(taskData, instanceId);
    }
    return taskData;
  }

  /**
   * 检查权限
   */
  async checkPermission(userId: string, taskId: bigint): Promise<boolean> {
    const handler = this.getHandler(HandlerType.PERMISSION);
    if (handler) {
      return handler.checkPermission(userId, taskId);
    }
    return true;
  }

  /**
   * 获取租户ID
   */
  async getTenantId(): Promise<string | null> {
    const handler = this.getHandler(HandlerType.TENANT);
    if (handler) {
      return handler.getTenantId();
    }
    return null;
  }

  /**
   * 处理租户数据
   */
  async handleTenantData(data: any): Promise<any> {
    const handler = this.getHandler(HandlerType.TENANT);
    if (handler) {
      return handler.handleTenantData(data);
    }
    return data;
  }
}