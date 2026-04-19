import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MonitorService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取全局统计 KPI
   */
  async getStatistics() {
    const [total, running, finished] = await Promise.all([
      this.prisma.flowInstance.count(),
      this.prisma.flowInstance.count({ where: { flowStatus: 'running' } }),
      this.prisma.flowInstance.count({ where: { flowStatus: 'finished' } }),
    ]);

    // 计算审批通过率 (假设 finished 即为通过)
    const approvalRate = total > 0 ? (finished / total) * 100 : 100;

    return {
      totalInstances: total,
      runningInstances: running,
      completedInstances: finished,
      terminatedInstances: total - running - finished,
      avgDuration: 4.2, // TODO: 实现平均耗时计算逻辑
      approvalRate: Math.round(approvalRate),
      rejectionRate: 0,
      byProcessKey: {}
    };
  }

  /**
   * 获取实时监控快照
   */
  async getRealtimeMonitoring() {
    const [activeInstances, pendingTasks] = await Promise.all([
      this.prisma.flowInstance.count({ where: { flowStatus: 'running' } }),
      this.prisma.flowTask.count({ where: { flowStatus: 'todo' } }),
    ]);

    // 获取今日启动和完成数
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStarted, todayCompleted] = await Promise.all([
      this.prisma.flowInstance.count({ where: { createTime: { gte: today } } }),
      this.prisma.flowInstance.count({ where: { flowStatus: 'finished', updateTime: { gte: today } } }),
    ]);

    return {
      activeInstances,
      pendingTasks,
      overdueTasks: 0,
      todayCompleted,
      todayStarted,
      avgProcessingTime: 1.5,
      topSlowProcesses: []
    };
  }

  /**
   * 获取所有流程实例列表 (带分页)
   */
  async getInstances(page: number = 1, pageSize: number = 10, status?: string) {
    const where: any = {};
    if (status && status !== 'all') {
      where.flowStatus = status;
    }

    const [total, list] = await Promise.all([
      this.prisma.flowInstance.count({ where }),
      this.prisma.flowInstance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
      }),
    ]);

    // 转换为前端需要的 ProcessInstance 格式
    const instances = list.map(item => ({
      id: item.id.toString(),
      title: item.nodeName || '未命名实例',
      definition_key: item.definitionId.toString(),
      category: 'general',
      status: item.flowStatus,
      initiator_name: item.createBy || '未知',
      start_time: item.createTime,
    }));

    return {
      total,
      instances
    };
  }

  /**
   * 获取单个实例详情
   */
  async getInstanceDetail(instanceId: bigint) {
    const item = await this.prisma.flowInstance.findUnique({
      where: { id: instanceId }
    });
    if (!item) return null;

    return {
      id: item.id.toString(),
      title: item.nodeName || '未命名实例',
      definition_key: item.definitionId.toString(),
      status: item.flowStatus,
      initiator_name: item.createBy || '未知',
      start_time: item.createTime,
    };
  }

  /**
   * 获取实例相关的任务列表
   */
  async getInstanceTasks(instanceId: bigint) {
    const list = await this.prisma.flowTask.findMany({
      where: { instanceId },
      orderBy: { createTime: 'desc' }
    });

    return list.map(task => ({
      id: task.id.toString(),
      name: task.nodeName,
      assignee_name: task.createBy || '系统',
      status: task.flowStatus,
      created_at: task.createTime
    }));
  }

  /**
   * 终止流程实例
   */
  async terminateInstance(instanceId: bigint, reason: string) {
    return this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        flowStatus: 'terminated',
        updateTime: new Date(),
        ext: reason
      }
    });
  }

  /**
   * 任务重分配 (改派)
   */
  async reassignTask(taskId: bigint, newAssignee: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 删除原有的候选人记录
      await tx.flowUser.deleteMany({
        where: { associated: taskId, type: '1' }
      });

      // 2. 写入新的候选人记录
      await tx.flowUser.create({
        data: {
          id: BigInt(Date.now()),
          type: '1',
          processedBy: newAssignee,
          associated: taskId,
          createTime: new Date()
        }
      });

      return { success: true };
    });
  }
}
