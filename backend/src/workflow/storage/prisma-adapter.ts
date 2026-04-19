import { PrismaService } from '../../prisma/prisma.service';
import { StorageAdapter } from './storage-adapter.interface';
import {
  FlowDefinition,
  FlowNode,
  FlowSkip,
  FlowInstance,
  FlowTask,
  FlowHisTask,
  FlowUser,
  FlowForm
} from '@prisma/client';

/**
 * Prisma 存储适配器实现
 */
export class PrismaAdapter implements StorageAdapter {
  constructor(private prisma: PrismaService) {}

  // 流程定义相关
  async findFlowDefinition(id: bigint): Promise<FlowDefinition | null> {
    return this.prisma.flowDefinition.findUnique({ where: { id } });
  }

  async findFlowDefinitions(): Promise<FlowDefinition[]> {
    return this.prisma.flowDefinition.findMany();
  }

  async findFlowDefinitionByCode(code: string): Promise<FlowDefinition | null> {
    return this.prisma.flowDefinition.findFirst({ where: { flowCode: code } });
  }

  async createFlowDefinition(data: any): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.create({ data });
  }

  async updateFlowDefinition(id: bigint, data: Partial<FlowDefinition>): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.update({ where: { id }, data });
  }

  async deleteFlowDefinition(id: bigint): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.delete({ where: { id } });
  }

  // 流程节点相关
  async findFlowNode(id: bigint): Promise<FlowNode | null> {
    return this.prisma.flowNode.findUnique({ where: { id } });
  }

  async findFlowNodesByDefinition(definitionId: bigint): Promise<FlowNode[]> {
    return this.prisma.flowNode.findMany({ where: { definitionId } });
  }

  async findFlowNodeByCode(definitionId: bigint, nodeCode: string): Promise<FlowNode | null> {
    return this.prisma.flowNode.findFirst({ where: { definitionId, nodeCode } });
  }

  async createFlowNode(data: any): Promise<FlowNode> {
    return this.prisma.flowNode.create({ data });
  }

  async updateFlowNode(id: bigint, data: Partial<FlowNode>): Promise<FlowNode> {
    return this.prisma.flowNode.update({ where: { id }, data });
  }

  async deleteFlowNode(id: bigint): Promise<FlowNode> {
    return this.prisma.flowNode.delete({ where: { id } });
  }

  // 流程跳转相关
  async findFlowSkip(id: bigint): Promise<FlowSkip | null> {
    return this.prisma.flowSkip.findUnique({ where: { id } });
  }

  async findFlowSkipsByDefinition(definitionId: bigint): Promise<FlowSkip[]> {
    return this.prisma.flowSkip.findMany({ where: { definitionId } });
  }

  async findFlowSkipsByCurrentNode(definitionId: bigint, nowNodeCode: string): Promise<FlowSkip[]> {
    return this.prisma.flowSkip.findMany({ where: { definitionId, nowNodeCode } });
  }

  async createFlowSkip(data: any): Promise<FlowSkip> {
    return this.prisma.flowSkip.create({ data });
  }

  async updateFlowSkip(id: bigint, data: Partial<FlowSkip>): Promise<FlowSkip> {
    return this.prisma.flowSkip.update({ where: { id }, data });
  }

  async deleteFlowSkip(id: bigint): Promise<FlowSkip> {
    return this.prisma.flowSkip.delete({ where: { id } });
  }

  // 流程实例相关
  async findFlowInstance(id: bigint): Promise<FlowInstance | null> {
    return this.prisma.flowInstance.findUnique({ where: { id } });
  }

  async findFlowInstancesByDefinition(definitionId: bigint): Promise<FlowInstance[]> {
    return this.prisma.flowInstance.findMany({ where: { definitionId } });
  }

  async findFlowInstancesByBusinessId(businessId: string): Promise<FlowInstance[]> {
    return this.prisma.flowInstance.findMany({ where: { businessId } });
  }

  async createFlowInstance(data: any): Promise<FlowInstance> {
    return this.prisma.flowInstance.create({ data });
  }

  async updateFlowInstance(id: bigint, data: Partial<FlowInstance>): Promise<FlowInstance> {
    return this.prisma.flowInstance.update({ where: { id }, data });
  }

  async deleteFlowInstance(id: bigint): Promise<FlowInstance> {
    return this.prisma.flowInstance.delete({ where: { id } });
  }

  // 任务相关
  async findFlowTask(id: bigint): Promise<FlowTask | null> {
    return this.prisma.flowTask.findUnique({ where: { id } });
  }

  async findFlowTasksByInstance(instanceId: bigint): Promise<FlowTask[]> {
    return this.prisma.flowTask.findMany({ where: { instanceId } });
  }

  async createFlowTask(data: any): Promise<FlowTask> {
    return this.prisma.flowTask.create({ data });
  }

  async updateFlowTask(id: bigint, data: Partial<FlowTask>): Promise<FlowTask> {
    return this.prisma.flowTask.update({ where: { id }, data });
  }

  async deleteFlowTask(id: bigint): Promise<FlowTask> {
    return this.prisma.flowTask.delete({ where: { id } });
  }

  async deleteFlowTasksByInstance(instanceId: bigint): Promise<{ count: number }> {
    return this.prisma.flowTask.deleteMany({ where: { instanceId } });
  }

  // 历史任务相关
  async findFlowHisTask(id: bigint): Promise<FlowHisTask | null> {
    return this.prisma.flowHisTask.findUnique({ where: { id } });
  }

  async findFlowHisTasksByInstance(instanceId: bigint): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({ where: { instanceId } });
  }

  async createFlowHisTask(data: any): Promise<FlowHisTask> {
    return this.prisma.flowHisTask.create({ data });
  }

  async createFlowHisTasks(data: any[]): Promise<{ count: number }> {
    return this.prisma.flowHisTask.createMany({ data });
  }

  // 用户相关
  async findFlowUser(id: bigint): Promise<FlowUser | null> {
    return this.prisma.flowUser.findUnique({ where: { id } });
  }

  async findFlowUsersByAssociated(associated: bigint): Promise<FlowUser[]> {
    return this.prisma.flowUser.findMany({ where: { associated } });
  }

  async findFlowUsersByProcessedBy(processedBy: string): Promise<FlowUser[]> {
    return this.prisma.flowUser.findMany({ where: { processedBy } });
  }

  async createFlowUser(data: any): Promise<FlowUser> {
    return this.prisma.flowUser.create({ data });
  }

  async createFlowUsers(data: any[]): Promise<{ count: number }> {
    return this.prisma.flowUser.createMany({ data });
  }

  async deleteFlowUser(id: bigint): Promise<FlowUser> {
    return this.prisma.flowUser.delete({ where: { id } });
  }

  async deleteFlowUsersByAssociated(associated: bigint): Promise<{ count: number }> {
    return this.prisma.flowUser.deleteMany({ where: { associated } });
  }

  // 表单相关
  async findFlowForm(id: bigint): Promise<FlowForm | null> {
    return this.prisma.flowForm.findUnique({ where: { id } });
  }

  async findFlowFormByCode(formCode: string): Promise<FlowForm | null> {
    return this.prisma.flowForm.findFirst({ where: { formCode } });
  }

  async findFlowForms(): Promise<FlowForm[]> {
    return this.prisma.flowForm.findMany();
  }

  async createFlowForm(data: any): Promise<FlowForm> {
    return this.prisma.flowForm.create({ data });
  }

  async updateFlowForm(id: bigint, data: Partial<FlowForm>): Promise<FlowForm> {
    return this.prisma.flowForm.update({ where: { id }, data });
  }

  async deleteFlowForm(id: bigint): Promise<FlowForm> {
    return this.prisma.flowForm.delete({ where: { id } });
  }

  // 事务相关
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  // 计数相关
  async countFlowInstances(status?: string): Promise<number> {
    return this.prisma.flowInstance.count({ where: status ? { flowStatus: status } : {} });
  }

  async countFlowTasks(status?: string): Promise<number> {
    return this.prisma.flowTask.count({ where: status ? { flowStatus: status } : {} });
  }

  async countFlowDefinitions(isPublish?: number): Promise<number> {
    return this.prisma.flowDefinition.count({ where: isPublish !== undefined ? { isPublish } : {} });
  }
}