import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 流程图表服务
 */
@Injectable()
export class ChartService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取流程实例统计数据
   */
  async getInstanceStatistics(): Promise<{
    total: number;
    running: number;
    completed: number;
    cancelled: number;
  }> {
    const total = await this.prisma.flowInstance.count();
    const running = await this.prisma.flowInstance.count({ where: { flowStatus: 'running' } });
    const completed = await this.prisma.flowInstance.count({ where: { flowStatus: 'completed' } });
    const cancelled = await this.prisma.flowInstance.count({ where: { flowStatus: 'cancelled' } });

    return {
      total,
      running,
      completed,
      cancelled,
    };
  }

  /**
   * 获取流程定义统计数据
   */
  async getDefinitionStatistics(): Promise<{
    total: number;
    published: number;
    unpublished: number;
  }> {
    const total = await this.prisma.flowDefinition.count();
    const published = await this.prisma.flowDefinition.count({ where: { isPublish: 1 } });
    const unpublished = await this.prisma.flowDefinition.count({ where: { isPublish: 0 } });

    return {
      total,
      published,
      unpublished,
    };
  }

  /**
   * 获取任务统计数据
   */
  async getTaskStatistics(): Promise<{
    total: number;
    todo: number;
    completed: number;
    rejected: number;
  }> {
    const total = await this.prisma.flowTask.count();
    const todo = await this.prisma.flowTask.count({ where: { flowStatus: 'todo' } });
    const completed = await this.prisma.flowTask.count({ where: { flowStatus: 'completed' } });
    const rejected = await this.prisma.flowTask.count({ where: { flowStatus: 'rejected' } });

    return {
      total,
      todo,
      completed,
      rejected,
    };
  }

  /**
   * 获取用户任务统计数据
   */
  async getUserTaskStatistics(userId: string): Promise<{
    total: number;
    todo: number;
    completed: number;
  }> {
    // 先获取用户相关的任务ID
    const userTasks = await this.prisma.flowUser.findMany({
      where: { processedBy: userId, type: '1' },
      select: { associated: true },
    });

    const taskIds = userTasks.map(ut => ut.associated);

    if (taskIds.length === 0) {
      return { total: 0, todo: 0, completed: 0 };
    }

    const total = await this.prisma.flowTask.count({ where: { id: { in: taskIds } } });
    const todo = await this.prisma.flowTask.count({ where: { id: { in: taskIds }, flowStatus: 'todo' } });
    const completed = await this.prisma.flowTask.count({ where: { id: { in: taskIds }, flowStatus: 'completed' } });

    return {
      total,
      todo,
      completed,
    };
  }

  /**
   * 获取流程趋势数据
   */
  async getFlowTrend(days: number = 30): Promise<Array<{
    date: string;
    count: number;
  }>> {
    // 这里是一个简单实现，实际项目中可能需要更复杂的日期处理
    const result: Array<{
      date: string;
      count: number;
    }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = await this.prisma.flowInstance.count({
        where: {
          createTime: {
            gte: new Date(dateStr),
            lt: new Date(dateStr + 'T23:59:59.999Z'),
          },
        },
      });

      result.push({ date: dateStr, count });
    }

    return result;
  }
}