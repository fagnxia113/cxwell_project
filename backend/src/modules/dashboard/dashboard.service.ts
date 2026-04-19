import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取全局汇总数据
   */
  async getOverviewStats() {
    const [
      projectCount,
      activeProjects,
      pendingTasks,
      employeeCount
    ] = await Promise.all([
      this.prisma.project.count({ where: { delFlag: { not: '2' } } }),
      this.prisma.project.count({ where: { status: { in: ['2', '3'] }, delFlag: { not: '2' } } }),
      this.prisma.flowTask.count({ where: { flowStatus: 'todo' } }),
      this.prisma.sysEmployee.count({ where: { status: '0' } }),
    ]);

    return {
      projects: {
        total: projectCount,
        inProgress: activeProjects,
        completed: projectCount - activeProjects, // 简化计算
      },
      approvals: {
        pending: pendingTasks,
        todayApproved: 5, // Mock数据
      },
      dailyReports: {
        submissionRate: 94,
        unsubmitted: 3
      }
    };
  }

  /**
   * 获取项目状态分布 (图表用)
   */
  async getProjectDistribution() {
    const stats = await this.prisma.project.groupBy({
      by: ['status'],
      _count: { projectId: true },
      where: { delFlag: { not: '2' } }
    });

    const statusMap: Record<string, string> = {
      '1': '预研',
      '2': '立项',
      '3': '进行中',
      '4': '已完成',
      '5': '已归档'
    };

    return stats.map((s: any) => ({
      name: statusMap[s.status] || '其他',
      value: s._count.projectId
    }));
  }

  /**
   * 获取最近 7 天的趋势数据 (Mock)
   */
  async getTrendData() {
    return [
      { name: 'Mon', value: 40 },
      { name: 'Tue', value: 35 },
      { name: 'Wed', value: 55 },
      { name: 'Thu', value: 45 },
      { name: 'Fri', value: 60 },
      { name: 'Sat', value: 80 },
      { name: 'Sun', value: 75 },
    ];
  }
}
