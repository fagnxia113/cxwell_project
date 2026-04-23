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
  }, user?: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, deptId } = query;
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
        dingtalkUserId: (item as any).dingtalkUserId?.toString(),
        dingtalkDeptId: (item as any).dingtalkDeptId?.toString()
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
        console.log(`[Organization] 部门 ${data.name} 已同步到钉钉，钉钉部门ID: ${dingtalkResult.deptId}`);
        await this.prisma.sysDept.update({
          where: { deptId: dept.deptId },
          data: { dingtalkDeptId: dingtalkResult.deptId }
        });
        console.log(`[Organization] 部门 ${data.name} 的钉钉部门ID已保存`);
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
          console.log(`[Organization] 部门 ${data.name} 已同步更新到钉钉`);
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
          console.log(`[Organization] 部门 ${dept.deptName} 已从钉钉删除`);
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
  async getEmployeeById(id: string) {
    const item = await this.prisma.sysEmployee.findUnique({
      where: { employeeId: BigInt(id) }
    }) as any;

    if (!item) return null;

    let departmentName: string | null = null;
    if (item.deptId) {
      const dept = await this.prisma.sysDept.findUnique({
        where: { deptId: item.deptId }
      }) as any;
      departmentName = dept?.deptName || null;
    }

    return {
      employeeId: item.employeeId.toString(),
      employeeNo: item.employeeNo,
      name: item.name,
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
      avatarColor: item.avatarColor,
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

    const updated = await this.prisma.sysEmployee.update({
      where: { employeeId: BigInt(id) },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        deptId: data.deptId ? BigInt(data.deptId) : undefined,
        position: data.position,
        status: data.status,
        updateTime: new Date()
      }
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
        const dingtalkResult = await this.dingtalkService.updateUser(employee.dingtalkUserId, {
          name: data.name,
          deptIds: dingtalkDeptId ? [dingtalkDeptId] : undefined,
          jobTitle: data.position,
          email: data.email,
        });
        if (dingtalkResult.success) {
          console.log(`[Organization] 员工 ${data.name} 信息已同步更新到钉钉`);
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
          console.log(`[Organization] 员工 ${employee.name} 已从钉钉删除`);
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
          type: r.type
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
}
