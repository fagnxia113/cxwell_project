import { FlowInstance, FlowTask } from '@prisma/client';

/**
 * 流程监听器接口
 */
export interface FlowListener {
  /**
   * 流程启动前
   * @param instance 流程实例
   */
  beforeFlowStart(instance: FlowInstance): Promise<void>;

  /**
   * 流程启动后
   * @param instance 流程实例
   */
  afterFlowStart(instance: FlowInstance): Promise<void>;

  /**
   * 任务创建前
   * @param task 任务
   * @param instanceId 流程实例ID
   */
  beforeTaskCreate(task: Partial<FlowTask>, instanceId: bigint): Promise<void>;

  /**
   * 任务创建后
   * @param task 任务
   * @param instanceId 流程实例ID
   */
  afterTaskCreate(task: FlowTask, instanceId: bigint): Promise<void>;

  /**
   * 任务分配前
   * @param taskId 任务ID
   * @param users 用户列表
   */
  beforeTaskAssign(taskId: bigint, users: string[]): Promise<void>;

  /**
   * 任务分配后
   * @param taskId 任务ID
   * @param users 用户列表
   */
  afterTaskAssign(taskId: bigint, users: string[]): Promise<void>;

  /**
   * 任务完成前
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   */
  beforeTaskComplete(taskId: bigint, instanceId: bigint): Promise<void>;

  /**
   * 任务完成后
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param result 任务执行结果
   */
  afterTaskComplete(taskId: bigint, instanceId: bigint, result: any): Promise<void>;

  /**
   * 任务驳回前
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param targetNodeCode 目标节点代码
   */
  beforeTaskReject(taskId: bigint, instanceId: bigint, targetNodeCode?: string): Promise<void>;

  /**
   * 任务驳回后
   * @param taskId 任务ID
   * @param instanceId 流程实例ID
   * @param result 任务执行结果
   */
  afterTaskReject(taskId: bigint, instanceId: bigint, result: any): Promise<void>;

  /**
   * 流程暂停前
   * @param instance 流程实例
   */
  beforeFlowSuspend(instance: FlowInstance): Promise<void>;

  /**
   * 流程暂停后
   * @param instance 流程实例
   */
  afterFlowSuspend(instance: FlowInstance): Promise<void>;

  /**
   * 流程激活前
   * @param instance 流程实例
   */
  beforeFlowActivate(instance: FlowInstance): Promise<void>;

  /**
   * 流程激活后
   * @param instance 流程实例
   */
  afterFlowActivate(instance: FlowInstance): Promise<void>;

  /**
   * 流程结束前
   * @param instance 流程实例
   */
  beforeFlowEnd(instance: FlowInstance): Promise<void>;

  /**
   * 流程结束后
   * @param instance 流程实例
   */
  afterFlowEnd(instance: FlowInstance): Promise<void>;

  /**
   * 流程取消前
   * @param instance 流程实例
   */
  beforeFlowCancel(instance: FlowInstance): Promise<void>;

  /**
   * 流程取消后
   * @param instance 流程实例
   */
  afterFlowCancel(instance: FlowInstance): Promise<void>;

  /**
   * 流程变量变更前
   * @param instanceId 流程实例ID
   * @param variables 变量
   */
  beforeVariablesChange(instanceId: bigint, variables: any): Promise<void>;

  /**
   * 流程变量变更后
   * @param instanceId 流程实例ID
   * @param variables 变量
   */
  afterVariablesChange(instanceId: bigint, variables: any): Promise<void>;
}