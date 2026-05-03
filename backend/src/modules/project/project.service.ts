import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户在项目中的角色
   * 返回: 'manager' | 'member' | null (null表示不是项目成员)
   */
  async getUserProjectRole(projectId: string, user: any): Promise<'manager' | 'member' | null> {
    const userId = user?.sub || user?.userId;
    if (!userId) return null;

    // 超级管理员
    if (userId === '1' || userId === 1 || user?.role === 'admin' || user?.role === 'general_manager') return 'manager';

    // 获取用户的员工记录
    const employee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(userId) },
      select: { employeeId: true }
    });

    // 检查是否是项目经理
    const project = await this.prisma.project.findUnique({
      where: { projectId: BigInt(projectId) },
      select: { managerId: true }
    });

    if (employee && project?.managerId && project.managerId.toString() === employee.employeeId.toString()) {
      return 'manager';
    }

    // 检查是否是项目成员
    if (employee) {
      const membership = await this.prisma.projectMember.findFirst({
        where: {
          projectId: BigInt(projectId),
          employeeId: employee.employeeId
        }
      });

      if (membership) return 'member';
    }

    return null;
  }

  /**
   * 获取项目列表 (带分页和搜索)
   * 逻辑：
   * 1. 超级管理员可见所有项目
   * 2. 其他用户可见：
   *    - 自己创建的项目
   *    - 自己担任项目经理的项目
   *    - 自己作为项目成员的项目
   */
  async getProjectList(query: {
    pageNum?: number;
    pageSize?: number;
    projectName?: string;
    status?: string;
  }, user: any) {
    const { pageNum = 1, pageSize = 10, projectName, status } = query;
    const skip = (pageNum - 1) * pageSize;


    const userId = user?.sub || user?.userId;
    const loginName = user?.loginName;

    let where: any = await this.applyDataScope(user);

    where.delFlag = '0';

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

    // Fetch manager names
    const managerIds = list.map(p => p.managerId).filter(id => id != null) as bigint[];
    let managerMap = new Map<string, string>();
    if (managerIds.length > 0) {
      const managers = await this.prisma.sysEmployee.findMany({
        where: { employeeId: { in: managerIds } },
        select: { employeeId: true, name: true }
      });
      managers.forEach(m => managerMap.set(m.employeeId.toString(), m.name));
    }

    return {
      total,
      list: list.map(item => this.mapProject({
        ...item,
        _managerName: item.managerId ? managerMap.get(item.managerId.toString()) : null
      }))
    };
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(id: bigint, user?: any) {
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
          where: { parentId: null },
          orderBy: { plannedDate: 'asc' },
          include: {
            children: {
              orderBy: { plannedDate: 'asc' },
              include: {
                children: {
                  orderBy: { plannedDate: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!project) return null;

    // 获取实际支出汇总
    const expenses = await this.prisma.projectExpense.aggregate({
      where: { projectId: id },
      _sum: { amount: true }
    });
    const actualExpense = Number(expenses._sum.amount || 0) / 10000;

    // 获取项目经理信息
    let managerName: string | null = null;
    if (project.managerId) {
      const manager = await this.prisma.sysEmployee.findUnique({
        where: { employeeId: project.managerId }
      });
      managerName = manager?.name ?? null;
    }

    // 计算当前用户的项目角色
    let isProjectManager = false;
    let isProjectMember = false;
    let currentUserEmployeeId: string | null = null;

    if (user) {
      const userId = user?.sub || user?.userId;
      if (userId) {
        // 获取当前用户的员工记录
        const employee = await this.prisma.sysEmployee.findFirst({
          where: { userId: BigInt(userId) }
        });
        if (employee) {
          currentUserEmployeeId = employee.employeeId.toString();
          // 检查是否是项目经理
          if (project.managerId && project.managerId.toString() === employee.employeeId.toString()) {
            isProjectManager = true;
          }
          // 检查是否是项目成员
          const membership = project.members.find(m => m.employeeId.toString() === employee.employeeId.toString());
          if (membership) {
            isProjectMember = true;
          }
        }
      }
    }

    return this.mapProject({
      ...project,
      _managerName: managerName,
      _actualExpense: actualExpense,
      _isProjectManager: isProjectManager,
      _isProjectMember: isProjectMember,
      _currentUserEmployeeId: currentUserEmployeeId
    });
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
  async applyDataScope(user: any): Promise<any> {
    const userId = user?.sub || user?.userId;
    const loginName = user?.loginName;
    const userRole = user?.role || user?.roleKey;
    console.log('[applyDataScope] user:', JSON.stringify({ userId, loginName, role: userRole }));
    if (!userId) return { createBy: 'none' };
    if (userId === '1' || userId === 1 || userRole === 'admin' || userRole === 'general_manager') {
      console.log('[applyDataScope] => admin/general_manager, returning all');
      return {};
    }

    // 获取员工ID用于权限过滤
    let employeeId: bigint | null = null;
    const sysEmployee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(userId) },
      select: { employeeId: true }
    });
    if (sysEmployee?.employeeId) {
      employeeId = sysEmployee.employeeId;
    }
    console.log('[applyDataScope] employeeId:', employeeId?.toString());

    // 获取用户最大的数据权限级别 (1 最小，3 最大? 不，根据业务通常 1是全量，2是部门，3是个人)
    const userWithRoles = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId) },
    });
    console.log('[applyDataScope] userWithRoles:', userWithRoles.length);

    const personalScope = {
      OR: [
        { createBy: loginName },
        ...(employeeId ? [
          { managerId: employeeId },
          { members: { some: { employeeId: employeeId } } }
        ] : [])
      ]
    };

    if (userWithRoles.length === 0) {
      console.log('[applyDataScope] => no roles, returning personalScope');
      return personalScope; // 默认仅个人
    }

    const roleIds = userWithRoles.map(r => r.roleId);
    const roles = await this.prisma.sysRole.findMany({
      where: { roleId: { in: roleIds } },
    });

    // 确定最高权限 (值越小权限越大: 1 < 2 < 3)
    const scopes = roles.map(r => Number(r.dataScope));
    const maxScope = Math.min(...scopes);
    console.log('[applyDataScope] scopes:', scopes, 'maxScope:', maxScope);

    if (maxScope === 1) {
      console.log('[applyDataScope] => scope 1, returning all');
      return {}; // 全部
    }

    if (maxScope === 2) {
      // 获取用户部门
      const sysUser = await this.prisma.sysUser.findUnique({
        where: { userId: BigInt(userId) },
        select: { deptId: true }
      });
      console.log('[applyDataScope] => scope 2 (dept), deptId:', sysUser?.deptId?.toString());
      return {
        OR: [
          { createBy: loginName }, // 自己创建的
          ...(employeeId ? [
            { managerId: employeeId }, // 自己管理的
            { members: { some: { employeeId: employeeId } } } // 自己参与的
          ] : []),
          ...(sysUser?.deptId ? [
            // 部门成员参与的
            { members: { some: { employee: { deptId: sysUser.deptId } } } }
          ] : [])
        ]
      };
    }

    console.log('[applyDataScope] => scope 3 (personal)');
    return personalScope;
  }

  /**
   * 添加项目成员
   */
  async addMember(projectId: bigint, data: any, user: any) {
    const role = await this.getUserProjectRole(projectId.toString(), user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以添加项目成员');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        employeeId: BigInt(data.employeeId),
        roleName: data.roleInProject || 'Member',
        joinDate: data.transferInDate ? new Date(data.transferInDate) : new Date(),
        canEdit: false
      }
    });
  }

  /**
   * 移除项目成员
   */
  async removeMember(projectId: bigint, employeeId: bigint, user: any) {
    const role = await this.getUserProjectRole(projectId.toString(), user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以移除项目成员');
    }

    return this.prisma.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId
        }
      }
    });
  }

  /**
   * 转移项目成员
   */
  async transferMember(projectId: bigint, data: any, user: any) {
    const role = await this.getUserProjectRole(projectId.toString(), user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以转移项目成员');
    }

    const employeeId = BigInt(data.employeeId);
    const targetProjectId = BigInt(data.targetProjectId);
    const transferDate = new Date(data.transferDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. 从原项目移除
      await tx.projectMember.delete({
        where: {
          projectId_employeeId: {
            projectId,
            employeeId
          }
        }
      });

      // 2. 添加到新项目
      return tx.projectMember.create({
        data: {
          projectId: targetProjectId,
          employeeId,
          roleName: 'Member',
          joinDate: transferDate,
          canEdit: false
        }
      });
    });
  }
  /**
   * 更新项目
   */
  async updateProject(id: bigint, data: any) {
    const updateData: any = {
        projectName: data.name,
        status: data.status,
        progress: data.progress,
        buildingArea: data.building_area,
        itCapacity: data.it_capacity,
        cabinetCount: data.cabinet_count,
        cabinetPower: data.cabinet_power,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        description: data.description,
        powerArchitecture: data.power_architecture,
        hvacArchitecture: data.hvac_architecture,
        fireArchitecture: data.fire_architecture,
        weakElectricArchitecture: data.weak_electric_architecture,
      };
    if (data.managerId !== undefined || data.manager_id !== undefined) {
      const mid = data.managerId || data.manager_id;
      updateData.managerId = mid ? BigInt(mid) : null;
    }
    if (data.customerId !== undefined || data.customer_id !== undefined) {
      const cid = data.customerId || data.customer_id;
      updateData.customerId = cid ? BigInt(cid) : null;
    }
    if (data.budget !== undefined) {
      updateData.budget = data.budget;
    }
    if (data.country !== undefined) {
      updateData.country = data.country;
    }
    if (data.address !== undefined) {
      updateData.address = data.address;
    }
    await this.prisma.project.update({
      where: { projectId: id },
      data: updateData
    });
    return this.getProjectDetail(id);
  }

  /**
   * 删除项目
   */
  async deleteProject(id: bigint) {
    return this.prisma.project.update({
      where: { projectId: id },
      data: { delFlag: '1' }
    });
  }

  /**
   * 数据模型映射 (处理 BigInt 序列化问题)
   */
  private mapProject(project: any) {
    return {
      ...project,
      id: project.projectId.toString(),
      code: project.projectCode,
      name: project.projectName || '未命名项目',
      projectId: project.projectId.toString(),
      customerId: project.customerId?.toString(),
      customer_name: project.customer?.name || null,
      managerId: project.managerId?.toString(),
      manager_id: project.managerId?.toString(),
      budget: project.budget.toString(),
      // 前端需要的下划线格式字段
      building_area: project.buildingArea,
      it_capacity: project.itCapacity,
      cabinet_count: project.cabinetCount,
      cabinet_power: project.cabinetPower,
      start_date: project.startDate,
      end_date: project.endDate,
      power_architecture: project.powerArchitecture,
      hvac_architecture: project.hvacArchitecture,
      fire_architecture: project.fireArchitecture,
      weak_electric_architecture: project.weakElectricArchitecture,
      actual_expense: project._actualExpense ?? 0,
      // 前端需要的 manager 和 tech_manager
      manager: project._managerName || null,
      tech_manager: project._managerName || null,
      // 用户角色信息
      isProjectManager: project._isProjectManager || false,
      isProjectMember: project._isProjectMember || false,
      currentUserEmployeeId: project._currentUserEmployeeId || null,
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
        projectId: m.projectId.toString(),
        parentId: m.parentId?.toString(),
        children: m.children?.map((child: any) => ({
          ...child,
          id: child.id.toString(),
          projectId: child.projectId.toString(),
          parentId: child.parentId?.toString()
        }))
      }))
    };
  }
}
