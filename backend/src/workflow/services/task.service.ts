import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListenerManager } from '../listeners/listener-manager';

/**
 * 任务服务
 */
@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private prisma: PrismaService,
    private listenerManager: ListenerManager
  ) {}

  /**
   * 完成任务
   */
  async completeTask(taskId: bigint, approver: string, variables: any = {}, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('待办任务不存在或已被处理');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });
    const skips = await this.prisma.flowSkip.findMany({
      where: { definitionId: task.definitionId, nowNodeCode: task.nodeCode }
    });

    // 条件路由判定：如果多条出路，按 skipCondition 匹配
    let nextSkip = skips[0];
    if (skips.length > 1 && variables) {
      const matched = skips.find(s => this.evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
    }
    if (!nextSkip) throw new BadRequestException('无后续流转节点');

    const nextNode = nodes.find(n => n.nodeCode === nextSkip.nextNodeCode);
    
    return this.prisma.$transaction(async (tx) => {
      // 触发任务完成前监听器
      await this.listenerManager.beforeTaskComplete(taskId, task.instanceId);

      // 1. 归档当前 Task -> HisTask
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, nextNode, approver, 'pass', comment, variables);

      // 2. 清除当前任务的 FlowUser 记录
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      // 3. 判定是否为结束节点 (nodeType = 2)
      if (nextNode?.nodeType === 2) {
        const instance = await tx.flowInstance.update({
          where: { id: task.instanceId },
          data: {
            flowStatus: 'finished',
            nodeType: 2,
            nodeCode: nextNode.nodeCode,
            nodeName: nextNode.nodeName,
            updateTime: new Date(),
          }
        });

        // 触发流程结束前监听器
        await this.listenerManager.beforeFlowEnd(instance);

        this.logger.log(`[WF-END] InstanceID: ${task.instanceId}`);

        // 触发流程结束后监听器
        await this.listenerManager.afterFlowEnd(instance);

        // 触发任务完成后监听器
        await this.listenerManager.afterTaskComplete(taskId, task.instanceId, { finished: true });

        return { finished: true };
      } else {
        // 创建下一步 Task
        const newTaskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
        const taskData = {
          id: newTaskId,
          definitionId: task.definitionId,
          instanceId: task.instanceId,
          nodeCode: nextNode!.nodeCode,
          nodeName: nextNode!.nodeName,
          nodeType: nextNode!.nodeType,
          flowStatus: 'todo',
        };

        // 触发任务创建前监听器
        await this.listenerManager.beforeTaskCreate(taskData, task.instanceId);

        const newTask = await tx.flowTask.create({ data: taskData });

        // 触发任务创建后监听器
        await this.listenerManager.afterTaskCreate(newTask, task.instanceId);

        // 绑定新的待办人
        if (nextNode?.permissionFlag) {
          const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
          
          // 触发任务分配前监听器
          await this.listenerManager.beforeTaskAssign(newTaskId, userIds);

          for (const uid of userIds) {
            await tx.flowUser.create({
              data: {
                id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
                type: '1',
                processedBy: uid.trim(),
                associated: newTaskId,
              }
            });
          }

          // 触发任务分配后监听器
          await this.listenerManager.afterTaskAssign(newTaskId, userIds);
        }

        await tx.flowInstance.update({
          where: { id: task.instanceId },
          data: {
            nodeType: nextNode!.nodeType,
            nodeCode: nextNode!.nodeCode,
            nodeName: nextNode!.nodeName,
            updateTime: new Date(),
          }
        });

        // 触发任务完成后监听器
        await this.listenerManager.afterTaskComplete(taskId, task.instanceId, { finished: false, nextNode: nextNode?.nodeName });

        return { finished: false, nextNode: nextNode?.nodeName };
      }
    });
  }

  /**
   * 驳回任务
   */
  async rejectTask(taskId: bigint, approver: string, comment: string = '', targetNodeCode?: string) {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('待办任务不存在或已被处理');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });

    // 确定驳回目标节点：
    // 1. 如果指定了 targetNodeCode，则驳回到指定节点
    // 2. 否则查找上一步（从 history 里找）
    // 3. 如果都没有，驳回到开始节点的下一个节点
    let rollbackNode: any;
    if (targetNodeCode) {
      rollbackNode = nodes.find(n => n.nodeCode === targetNodeCode);
    } else {
      // 从历史中找到上一步
      const lastHis = await this.prisma.flowHisTask.findFirst({
        where: { instanceId: task.instanceId },
        orderBy: { createTime: 'desc' },
      });
      if (lastHis?.nodeCode) {
        rollbackNode = nodes.find(n => n.nodeCode === lastHis.nodeCode);
      }
    }

    if (!rollbackNode) {
      // 兜底：退回到开始节点之后的第一个节点
      const startNode = nodes.find(n => n.nodeType === 0);
      const skip = await this.prisma.flowSkip.findFirst({
        where: { definitionId: task.definitionId, nowNodeCode: startNode?.nodeCode ?? '' }
      });
      rollbackNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);
    }

    if (!rollbackNode) throw new BadRequestException('无法确定驳回目标节点');

    return this.prisma.$transaction(async (tx) => {
      // 触发任务驳回前监听器
      await this.listenerManager.beforeTaskReject(taskId, task.instanceId, targetNodeCode);

      // 归档当前任务
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, rollbackNode, approver, 'reject', comment);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      // 创建驳回后的新任务
      const newTaskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      const taskData = {
        id: newTaskId,
        definitionId: task.definitionId,
        instanceId: task.instanceId,
        nodeCode: rollbackNode.nodeCode,
        nodeName: rollbackNode.nodeName,
        nodeType: rollbackNode.nodeType,
        flowStatus: 'todo',
      };

      // 触发任务创建前监听器
      await this.listenerManager.beforeTaskCreate(taskData, task.instanceId);

      const newTask = await tx.flowTask.create({ data: taskData });

      // 触发任务创建后监听器
      await this.listenerManager.afterTaskCreate(newTask, task.instanceId);

      // 绑定重置后的待办人（按原节点配置）
      if (rollbackNode.permissionFlag) {
        const userIds = rollbackNode.permissionFlag.split(',').filter(Boolean);
        
        // 触发任务分配前监听器
        await this.listenerManager.beforeTaskAssign(newTaskId, userIds);

        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1',
              processedBy: uid.trim(),
              associated: newTaskId,
            }
          });
        }

        // 触发任务分配后监听器
        await this.listenerManager.afterTaskAssign(newTaskId, userIds);
      }

      await tx.flowInstance.update({
        where: { id: task.instanceId },
        data: {
          flowStatus: 'running',
          nodeType: rollbackNode.nodeType,
          nodeCode: rollbackNode.nodeCode,
          nodeName: rollbackNode.nodeName,
          updateTime: new Date(),
        }
      });

      // 触发任务驳回后监听器
      await this.listenerManager.afterTaskReject(taskId, task.instanceId, { rolledBack: true, targetNode: rollbackNode.nodeName });

      this.logger.log(`[WF-REJECT] InstanceID: ${task.instanceId} -> 退回至[${rollbackNode.nodeName}]`);
      return { rolledBack: true, targetNode: rollbackNode.nodeName };
    });
  }

  /**
   * 获取可驳回的历史节点
   */
  async getApprovableHistory(instanceId: bigint) {
    const history = await this.prisma.flowHisTask.findMany({
      where: { instanceId, skipType: 'pass' },
      orderBy: { createTime: 'asc' },
    });

    const result: any[] = [];
    const codes = new Set<string>();
    
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (h.nodeCode && !codes.has(h.nodeCode)) {
        result.push({
          nodeCode: h.nodeCode,
          nodeName: h.nodeName,
          approver: h.approver,
          time: h.createTime,
        });
        codes.add(h.nodeCode);
      }
    }

    return result.reverse();
  }

  /**
   * 归档任务到 flow_his_task
   */
  private async archiveTask(tx: any, task: any, targetNode: any, approver: string, skipType: string, comment: string, variables?: any) {
    const hisId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    await tx.flowHisTask.create({
      data: {
        id: hisId,
        definitionId: task.definitionId,
        instanceId: task.instanceId,
        taskId: task.id,
        nodeCode: task.nodeCode,
        nodeName: task.nodeName,
        nodeType: task.nodeType,
        targetNodeCode: targetNode?.nodeCode ?? null,
        targetNodeName: targetNode?.nodeName ?? null,
        approver,
        skipType,
        flowStatus: skipType === 'pass' ? 'finished' : 'rejected',
        message: comment,
        variable: variables ? JSON.stringify(variables) : null,
        createTime: new Date(),
      }
    });
  }

  /**
   * 简易条件表达式求值器
   */
  private evaluateCondition(condition: string | null, variables: Record<string, any>): boolean {
    if (!condition) return false;
    try {
      // 安全沙箱执行简单表达式
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      const fn = new Function(...keys, `return ${condition};`);
      return !!fn(...values);
    } catch (e) {
      this.logger.warn(`条件表达式求值失败: ${condition}`, e);
      return false;
    }
  }
}