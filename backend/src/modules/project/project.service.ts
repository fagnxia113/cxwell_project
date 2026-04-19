import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取项目列表 (带分页和搜索)
   */
  async getProjectList(query: {
    pageNum?: number;
    pageSize?: number;
    projectName?: string;
    status?: string;
  }, user: any) {
    const { pageNum = 1, pageSize = 10, projectName, status } = query;
    const skip = (pageNum - 1) * pageSize;

    // 1. 获取数据权限过滤条件
    const dataScopeWhere = await this.applyDataScope(user);

    const where: any = {
      ...dataScopeWhere,
    };
    if (projectName) {
      where.projectName = { contains: projectName };
    }
    if (status) {
      where.status = status;
    }

    const [total, list] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          members: {
            include: {
              employee: true
            }
          }
        },
        orderBy: { createTime: 'desc' }
      })
    ]);

    return {
      total,
      list: list.map(item => this.mapProject(item))
    };
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(id: bigint) {
    const project = await this.prisma.project.findUnique({
      where: { projectId: id },
      include: {
        customer: true,
        members: {
          include: {
            employee: true
          }
        },
        tasks: {
          orderBy: { startDate: 'asc' }
        },
        milestones: {
          orderBy: { plannedDate: 'asc' }
        }
      }
    });
    return project ? this.mapProject(project) : null;
  }

  /**
   * 获取项目结构 (WBS)
   */
  async getProjectStructure(id: bigint) {
    const tasks = await this.prisma.bizTask.findMany({
      where: { projectId: id },
      orderBy: { startDate: 'asc' }
    });
    return tasks.map(t => ({
      ...t,
      taskId: t.taskId.toString(),
      projectId: t.projectId.toString(),
      assigneeId: t.assigneeId?.toString()
    }));
  }

  /**
   * 数据权限过滤
   * 1-全部数据 2-本部门数据 3-仅本人数据
   */
  private async applyDataScope(user: any): Promise<any> {
    if (!user || !user.sub) return { createBy: 'none' }; // 未登录拒绝访问
    if (user.sub === '1') return {}; // 如果是 1 (超级管理员)，拥有全部权限

    // 获取用户最大的数据权限级别 (1 最小，3 最大? 不，根据业务通常 1是全量，2是部门，3是个人)
    const userWithRoles = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(user.sub) },
    });

    if (userWithRoles.length === 0) return { createBy: user.loginName }; // 默认仅个人

    const roleIds = userWithRoles.map(r => r.roleId);
    const roles = await this.prisma.sysRole.findMany({
      where: { roleId: { in: roleIds } },
    });

    // 确定最高权限 (值越小权限越大: 1 < 2 < 3)
    const scopes = roles.map(r => Number(r.dataScope));
    const maxScope = Math.min(...scopes);

    if (maxScope === 1) return {}; // 全部
    
    if (maxScope === 2) {
      // 获取用户部门
      const sysUser = await this.prisma.sysUser.findUnique({
        where: { userId: BigInt(user.sub) },
        select: { deptId: true }
      });
      return {
        OR: [
          { createBy: user.loginName }, // 自己创建的
          { managerId: BigInt(user.sub) }, // 自己管理的
          // 这里假设项目也有 deptId 关联，或者通过成员关联
          { members: { some: { employee: { deptId: sysUser?.deptId } } } }
        ]
      };
    }

    if (maxScope === 3) {
      return {
        OR: [
          { createBy: user.loginName },
          { managerId: BigInt(user.sub) },
          { members: { some: { employee: { userId: BigInt(user.sub) } } } }
        ]
      };
    }

    return { createBy: user.loginName };
  }

  /**
   * 数据模型映射 (处理 BigInt 序列化问题)
   */
  private mapProject(project: any) {
    return {
      ...project,
      id: project.projectId.toString(),
      name: project.projectName || '未命名项目',
      projectId: project.projectId.toString(),
      customerId: project.customerId?.toString(),
      managerId: project.managerId?.toString(),
      budget: project.budget.toString(),
      members: project.members?.map((m: any) => ({
        ...m,
        id: m.id.toString(),
        projectId: m.projectId.toString(),
        employeeId: m.employeeId.toString(),
        employee: m.employee ? {
          ...m.employee,
          employeeId: m.employee.employeeId.toString(),
          deptId: m.employee.deptId?.toString(),
          userId: m.employee.userId?.toString()
        } : null
      })),
      tasks: project.tasks?.map((t: any) => ({
        ...t,
        taskId: t.taskId.toString(),
        projectId: t.projectId.toString(),
        assigneeId: t.assigneeId?.toString()
      })),
      milestones: project.milestones?.map((m: any) => ({
        ...m,
        id: m.id.toString(),
        projectId: m.projectId.toString()
      }))
    };
  }
}
