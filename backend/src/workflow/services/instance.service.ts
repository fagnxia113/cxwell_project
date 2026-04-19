import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowInstance } from '@prisma/client';
import { ListenerManager } from '../listeners/listener-manager';

/**
 * 流程实例服务
 */
@Injectable()
export class InstanceService {
  private readonly logger = new Logger(InstanceService.name);

  constructor(
    private prisma: PrismaService,
    private listenerManager: ListenerManager
  ) {}

  /**
   * 获取流程实例
   */
  async getInstance(instanceId: bigint): Promise<FlowInstance> {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new BadRequestException('流程实例不存在');
    return instance;
  }

  /**
   * 激活流程实例
   */
  async activeInstance(instanceId: bigint, operator: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.flowStatus === 'finished' || instance.flowStatus === 'cancelled') {
      throw new BadRequestException('已完结或已取消的流程无法激活');
    }

    // 触发流程激活前监听器
    await this.listenerManager.beforeFlowActivate(instance);

    const updatedInstance = await this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        flowStatus: 'running',
        updateTime: new Date(),
        updateBy: operator,
      }
    });

    // 触发流程激活后监听器
    await this.listenerManager.afterFlowActivate(updatedInstance);

    this.logger.log(`[WF-ACTIVE] InstanceID: ${instanceId} 已被 ${operator} 激活`);
    return { active: true };
  }

  /**
   * 挂起流程实例
   */
  async suspendInstance(instanceId: bigint, operator: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.flowStatus === 'finished' || instance.flowStatus === 'cancelled') {
      throw new BadRequestException('已完结或已取消的流程无法挂起');
    }

    // 触发流程暂停前监听器
    await this.listenerManager.beforeFlowSuspend(instance);

    const updatedInstance = await this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        flowStatus: 'suspended',
        updateTime: new Date(),
        updateBy: operator,
      }
    });

    // 触发流程暂停后监听器
    await this.listenerManager.afterFlowSuspend(updatedInstance);

    this.logger.log(`[WF-SUSPEND] InstanceID: ${instanceId} 已被 ${operator} 挂起`);
    return { suspended: true };
  }

  /**
   * 取消流程实例
   */
  async cancelInstance(instanceId: bigint, operator: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.flowStatus === 'finished') throw new BadRequestException('已完结的流程无法撤回');

    // 权限校验：仅发起人或管理员可撤还
    if (instance.createBy !== operator && operator !== 'admin') {
      throw new BadRequestException('您无权撤回该流程');
    }

    // 触发流程取消前监听器
    await this.listenerManager.beforeFlowCancel(instance);

    return this.prisma.$transaction(async (tx) => {
      // 找出所有关联的待办任务
      const tasks = await tx.flowTask.findMany({ where: { instanceId }, select: { id: true } });
      const taskIds = tasks.map(t => t.id);

      // 删掉所有 FlowUser
      await tx.flowUser.deleteMany({
        where: {
          associated: { in: taskIds }
        }
      });

      // 删掉所有待办任务
      await tx.flowTask.deleteMany({ where: { instanceId } });

      const updatedInstance = await tx.flowInstance.update({
        where: { id: instanceId },
        data: {
          flowStatus: 'cancelled',
          updateTime: new Date(),
          updateBy: operator,
        }
      });

      // 触发流程取消后监听器
      await this.listenerManager.afterFlowCancel(updatedInstance);

      this.logger.log(`[WF-CANCEL] InstanceID: ${instanceId} 已被 ${operator} 撤回`);
      return { cancelled: true };
    });
  }

  /**
   * 获取流程变量
   */
  async getVariables(instanceId: bigint) {
    const instance = await this.getInstance(instanceId);
    return instance.ext ? JSON.parse(instance.ext) : {};
  }

  /**
   * 设置流程变量
   */
  async setVariables(instanceId: bigint, variables: any, operator: string) {
    const instance = await this.getInstance(instanceId);

    const currentVariables = instance.ext ? JSON.parse(instance.ext) : {};
    const updatedVariables = { ...currentVariables, ...variables };

    // 触发流程变量变更前监听器
    await this.listenerManager.beforeVariablesChange(instanceId, variables);

    await this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        ext: JSON.stringify(updatedVariables),
        updateTime: new Date(),
        updateBy: operator,
      }
    });

    // 触发流程变量变更后监听器
    await this.listenerManager.afterVariablesChange(instanceId, updatedVariables);

    this.logger.log(`[WF-VARIABLE] InstanceID: ${instanceId} 变量已更新`);
    return { success: true, variables: updatedVariables };
  }

  /**
   * 删除流程变量
   */
  async removeVariables(instanceId: bigint, keys: string[], operator: string) {
    const instance = await this.getInstance(instanceId);

    const currentVariables = instance.ext ? JSON.parse(instance.ext) : {};
    const originalVariables = { ...currentVariables };
    
    // 删除指定的变量
    keys.forEach(key => {
      delete currentVariables[key];
    });

    // 触发流程变量变更前监听器
    await this.listenerManager.beforeVariablesChange(instanceId, { removedKeys: keys });

    await this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        ext: JSON.stringify(currentVariables),
        updateTime: new Date(),
        updateBy: operator,
      }
    });

    // 触发流程变量变更后监听器
    await this.listenerManager.afterVariablesChange(instanceId, currentVariables);

    this.logger.log(`[WF-VARIABLE] InstanceID: ${instanceId} 变量已删除: ${keys.join(', ')}`);
    return { success: true, variables: currentVariables };
  }
}