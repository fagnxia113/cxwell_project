import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkService } from '../dingtalk/dingtalk.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private dingtalkService: DingtalkService,
  ) {}

  /**
   * 获取部门树
   */
  async getDeptTree() {
    const list = await this.prisma.sysDept.findMany({
      where: { delFlag: '0' },
      orderBy: { orderNum: 'asc' }
    });

    const mapped = list.map(d => ({
      ...d,
      id: d.deptId.toString(),
      name: d.deptName,
      parentId: d.parentId.toString(),
      deptId: d.deptId.toString(),
    }));

    return this.buildTree(mapped, '0');
  }

  /**
   * 获取职员列表
   */
  async getEmployeeList(query: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    deptId?: string;
    projectId?: string;
  }, user?: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, deptId, projectId } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    const userId = user?.sub || user?.userId;

    // 管理员可见所有员工（userId=1 是超级管理员）
    if (userId && userId !== '1' && userId !== 1) {
      // 获取当前用户的员工记录
      let currentEmployeeId: BigInt | null = null;
      const currentEmployee = await this.prisma.sysEmployee.findFirst({
        where: { userId: BigInt(userId) },
        select: { employeeId: true }
      });
      if (currentEmployee?.employeeId) {
        currentEmployeeId = currentEmployee.employeeId;
      }

      // 如果传入了 projectId，检查用户是否是该项目经理
      let isProjectManager = false;
      if (projectId && currentEmployeeId) {
        const project = await this.prisma.project.findUnique({
          where: { projectId: BigInt(projectId) },
          select: { managerId: true }
        });
        if (project?.managerId && project.managerId.toString() === currentEmployeeId.toString()) {
          isProjectManager = true;
        }
      }

      // 如果是项目经理（针对指定项目），可以查看公司所有员工
      if (isProjectManager) {
        // 不添加任何人员限制，项目经理可以看到所有员工
      } else {
        // 获取当前用户参与的项目中的所有员工ID
        let projectMemberIds: BigInt[] = [];
        if (currentEmployeeId) {
          const memberships = await this.prisma.projectMember.findMany({
            where: { employeeId: currentEmployeeId as any },
            select: { projectId: true }
          });
          const projectIds = memberships.map(m => m.projectId);

          if (projectIds.length > 0) {
            const members = await this.prisma.projectMember.findMany({
              where: { projectId: { in: projectIds } },
              select: { employeeId: true }
            });
            projectMemberIds = members.map(m => m.employeeId);
          }
        }

        // 构建条件：自己 OR 同一项目的成员
        const orConditions: any[] = [];
        if (currentEmployeeId) {
          orConditions.push({ employeeId: currentEmployeeId });
        }
        if (projectMemberIds.length > 0) {
          orConditions.push({ employeeId: { in: projectMemberIds } });
        }
        if (orConditions.length > 0) {
          where.OR = orConditions;
        }
      }
    }

    // 排除超级管理员用户
    where.userId = { not: 1n };

    if (name) {
      where.name = { contains: name };
    }
    if (deptId && deptId !== 'undefined' && deptId !== 'null' && deptId !== '') {
      try {
        where.deptId = BigInt(deptId);
      } catch (e) {
        // Ignore invalid deptId
      }
    }

    const [total, list] = await Promise.all([
      this.prisma.sysEmployee.count({ where }),
      this.prisma.sysEmployee.findMany({
        where,
        skip,
        take: pageSize,
        include: { user: true },
        orderBy: { createTime: 'desc' }
      })
    ]);

    return {
      total,
      list: list.map(item => ({
        ...item,
        employeeId: item.employeeId.toString(),
        deptId: item.deptId?.toString(),
        userId: item.userId?.toString(),
        loginName: (item as any).user?.loginName,
        dingtalkUserId: (item as any).dingtalkUserId?.toString(),
        dingtalkDeptId: (item as any).dingtalkDeptId?.toString(),
        status: item.status === '0' ? 'active' : item.status === '1' ? 'resigned' : 'probation',
      }))
    };
  }

  /**
   * 获取岗位列表
   */
  async getPositionList(query: {
    pageNum?: number;
    pageSize?: number;
    postName?: string;
    status?: string;
  }) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { postName, status } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (postName) {
      where.postName = { contains: postName };
    }
    if (status) {
      where.status = status;
    }

    const [total, list] = await Promise.all([
      this.prisma.sysPost.count({ where }),
      this.prisma.sysPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { postSort: 'asc' }
      })
    ]);

    return {
      total,
      list: list.map(item => ({
        ...item,
        id: item.postId.toString(),
        postId: item.postId.toString(),
        name: item.postName,
        code: item.postCode,
        level: item.postLevel,
        sortOrder: item.postSort,
        status: item.status === '0' ? 'active' : 'inactive'
      }))
    };
  }

  /**
   * 创建部门
   */
  async createDept(data: any, creator: string) {
    const dept = await this.prisma.sysDept.create({
      data: {
        deptName: data.name,
        deptNameEn: data.nameEn || null,
        parentId: data.parentId ? BigInt(data.parentId) : 0n,
        orderNum: data.sortOrder || 0,
        createBy: creator,
        createTime: new Date()
      }
    });

    try {
      let parentDingtalkDeptId = 1;
      if (data.parentId) {
        const parentDept = await this.prisma.sysDept.findFirst({ where: { deptId: BigInt(data.parentId) } });
        if (parentDept?.dingtalkDeptId) {
          parentDingtalkDeptId = parseInt(parentDept.dingtalkDeptId);
        }
      }
      const dingtalkResult = await this.dingtalkService.createDepartment(data.name, parentDingtalkDeptId, data.nameEn);
      if (dingtalkResult.success && dingtalkResult.deptId) {

        await this.prisma.sysDept.update({
          where: { deptId: dept.deptId },
          data: { dingtalkDeptId: dingtalkResult.deptId }
        });

      } else {
        console.warn(`[Organization] 部门 ${data.name} 同步钉钉失败: ${dingtalkResult.error}`);
      }
    } catch (error) {
      console.error(`[Organization] 部门 ${data.name} 同步钉钉异常:`, error.message);
    }

    return dept;
  }

  /**
   * 更新部门
   */
  async updateDept(id: string, data: any, updater: string) {
    const dept = await this.prisma.sysDept.findFirst({
      where: { deptId: BigInt(id) }
    });

    const updatedDept = await this.prisma.sysDept.update({
      where: { deptId: BigInt(id) },
      data: {
        deptName: data.name,
        deptNameEn: data.nameEn || null,
        parentId: data.parentId ? BigInt(data.parentId) : undefined,
        orderNum: data.sortOrder !== undefined ? data.sortOrder : undefined,
        updateBy: updater,
        updateTime: new Date()
      }
    });

    if (dept?.dingtalkDeptId) {
      try {
        const dingtalkResult = await this.dingtalkService.updateDepartment(
          dept.dingtalkDeptId,
          data.name,
          data.nameEn
        );
        if (dingtalkResult.success) {

        } else {
          console.warn(`[Organization] 部门 ${data.name} 同步更新到钉钉失败: ${dingtalkResult.error}`);
        }
      } catch (error) {
        console.error(`[Organization] 部门 ${data.name} 同步更新到钉钉异常:`, error.message);
      }
    }

    return updatedDept;
  }

  /**
   * 删除部门 (软删除)
   */
  async deleteDept(id: string) {
    const dept = await this.prisma.sysDept.findFirst({
      where: { deptId: BigInt(id) }
    });

    if (dept?.dingtalkDeptId) {
      try {
        const dingtalkResult = await this.dingtalkService.deleteDepartment(dept.dingtalkDeptId);
        if (dingtalkResult.success) {

        } else {
          console.warn(`[Organization] 部门 ${dept.deptName} 从钉钉删除失败: ${dingtalkResult.error}`);
        }
      } catch (error) {
        console.error(`[Organization] 部门 ${dept.deptName} 从钉钉删除异常:`, error.message);
      }
    }

    return this.prisma.sysDept.update({
      where: { deptId: BigInt(id) },
      data: {
        delFlag: '2'
      }
    });
  }

  /**
   * 创建岗位
   */
  async createPosition(data: any, creator: string) {
    return this.prisma.sysPost.create({
      data: {
        postName: data.name,
        postCode: data.code || `P_${Date.now()}`,
        postLevel: data.level || 1,
        postSort: data.sortOrder || 0,
        status: data.status === 'active' ? '0' : '1',
        remark: data.description || '',
        createBy: creator
      }
    });
  }

  /**
   * 更新岗位
   */
  async updatePosition(id: string, data: any, updater: string) {
    return this.prisma.sysPost.update({
      where: { postId: BigInt(id) },
      data: {
        postName: data.name,
        postLevel: data.level !== undefined ? data.level : undefined,
        postSort: data.sortOrder !== undefined ? data.sortOrder : undefined,
        status: data.status === 'active' ? '0' : (data.status === 'inactive' ? '1' : undefined),
        remark: data.description !== undefined ? data.description : undefined,
        updateTime: new Date()
      }
    });
  }

  /**
   * 删除岗位
   */
  async deletePosition(id: string) {
    return this.prisma.sysPost.delete({
      where: { postId: BigInt(id) }
    });
  }

  /**
   * 获取职员详情
   */
  async getEmployeeById(id: string, user?: any) {
    const item = await this.prisma.sysEmployee.findUnique({
      where: { employeeId: BigInt(id) }
    }) as any;

    if (!item) return null;

    const userPermissions = user?.permissions || [];
    const canViewDetail = userPermissions.includes('*') || userPermissions.includes('personnel:detail:view');
    const isAdmin = user?.role === 'admin' || user?.roleKey === 'admin';
    const userId = user?.sub || user?.userId;
    const isOwnRecord = userId && item.userId?.toString() === userId.toString();

    let departmentName: string | null = null;
    if (item.deptId) {
      const dept = await this.prisma.sysDept.findUnique({
        where: { deptId: item.deptId }
      }) as any;
      departmentName = dept?.deptName || null;
    }

    const baseInfo = {
      employeeId: item.employeeId.toString(),
      name: item.name,
      avatarColor: item.avatarColor,
    };

    if (!canViewDetail && !isAdmin && !isOwnRecord) {
      return baseInfo;
    }

    return {
      ...baseInfo,
      employeeNo: item.employeeNo,
      gender: item.gender,
      phone: item.phone,
      phoneCountryCode: item.phoneCountryCode,
      email: item.email,
      deptId: item.deptId?.toString(),
      departmentName: departmentName,
      position: item.position,
      positionName: item.position,
      userId: item.userId?.toString(),
      dingtalkUserId: item.dingtalkUserId,
      dingtalkDeptId: item.dingtalkDeptId,
      status: item.status === '0' ? 'active' : item.status === '1' ? 'resigned' : 'probation',
      currentStatus: 'on_duty',
      hireDate: item.hireDate,
      leaveDate: item.leaveDate,
      createTime: item.createTime,
      updateTime: item.updateTime,
      education: item.education,
      university: item.university
    };
  }

  /**
   * 更新职员信息
   */
  async updateEmployee(id: string, data: any, updater: string) {
    const employee = await this.prisma.sysEmployee.findUnique({
      where: { employeeId: BigInt(id) }
    });

    const updateData: any = {
      name: data.name,
      phone: data.phone,
      phoneCountryCode: data.phoneCountryCode,
      email: data.email,
      deptId: data.deptId ? BigInt(data.deptId) : undefined,
      position: data.position,
      postId: data.postId ? BigInt(data.postId) : undefined,
      reportToId: data.reportToId ? BigInt(data.reportToId) : data.reportToId === null ? null : undefined,
      status: data.status,
      updateTime: new Date()
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await this.prisma.sysEmployee.update({
      where: { employeeId: BigInt(id) },
      data: updateData
    }) as any;

    if (employee?.dingtalkUserId) {
      try {
        let dingtalkDeptId: number | undefined;
        if (data.deptId) {
          const dept = await this.prisma.sysDept.findFirst({ where: { deptId: BigInt(data.deptId) } });
          if (dept?.dingtalkDeptId) {
            dingtalkDeptId = parseInt(dept.dingtalkDeptId);
          }
        }

        let leaderDingtalkUserId: string | undefined;
        if (data.reportToId) {
          const leader = await this.prisma.sysEmployee.findUnique({
            where: { employeeId: BigInt(data.reportToId) },
            select: { dingtalkUserId: true }
          });
          leaderDingtalkUserId = leader?.dingtalkUserId || undefined;
        } else if (data.reportToId === null) {
          leaderDingtalkUserId = '';
        }

        const dingtalkResult = await this.dingtalkService.updateUser(employee.dingtalkUserId, {
          name: data.name,
          deptIds: dingtalkDeptId ? [dingtalkDeptId] : undefined,
          jobTitle: data.position,
          email: data.email,
          leader: leaderDingtalkUserId,
        });
        if (dingtalkResult.success) {

        } else {
          console.warn(`[Organization] 员工 ${data.name} 同步更新到钉钉失败: ${dingtalkResult.error}`);
        }
      } catch (error) {
        console.error(`[Organization] 员工 ${data.name} 同步更新到钉钉异常:`, error.message);
      }
    }

    let departmentName: string | null = null;
    if (updated.deptId) {
      const dept = await this.prisma.sysDept.findUnique({
        where: { deptId: updated.deptId }
      }) as any;
      departmentName = dept?.deptName || null;
    }

    const result = {
      employeeId: updated.employeeId.toString(),
      employeeNo: updated.employeeNo,
      name: updated.name,
      gender: updated.gender,
      phone: updated.phone,
      phoneCountryCode: updated.phoneCountryCode,
      email: updated.email,
      deptId: updated.deptId?.toString(),
      departmentName: departmentName,
      position: updated.position,
      positionName: updated.position,
      userId: updated.userId?.toString(),
      dingtalkUserId: updated.dingtalkUserId,
      dingtalkDeptId: updated.dingtalkDeptId,
      status: updated.status === '0' ? 'active' : updated.status === '1' ? 'resigned' : 'probation',
      currentStatus: 'on_duty',
      hireDate: updated.hireDate,
      leaveDate: updated.leaveDate,
      avatarColor: updated.avatarColor,
      createTime: updated.createTime,
      updateTime: updated.updateTime,
      education: updated.education,
      university: updated.university
    };
    return result;
  }

  async deleteEmployee(id: string) {
    const employee = await this.prisma.sysEmployee.findUnique({
      where: { employeeId: BigInt(id) }
    });

    if (employee?.dingtalkUserId) {
      try {
        const dingtalkResult = await this.dingtalkService.deleteUser(employee.dingtalkUserId);
        if (dingtalkResult.success) {

        } else {
          console.warn(`[Organization] 员工 ${employee.name} 从钉钉删除失败: ${dingtalkResult.error}`);
        }
      } catch (error) {
        console.error(`[Organization] 员工 ${employee.name} 从钉钉删除异常:`, error.message);
      }
    }

    return this.prisma.sysEmployee.delete({
      where: { employeeId: BigInt(id) }
    });
  }

  /**
   * 获取项目轮岗报表
   */
  async getProjectRotationReport(projectId: string, month: string) {
    const startOfMonth = new Date(`${month}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // 1. 获取项目成员
    const members = await this.prisma.projectMember.findMany({
      where: { projectId: BigInt(projectId) },
      include: { employee: true }
    });

    const employeeIds = members.map(m => m.employeeId);

    // 2. 获取这些成员在当月的轮岗记录
    const rotations = await this.prisma.personnelRotation.findMany({
      where: {
        employeeId: { in: employeeIds },
        OR: [
          { startDate: { gte: startOfMonth, lt: endOfMonth } },
          { endDate: { gte: startOfMonth, lt: endOfMonth } },
          { AND: [{ startDate: { lt: startOfMonth } }, { endDate: { gte: endOfMonth } }] }
        ]
      }
    });

    // 3. 组装数据
    return members.map(m => {
      const empRotations = rotations.filter(r => r.employeeId === m.employeeId);
      return {
        employeeId: m.employeeId.toString(),
        employeeName: m.employee.name,
        segments: empRotations.map(r => ({
          startDate: r.startDate.toISOString().split('T')[0],
          endDate: r.endDate.toISOString().split('T')[0],
          type: r.type,
          projectId: r.projectId?.toString()
        }))
      };
    });
  }

  async getRotationPlan(employeeId: string, yearMonth: string) {
    const startOfMonth = new Date(`${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const rotations = await this.prisma.personnelRotation.findMany({
      where: {
        employeeId: BigInt(employeeId),
        OR: [
          { startDate: { gte: startOfMonth, lt: endOfMonth } },
          { endDate: { gte: startOfMonth, lt: endOfMonth } },
          { AND: [{ startDate: { lt: startOfMonth } }, { endDate: { gte: endOfMonth } }] }
        ]
      }
    });

    const scheduleData = rotations.map(r => ({
      date: r.startDate.toISOString().split('T')[0],
      endDate: r.endDate.toISOString().split('T')[0],
      type: r.type,
      projectId: r.projectId.toString(),
      remark: r.remark
    }));

    return { schedule_data: scheduleData };
  }

  async saveRotationPlan(employeeId: string, yearMonth: string, segments: any[]) {
    const startOfMonth = new Date(`${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    await this.prisma.personnelRotation.deleteMany({
      where: {
        employeeId: BigInt(employeeId),
        startDate: { gte: startOfMonth, lt: endOfMonth }
      }
    });

    for (const segment of segments) {
      await this.prisma.personnelRotation.create({
        data: {
          employeeId: BigInt(employeeId),
          projectId: segment.projectId ? BigInt(segment.projectId) : BigInt(0),
          startDate: new Date(segment.date),
          endDate: segment.endDate ? new Date(segment.endDate) : new Date(segment.date),
          type: segment.type,
          remark: segment.remark || ''
        }
      });
    }

    return { success: true };
  }

  private buildTree(list: any[], parentId: string) {
    const nodes = list.filter(node => String(node.parentId) === parentId);
    for (const node of nodes) {
      const children = this.buildTree(list, node.id);
      if (children.length > 0) {
        node.children = children;
      }
    }
    return nodes;
  }

  async getReportTree() {
    const employees = await this.prisma.sysEmployee.findMany({
      where: { status: '0' },
      include: {
        reportTo: {
          select: { employeeId: true, name: true }
        },
        subordinates: {
          select: { employeeId: true, name: true, position: true }
        },
        leadingDepts: {
          select: { deptId: true, deptName: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return employees.map(emp => ({
      employeeId: emp.employeeId.toString(),
      name: emp.name,
      position: emp.position,
      reportToId: emp.reportToId?.toString() || null,
      reportToName: emp.reportTo?.name || null,
      subordinates: emp.subordinates.map(s => ({
        employeeId: s.employeeId.toString(),
        name: s.name,
        position: s.position,
      })),
      leadingDepts: emp.leadingDepts.map(d => ({
        deptId: d.deptId.toString(),
        deptName: d.deptName,
      })),
    }));
  }

  async updateReportTo(employeeId: string, reportToId: string | null) {
    if (reportToId && reportToId === employeeId) {
      throw new Error('不能将自己设置为直属上级');
    }

    if (reportToId) {
      const visited = new Set<string>();
      let currentId: string | null = reportToId;
      while (currentId) {
        if (visited.has(currentId)) {
          throw new Error('汇报关系存在循环引用');
        }
        visited.add(currentId);
        const emp = await this.prisma.sysEmployee.findUnique({
          where: { employeeId: BigInt(currentId) },
          select: { reportToId: true }
        });
        currentId = emp?.reportToId?.toString() ?? null;
        if (currentId === employeeId) {
          throw new Error('汇报关系存在循环引用');
        }
      }
    }

    const updated = await this.prisma.sysEmployee.update({
      where: { employeeId: BigInt(employeeId) },
      data: {
        reportToId: reportToId ? BigInt(reportToId) : null,
        updateTime: new Date()
      },
      include: {
        reportTo: { select: { employeeId: true, name: true, dingtalkUserId: true } },
        subordinates: { select: { employeeId: true, name: true } },
      }
    });

    try {
      const employee = await this.prisma.sysEmployee.findUnique({
        where: { employeeId: BigInt(employeeId) },
        select: { dingtalkUserId: true }
      });

      if (employee?.dingtalkUserId) {
        let leaderDingtalkUserId: string | undefined;
        if (reportToId) {
          const leader = await this.prisma.sysEmployee.findUnique({
            where: { employeeId: BigInt(reportToId) },
            select: { dingtalkUserId: true }
          });
          leaderDingtalkUserId = leader?.dingtalkUserId || undefined;
        }

        const syncResult = await this.dingtalkService.updateUser(
          employee.dingtalkUserId,
          { leader: leaderDingtalkUserId || '' }
        );

        if (syncResult.success) {

        } else {
          console.warn(`[ReportTo] Failed to sync to DingTalk: ${syncResult.error}`);
        }
      }
    } catch (error) {
      console.warn('[ReportTo] DingTalk sync error:', error?.message || error);
    }

    return updated;
  }

  async batchUpdateReportTo(updates: { employeeId: string; reportToId: string | null }[]) {
    const results: any[] = [];
    for (const update of updates) {
      try {
        const result = await this.updateReportTo(update.employeeId, update.reportToId);
        results.push({ employeeId: update.employeeId, success: true, data: result });
      } catch (error: any) {
        results.push({ employeeId: update.employeeId, success: false, error: error.message });
      }
    }
    return results;
  }

  async getSuperiorChain(employeeId: string, maxDepth: number = 10) {
    const chain: any[] = [];
    let currentId: string | null = employeeId;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const emp = await this.prisma.sysEmployee.findUnique({
        where: { employeeId: BigInt(currentId) },
        include: {
          reportTo: { select: { employeeId: true, name: true, position: true } },
        }
      });
      if (!emp) break;

      chain.push({
        employeeId: emp.employeeId.toString(),
        name: emp.name,
        position: emp.position,
        reportToId: emp.reportToId?.toString() || null,
        reportToName: emp.reportTo?.name || null,
      });

      currentId = emp.reportToId?.toString() || null;
      depth++;
    }

    return chain;
  }

  async getSubordinates(employeeId: string, recursive: boolean = false) {
    if (!recursive) {
      const subs = await this.prisma.sysEmployee.findMany({
        where: { reportToId: BigInt(employeeId), status: '0' },
        select: { employeeId: true, name: true, position: true, deptId: true }
      });
      return subs.map(s => ({
        ...s,
        employeeId: s.employeeId.toString(),
        deptId: s.deptId?.toString(),
      }));
    }

    const allSubs: any[] = [];
    const queue: string[] = [employeeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const subs = await this.prisma.sysEmployee.findMany({
        where: { reportToId: BigInt(currentId), status: '0' },
        select: { employeeId: true, name: true, position: true, deptId: true, reportToId: true }
      });

      for (const s of subs) {
        const subData = {
          employeeId: s.employeeId.toString(),
          name: s.name,
          position: s.position,
          deptId: s.deptId?.toString(),
          reportToId: s.reportToId?.toString(),
        };
        allSubs.push(subData);
        queue.push(s.employeeId.toString());
      }
    }

    return allSubs;
  }

  async updateDeptLeader(deptId: string, leaderId: string | null) {
    return this.prisma.sysDept.update({
      where: { deptId: BigInt(deptId) },
      data: {
        leaderId: leaderId ? BigInt(leaderId) : null,
        updateTime: new Date()
      },
      include: {
        leaderEmployee: { select: { employeeId: true, name: true } }
      }
    });
  }

  async resolveApproverByFlag(flag: string, initiatorUserId: string) {
    if (!flag.startsWith('reportTo:') && !flag.startsWith('initiator:')) {
      return null;
    }

    const initiatorEmployee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(initiatorUserId), status: '0' },
    });
    if (!initiatorEmployee) return [];

    const flagType = flag.startsWith('reportTo:') ? flag.replace('reportTo:', '') : flag.replace('initiator:', '');

    switch (flagType) {
      case 'manager': {
        if (!initiatorEmployee.reportToId) return [];
        const manager = await this.prisma.sysEmployee.findUnique({
          where: { employeeId: initiatorEmployee.reportToId },
        });
        if (!manager?.userId) return [];
        const managerUser = await this.prisma.sysUser.findUnique({
          where: { userId: manager.userId }
        });
        return managerUser ? [managerUser] : [];
      }

      case 'deptLeader': {
        if (!initiatorEmployee.deptId) return [];
        const dept = await this.prisma.sysDept.findUnique({
          where: { deptId: initiatorEmployee.deptId },
          include: { leaderEmployee: true }
        });
        if (!dept?.leaderId) return [];
        const leader = dept.leaderEmployee;
        if (!leader?.userId) return [];
        const leaderUser = await this.prisma.sysUser.findUnique({
          where: { userId: leader.userId }
        });
        return leaderUser ? [leaderUser] : [];
      }

      default: {
        const levelMatch = flagType.match(/^n(\d+)$/);
        if (levelMatch) {
          const level = parseInt(levelMatch[1]);
          let currentEmp = initiatorEmployee;
          for (let i = 0; i < level; i++) {
            if (!currentEmp.reportToId) return [];
            const superior = await this.prisma.sysEmployee.findUnique({
              where: { employeeId: currentEmp.reportToId }
            });
            if (!superior) return [];
            currentEmp = superior;
          }
          if (!currentEmp.userId) return [];
          const user = await this.prisma.sysUser.findUnique({
            where: { userId: currentEmp.userId }
          });
          return user ? [user] : [];
        }
        return [];
      }
    }
  }
}
