import { Injectable } from '@nestjs/common';

/**
 * 权限处理器
 */
@Injectable()
export class PermissionHandler {
  /**
   * 检查用户是否有权限执行操作
   * @param userId 用户ID
   * @param action 操作类型
   * @param resource 资源
   * @returns 是否有权限
   */
  async checkPermission(userId: string, action: string, resource: any): Promise<boolean> {
    // 默认实现，可在子类中重写
    // 例如：检查用户是否为流程发起人或管理员
    return true;
  }

  /**
   * 获取任务的默认处理人
   * @param nodeCode 节点编码
   * @param variables 流程变量
   * @returns 处理人列表
   */
  async getDefaultAssignees(nodeCode: string, variables: any): Promise<string[]> {
    // 默认实现，可在子类中重写
    return [];
  }
}