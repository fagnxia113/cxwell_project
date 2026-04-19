import { Injectable } from '@nestjs/common';

/**
 * 租户处理器
 */
@Injectable()
export class TenantHandler {
  /**
   * 获取当前租户ID
   * @returns 租户ID
   */
  async getCurrentTenantId(): Promise<string> {
    // 默认实现，可在子类中重写
    return 'default';
  }

  /**
   * 检查用户是否属于指定租户
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @returns 是否属于
   */
  async checkUserInTenant(userId: string, tenantId: string): Promise<boolean> {
    // 默认实现，可在子类中重写
    return true;
  }

  /**
   * 获取租户的流程定义列表
   * @param tenantId 租户ID
   * @returns 流程定义ID列表
   */
  async getTenantFlowDefinitions(tenantId: string): Promise<bigint[]> {
    // 默认实现，可在子类中重写
    return [];
  }
}