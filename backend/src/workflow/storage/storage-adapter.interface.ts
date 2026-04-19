import { FlowDefinition, FlowNode, FlowSkip, FlowInstance, FlowTask, FlowHisTask, FlowUser, FlowForm } from '@prisma/client';

/**
 * 存储适配器接口
 * 用于与不同的 ORM 实现解耦
 */
export interface StorageAdapter {
  // 流程定义相关
  findFlowDefinition(id: bigint): Promise<FlowDefinition | null>;
  findFlowDefinitions(): Promise<FlowDefinition[]>;
  findFlowDefinitionByCode(code: string): Promise<FlowDefinition | null>;
  createFlowDefinition(data: Partial<FlowDefinition>): Promise<FlowDefinition>;
  updateFlowDefinition(id: bigint, data: Partial<FlowDefinition>): Promise<FlowDefinition>;
  deleteFlowDefinition(id: bigint): Promise<FlowDefinition>;

  // 流程节点相关
  findFlowNode(id: bigint): Promise<FlowNode | null>;
  findFlowNodesByDefinition(definitionId: bigint): Promise<FlowNode[]>;
  findFlowNodeByCode(definitionId: bigint, nodeCode: string): Promise<FlowNode | null>;
  createFlowNode(data: Partial<FlowNode>): Promise<FlowNode>;
  updateFlowNode(id: bigint, data: Partial<FlowNode>): Promise<FlowNode>;
  deleteFlowNode(id: bigint): Promise<FlowNode>;

  // 流程跳转相关
  findFlowSkip(id: bigint): Promise<FlowSkip | null>;
  findFlowSkipsByDefinition(definitionId: bigint): Promise<FlowSkip[]>;
  findFlowSkipsByCurrentNode(definitionId: bigint, nowNodeCode: string): Promise<FlowSkip[]>;
  createFlowSkip(data: Partial<FlowSkip>): Promise<FlowSkip>;
  updateFlowSkip(id: bigint, data: Partial<FlowSkip>): Promise<FlowSkip>;
  deleteFlowSkip(id: bigint): Promise<FlowSkip>;

  // 流程实例相关
  findFlowInstance(id: bigint): Promise<FlowInstance | null>;
  findFlowInstancesByDefinition(definitionId: bigint): Promise<FlowInstance[]>;
  findFlowInstancesByBusinessId(businessId: string): Promise<FlowInstance[]>;
  createFlowInstance(data: Partial<FlowInstance>): Promise<FlowInstance>;
  updateFlowInstance(id: bigint, data: Partial<FlowInstance>): Promise<FlowInstance>;
  deleteFlowInstance(id: bigint): Promise<FlowInstance>;

  // 任务相关
  findFlowTask(id: bigint): Promise<FlowTask | null>;
  findFlowTasksByInstance(instanceId: bigint): Promise<FlowTask[]>;
  createFlowTask(data: Partial<FlowTask>): Promise<FlowTask>;
  updateFlowTask(id: bigint, data: Partial<FlowTask>): Promise<FlowTask>;
  deleteFlowTask(id: bigint): Promise<FlowTask>;
  deleteFlowTasksByInstance(instanceId: bigint): Promise<{ count: number }>;

  // 历史任务相关
  findFlowHisTask(id: bigint): Promise<FlowHisTask | null>;
  findFlowHisTasksByInstance(instanceId: bigint): Promise<FlowHisTask[]>;
  createFlowHisTask(data: Partial<FlowHisTask>): Promise<FlowHisTask>;
  createFlowHisTasks(data: Partial<FlowHisTask>[]): Promise<{ count: number }>;

  // 用户相关
  findFlowUser(id: bigint): Promise<FlowUser | null>;
  findFlowUsersByAssociated(associated: bigint): Promise<FlowUser[]>;
  findFlowUsersByProcessedBy(processedBy: string): Promise<FlowUser[]>;
  createFlowUser(data: Partial<FlowUser>): Promise<FlowUser>;
  createFlowUsers(data: Partial<FlowUser>[]): Promise<{ count: number }>;
  deleteFlowUser(id: bigint): Promise<FlowUser>;
  deleteFlowUsersByAssociated(associated: bigint): Promise<{ count: number }>;

  // 表单相关
  findFlowForm(id: bigint): Promise<FlowForm | null>;
  findFlowFormByCode(formCode: string): Promise<FlowForm | null>;
  findFlowForms(): Promise<FlowForm[]>;
  createFlowForm(data: Partial<FlowForm>): Promise<FlowForm>;
  updateFlowForm(id: bigint, data: Partial<FlowForm>): Promise<FlowForm>;
  deleteFlowForm(id: bigint): Promise<FlowForm>;

  // 事务相关
  transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;

  // 计数相关
  countFlowInstances(status?: string): Promise<number>;
  countFlowTasks(status?: string): Promise<number>;
  countFlowDefinitions(isPublish?: number): Promise<number>;
}