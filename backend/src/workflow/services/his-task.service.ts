import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowHisTask } from '@prisma/client';

/**
 * 历史任务服务
 */
@Injectable()
export class HisTaskService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取历史任务
   */
  async findFlowHisTask(id: bigint): Promise<FlowHisTask | null> {
    return this.prisma.flowHisTask.findUnique({ where: { id } });
  }

  /**
   * 根据流程实例获取历史任务列表
   */
  async getHisTasksByInstance(instanceId: bigint): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({ where: { instanceId } });
  }

  /**
   * 根据流程定义获取历史任务列表
   */
  async getHisTasksByDefinition(definitionId: bigint): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({ where: { definitionId } });
  }

  /**
   * 根据用户获取历史任务列表
   */
  async getHisTasksByUser(processedBy: string): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({ where: { approver: processedBy } });
  }

  /**
   * 创建历史任务
   */
  async createHisTask(data: {
    definitionId: bigint;
    instanceId: bigint;
    nodeCode: string;
    nodeName: string;
    nodeType: number;
    processedBy: string;
    approvalType: string;
    comment: string;
    createBy: string;
  }): Promise<FlowHisTask> {
    return this.prisma.flowHisTask.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        definitionId: data.definitionId,
        instanceId: data.instanceId,
        taskId: 0n,
        nodeCode: data.nodeCode,
        nodeName: data.nodeName,
        nodeType: data.nodeType,
        approver: data.processedBy,
        skipType: data.approvalType,
        flowStatus: 'completed',
        message: data.comment,
        createTime: new Date(),
        delFlag: '0',
      }
    });
  }

  /**
   * 批量创建历史任务
   */
  async createHisTasks(tasks: Array<{
    definitionId: bigint;
    instanceId: bigint;
    nodeCode: string;
    nodeName: string;
    nodeType: number;
    processedBy: string;
    approvalType: string;
    comment: string;
    createBy: string;
  }>): Promise<{ count: number }> {
    const hisTasks = tasks.map((task, index) => ({
      id: BigInt(Date.now()) + BigInt(index) + BigInt(Math.floor(Math.random() * 1000)),
      definitionId: task.definitionId,
      instanceId: task.instanceId,
      taskId: 0n,
      nodeCode: task.nodeCode,
      nodeName: task.nodeName,
      nodeType: task.nodeType,
      approver: task.processedBy,
      skipType: task.approvalType,
      flowStatus: 'completed',
      message: task.comment,
      createTime: new Date(),
      delFlag: '0',
    }));
    return this.prisma.flowHisTask.createMany({ data: hisTasks });
  }

  /**
   * 获取流程实例的审批历史
   */
  async getApprovalHistory(instanceId: bigint): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({
      where: { instanceId },
      orderBy: { createTime: 'asc' },
    });
  }

  /**
   * 获取用户的审批历史
   */
  async getUserApprovalHistory(processedBy: string, limit: number = 100): Promise<FlowHisTask[]> {
    return this.prisma.flowHisTask.findMany({
      where: { approver: processedBy },
      orderBy: { createTime: 'desc' },
      take: limit,
    });
  }
}