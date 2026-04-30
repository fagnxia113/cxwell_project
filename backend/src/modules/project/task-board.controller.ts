import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectService } from './project.service';

@Controller('project')
export class TaskBoardController {
  constructor(
    private prisma: PrismaService,
    private projectService: ProjectService
  ) {}

  /**
   * 看板聚合接口
   * 返回当前用户有权限的所有项目及其里程碑、风险、报告、标签、费用汇总
   */
  @Get('task-board')
  async getTaskBoard(@Req() req: any) {
    const user = req.user;
    const userId = user?.sub || user?.userId;
    const loginName = user?.loginName;

    // --- 1. 构建权限过滤条件 ---
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      console.log('[TaskBoard] req.user:', JSON.stringify(user));
      const projectScope = await this.projectService.applyDataScope(user);
      console.log('[TaskBoard] projectScope:', JSON.stringify(projectScope, (k, v) => typeof v === 'bigint' ? v.toString() : v));
      const where: any = { delFlag: { not: '2' }, ...projectScope };
      console.log('[TaskBoard] final where:', JSON.stringify(where, (k, v) => typeof v === 'bigint' ? v.toString() : v));

      // --- 2. 获取用户 employeeId (用于后续匹配) ---
      const userIdStr = userId.toString();
      let employeeIdStr: string | null = null;
      if (userIdStr !== '1') {
        try {
          const sysEmployee = await this.prisma.sysEmployee.findFirst({
            where: { userId: BigInt(userIdStr) },
            select: { employeeId: true }
          });
          if (sysEmployee?.employeeId) {
            employeeIdStr = sysEmployee.employeeId.toString();
          }
        } catch (e) {}
      }

      // --- 3. 查询项目及关联数据 ---
      const projects = await this.prisma.project.findMany({
        where,
        include: {
          members: {
            include: { employee: { select: { employeeId: true, name: true, userId: true } } }
          },
          milestones: {
            where: { parentId: null },
            orderBy: { plannedDate: 'asc' },
            include: { children: { orderBy: { plannedDate: 'asc' } } }
          },
          risks: { orderBy: { createTime: 'desc' } },
          reports: { orderBy: { createTime: 'desc' } },
          tags: { orderBy: { createTime: 'desc' } },
          expenses: { orderBy: { date: 'desc' } }
        },
        orderBy: { createTime: 'desc' }
      });

      // --- 4. 处理数据并转换 BigInt ---
      const result = projects.map(p => {
        try {
          let userRole: 'manager' | 'member' | 'viewer' = 'viewer';
          let canEdit = false;

          if (userIdStr === '1') {
            userRole = 'manager';
            canEdit = true;
          } else if (p.managerId && employeeIdStr && p.managerId.toString() === employeeIdStr) {
            userRole = 'manager';
            canEdit = true;
          } else {
            const membership = p.members.find(m =>
              m.employee?.userId?.toString() === userIdStr
            );
            if (membership) {
              userRole = 'member';
              canEdit = true;
            }
          }

          const expenseTotal = p.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

          return {
            id: p.projectId.toString(),
            projectName: p.projectName,
            projectCode: p.projectCode,
            country: p.country,
            status: p.status,
            progress: p.progress,
            budget: Number(p.budget),
            userRole,
            canEdit,
            milestones: p.milestones.map(m => ({
              id: m.id.toString(),
              name: m.name,
              status: m.status,
              progress: m.progress,
              plannedDate: m.plannedDate,
              children: m.children?.map(c => ({
                id: c.id.toString(),
                name: c.name,
                status: c.status,
                progress: c.progress,
                plannedDate: c.plannedDate,
              }))
            })),
            risks: p.risks.map(r => ({
              id: r.id.toString(),
              title: r.title,
              level: r.level,
              status: r.status,
              ownerName: r.ownerName,
              deadline: r.deadline
            })),
            reports: p.reports.map(r => ({
              id: r.id.toString(),
              name: r.name,
              status: r.status,
              copies: r.copies,
              submittedCount: r.submittedCount,
              verifiedCount: r.verifiedCount
            })),
            tags: p.tags.map(t => ({
              id: t.id.toString(),
              tagType: t.tagType,
              systemType: t.systemType,
              requiredCount: t.requiredCount,
              taggedCount: t.taggedCount,
              status: t.status
            })),
            expenses: {
              total: expenseTotal,
              items: p.expenses.slice(0, 10).map(e => ({
                id: e.id.toString(),
                category: e.category,
                amount: Number(e.amount),
                date: e.date
              }))
            }
          };
        } catch (itemErr) {
          return null;
        }
      }).filter(Boolean);

      // --- 4. 计算全局统计数据 ---
      let pendingCount = 0;
      
      try {
        pendingCount = await this.prisma.flowTask.count({ where: { flowStatus: 'todo', delFlag: '0' } });
      } catch (flowErr) {
        // 统计失败
      }

      const activeStatuses = ['2', '3'];
      const completedStatuses = ['4', '5'];

      const stats = {
        projects: {
          total: projects.length,
          inProgress: projects.filter(p => activeStatuses.includes(p.status)).length,
          completed: projects.filter(p => completedStatuses.includes(p.status)).length
        },
        approvals: {
          pending: pendingCount,
        },
        milestoneCompletion: (() => {
          const allRootMilestones = projects.flatMap(p => p.milestones || []);
          if (allRootMilestones.length === 0) return 0;
          const totalProgress = allRootMilestones.reduce((sum, m) => sum + (Number(m.progress) || 0), 0);
          return Math.round(totalProgress / allRootMilestones.length);
        })(),
        riskAlert: projects.reduce((sum, p) => sum + (p.risks || []).filter((r: any) => r.status !== 'resolved' && r.status !== 'closed').length, 0)
      };

      return { success: true, data: { stats, projects: result } };
    } catch (err) {
      console.error('[TaskBoard] Error:', err);
      return { success: false, message: 'Aggregation failed' };
    }
  }
}
