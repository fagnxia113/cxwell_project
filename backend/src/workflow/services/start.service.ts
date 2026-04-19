import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListenerManager } from '../listeners/listener-manager';

/**
 * 流程启动服务
 */
@Injectable()
export class StartService {
  private readonly logger = new Logger(StartService.name);

  constructor(
    private prisma: PrismaService,
    private listenerManager: ListenerManager
  ) {}

  /**
   * 保存申请草稿
   */
  async saveDraft(definitionId: bigint, businessId: string, starter: string, variables?: any) {
    const id = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    return this.prisma.flowInstance.create({
      data: {
        id,
        definitionId,
        businessId,
        nodeType: 0,
        nodeCode: 'draft',
        flowStatus: 'draft',
        createBy: starter,
        ext: variables ? JSON.stringify(variables) : null,
      }
    });
  }

  /**
   * 提交草稿（正式发起流程）
   */
  async submitDraft(instanceId: bigint, starter: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.flowStatus !== 'draft') {
      throw new BadRequestException('草稿不存在或状态异常');
    }

    // 复用 startInstance 的核心步骤，但更新现有记录
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: instance.definitionId } });
    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: instance.definitionId } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId: instance.definitionId, nowNodeCode: startNode?.nodeCode }
    });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    if (!nextNode) throw new BadRequestException('流程配置异常，无法找到下一步');

    return this.prisma.$transaction(async (tx) => {
      // 1. 更新实例状态为 running
      const updatedInstance = await tx.flowInstance.update({
        where: { id: instanceId },
        data: {
          flowStatus: 'running',
          nodeType: nextNode.nodeType,
          nodeCode: nextNode.nodeCode,
          nodeName: nextNode.nodeName,
          updateTime: new Date(),
        }
      });

      // 触发流程启动监听器
      await this.listenerManager.beforeFlowStart(updatedInstance);

      // 2. 创建首个待办任务
      const taskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      const taskData = {
        id: taskId,
        definitionId: instance.definitionId,
        instanceId: instanceId,
        nodeCode: nextNode.nodeCode,
        nodeName: nextNode.nodeName,
        nodeType: nextNode.nodeType,
        flowStatus: 'todo',
        createBy: starter,
      };

      // 触发任务创建前监听器
      await this.listenerManager.beforeTaskCreate(taskData, instanceId);

      const task = await tx.flowTask.create({ data: taskData });

      // 触发任务创建后监听器
      await this.listenerManager.afterTaskCreate(task, instanceId);

      // 3. 绑定处理人
      if (nextNode.permissionFlag) {
        const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
        
        // 触发任务分配前监听器
        await this.listenerManager.beforeTaskAssign(taskId, userIds);

        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1',
              processedBy: uid.trim(),
              associated: taskId,
              createBy: starter,
            }
          });
        }

        // 触发任务分配后监听器
        await this.listenerManager.afterTaskAssign(taskId, userIds);
      }

      // 触发流程启动后监听器
      await this.listenerManager.afterFlowStart(updatedInstance);

      return { success: true };
    });
  }

  /**
   * 启动流程实例
   */
  async startInstance(definitionId: bigint, businessId: string, starter: string) {
    // 1. 获取定义
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('未找到该流程定义');
    if (def.isPublish !== 1) throw new BadRequestException('该流程尚未发布，无法发起');

    // 2. 获取开始节点 (nodeType = 0)
    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: def.id } });
    const startNode = nodes.find(n => n.nodeType === 0);
    if (!startNode) throw new BadRequestException('该流程缺少开始节点');

    // 3. 寻找下一步连线 (Skip)
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId: def.id, nowNodeCode: startNode.nodeCode }
    });
    if (!skip) throw new BadRequestException('开始节点没有指向下一步流程');

    const nextNode = nodes.find(n => n.nodeCode === skip.nextNodeCode);
    if (!nextNode) throw new BadRequestException('下一步节点数据异常');

    // 4. 发起事务：创建实例 + 初始化首个任务
    return this.prisma.$transaction(async (tx) => {
      const instanceId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      
      // 构建实例数据
      const instanceData = {
        id: instanceId,
        definitionId: def.id,
        businessId,
        nodeType: nextNode.nodeType,
        nodeCode: nextNode.nodeCode,
        nodeName: nextNode.nodeName,
        flowStatus: 'running',
        createBy: starter,
      };

      // 创建实例
      const instance = await tx.flowInstance.create({ data: instanceData });

      // 触发流程启动监听器
      await this.listenerManager.beforeFlowStart(instance);

      // 创建首个待办任务
      const taskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)) + 1n;
      const taskData = {
        id: taskId,
        definitionId: def.id,
        instanceId: instance.id,
        nodeCode: nextNode.nodeCode,
        nodeName: nextNode.nodeName,
        nodeType: nextNode.nodeType,
        flowStatus: 'todo',
        createBy: starter,
      };

      // 触发任务创建前监听器
      await this.listenerManager.beforeTaskCreate(taskData, instance.id);

      const task = await tx.flowTask.create({ data: taskData });

      // 触发任务创建后监听器
      await this.listenerManager.afterTaskCreate(task, instance.id);

      // 写入 FlowUser 记录（用于待办人追踪）
      if (nextNode.permissionFlag) {
        const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
        
        // 触发任务分配前监听器
        await this.listenerManager.beforeTaskAssign(taskId, userIds);

        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1', // 1=待办人
              processedBy: uid.trim(),
              associated: taskId,
              createBy: starter,
            }
          });
        }

        // 触发任务分配后监听器
        await this.listenerManager.afterTaskAssign(taskId, userIds);
      }

      // 触发流程启动后监听器
      await this.listenerManager.afterFlowStart(instance);

      this.logger.log(`[WF-START] BusinessID: ${businessId} -> 节点[${nextNode.nodeName}]`);
      return instance;
    });
  }
}