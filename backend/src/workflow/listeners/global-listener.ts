import { FlowListener } from './flow-listener';
import { FlowInstance, FlowTask } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * 全局监听器实现
 */
export class GlobalListener implements FlowListener {
  private readonly logger = new Logger(GlobalListener.name);

  async beforeFlowStart(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程启动前: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async afterFlowStart(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程启动后: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async beforeTaskCreate(task: Partial<FlowTask>, instanceId: bigint): Promise<void> {
    this.logger.log(`[LISTENER] 任务创建前: NodeCode=${task.nodeCode}, InstanceID=${instanceId}`);
  }

  async afterTaskCreate(task: FlowTask, instanceId: bigint): Promise<void> {
    this.logger.log(`[LISTENER] 任务创建后: TaskID=${task.id}, NodeCode=${task.nodeCode}, InstanceID=${instanceId}`);
  }

  async beforeTaskAssign(taskId: bigint, users: string[]): Promise<void> {
    this.logger.log(`[LISTENER] 任务分配前: TaskID=${taskId}, Users=${users.join(',')}`);
  }

  async afterTaskAssign(taskId: bigint, users: string[]): Promise<void> {
    this.logger.log(`[LISTENER] 任务分配后: TaskID=${taskId}, Users=${users.join(',')}`);
  }

  async beforeTaskComplete(taskId: bigint, instanceId: bigint): Promise<void> {
    this.logger.log(`[LISTENER] 任务完成前: TaskID=${taskId}, InstanceID=${instanceId}`);
  }

  async afterTaskComplete(taskId: bigint, instanceId: bigint, result: any): Promise<void> {
    this.logger.log(`[LISTENER] 任务完成后: TaskID=${taskId}, InstanceID=${instanceId}, Result=${JSON.stringify(result)}`);
  }

  async beforeTaskReject(taskId: bigint, instanceId: bigint, targetNodeCode?: string): Promise<void> {
    this.logger.log(`[LISTENER] 任务驳回前: TaskID=${taskId}, InstanceID=${instanceId}, TargetNode=${targetNodeCode}`);
  }

  async afterTaskReject(taskId: bigint, instanceId: bigint, result: any): Promise<void> {
    this.logger.log(`[LISTENER] 任务驳回后: TaskID=${taskId}, InstanceID=${instanceId}, Result=${JSON.stringify(result)}`);
  }

  async beforeFlowSuspend(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程暂停前: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async afterFlowSuspend(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程暂停后: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async beforeFlowActivate(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程激活前: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async afterFlowActivate(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程激活后: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async beforeFlowEnd(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程结束前: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async afterFlowEnd(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程结束后: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async beforeFlowCancel(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程取消前: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async afterFlowCancel(instance: FlowInstance): Promise<void> {
    this.logger.log(`[LISTENER] 流程取消后: InstanceID=${instance.id}, BusinessID=${instance.businessId}`);
  }

  async beforeVariablesChange(instanceId: bigint, variables: any): Promise<void> {
    this.logger.log(`[LISTENER] 流程变量变更前: InstanceID=${instanceId}, Variables=${JSON.stringify(variables)}`);
  }

  async afterVariablesChange(instanceId: bigint, variables: any): Promise<void> {
    this.logger.log(`[LISTENER] 流程变量变更后: InstanceID=${instanceId}, Variables=${JSON.stringify(variables)}`);
  }
}