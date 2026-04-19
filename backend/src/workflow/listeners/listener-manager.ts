import { FlowListener } from './flow-listener';
import { FlowInstance, FlowTask } from '@prisma/client';

/**
 * 监听器管理器
 */
export class ListenerManager {
  private listeners: FlowListener[] = [];

  /**
   * 添加监听器
   * @param listener 监听器
   */
  addListener(listener: FlowListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   * @param listener 监听器
   */
  removeListener(listener: FlowListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 清空监听器
   */
  clearListeners(): void {
    this.listeners = [];
  }

  /**
   * 获取监听器数量
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * 流程启动前触发
   * @param instance 流程实例
   */
  async beforeFlowStart(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeFlowStart(instance);
    }
  }

  /**
   * 流程启动后触发
   * @param instance 流程实例
   */
  async afterFlowStart(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterFlowStart(instance);
    }
  }

  /**
   * 任务创建前触发
   * @param task 任务
   * @param instanceId 流程实例ID
   */
  async beforeTaskCreate(task: Partial<FlowTask>, instanceId: bigint): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeTaskCreate(task, instanceId);
    }
  }

  /**
   * 任务创建后触发
   * @param task 任务
   * @param instanceId 流程实例ID
   */
  async afterTaskCreate(task: FlowTask, instanceId: bigint): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterTaskCreate(task, instanceId);
    }
  }

  /**
   * 任务分配前触发
   * @param taskId 任务ID
   * @param users 用户列表
   */
  async beforeTaskAssign(taskId: bigint, users: string[]): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeTaskAssign(taskId, users);
    }
  }

  /**
   * 任务分配后触发
   * @param taskId 任务ID
   * @param users 用户列表
   */
  async afterTaskAssign(taskId: bigint, users: string[]): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterTaskAssign(taskId, users);
    }
  }

  /**
   * 任务完成前触发
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   */
  async beforeTaskComplete(taskId: bigint, instanceId: bigint): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeTaskComplete(taskId, instanceId);
    }
  }

  /**
   * 任务完成后触发
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param result 任务执行结果
   */
  async afterTaskComplete(taskId: bigint, instanceId: bigint, result: any): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterTaskComplete(taskId, instanceId, result);
    }
  }

  /**
   * 任务驳回前触发
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param targetNodeCode 目标节点代码
   */
  async beforeTaskReject(taskId: bigint, instanceId: bigint, targetNodeCode?: string): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeTaskReject(taskId, instanceId, targetNodeCode);
    }
  }

  /**
   * 任务驳回后触发
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param result 任务执行结果
   */
  async afterTaskReject(taskId: bigint, instanceId: bigint, result: any): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterTaskReject(taskId, instanceId, result);
    }
  }

  /**
   * 流程暂停前触发
   * @param instance 流程实例
   */
  async beforeFlowSuspend(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeFlowSuspend(instance);
    }
  }

  /**
   * 流程暂停后触发
   * @param instance 流程实例
   */
  async afterFlowSuspend(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterFlowSuspend(instance);
    }
  }

  /**
   * 流程激活前触发
   * @param instance 流程实例
   */
  async beforeFlowActivate(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeFlowActivate(instance);
    }
  }

  /**
   * 流程激活后触发
   * @param instance 流程实例
   */
  async afterFlowActivate(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterFlowActivate(instance);
    }
  }

  /**
   * 流程结束前触发
   * @param instance 流程实例
   */
  async beforeFlowEnd(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeFlowEnd(instance);
    }
  }

  /**
   * 流程结束后触发
   * @param instance 流程实例
   */
  async afterFlowEnd(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterFlowEnd(instance);
    }
  }

  /**
   * 流程取消前触发
   * @param instance 流程实例
   */
  async beforeFlowCancel(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeFlowCancel(instance);
    }
  }

  /**
   * 流程取消后触发
   * @param instance 流程实例
   */
  async afterFlowCancel(instance: FlowInstance): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterFlowCancel(instance);
    }
  }

  /**
   * 流程变量变更前触发
   * @param instanceId 流程实例ID
   * @param variables 变量
   */
  async beforeVariablesChange(instanceId: bigint, variables: any): Promise<void> {
    for (const listener of this.listeners) {
      await listener.beforeVariablesChange(instanceId, variables);
    }
  }

  /**
   * 流程变量变更后触发
   * @param instanceId 流程实例ID
   * @param variables 变量
   */
  async afterVariablesChange(instanceId: bigint, variables: any): Promise<void> {
    for (const listener of this.listeners) {
      await listener.afterVariablesChange(instanceId, variables);
    }
  }
}