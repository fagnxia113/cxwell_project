import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectExtensionService {
  constructor(private prisma: PrismaService) {}

  private async checkUserProjectRole(projectId: bigint, user: any): Promise<'manager' | 'member' | null> {
    const userId = user?.sub || user?.userId;
    if (!userId) return null;

    if (userId === '1' || userId === 1) return 'manager';

    const project = await this.prisma.project.findUnique({
      where: { projectId },
      select: { managerId: true }
    });

    const employee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(userId) },
      select: { employeeId: true }
    });

    if (project?.managerId && employee && project.managerId.toString() === employee.employeeId.toString()) {
      return 'manager';
    }

    if (employee) {
      const membership = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          employeeId: employee.employeeId
        }
      });
      if (membership) return 'member';
    }

    return null;
  }

  // ---- Risks ----
  async getRisks(projectId: bigint, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const list = await this.prisma.projectRisk.findMany({
      where: { projectId },
      orderBy: { createTime: 'desc' }
    });
    return list.map(item => this.mapRisk(item));
  }

  private mapRisk(item: any) {
    return {
      ...item,
      id: item.id.toString(),
      projectId: item.projectId.toString(),
      milestone_id: item.milestoneId?.toString() || null,
      owner_name: item.ownerName,
      closed_at: item.closedAt,
      create_time: item.createTime,
      update_time: item.updateTime
    };
  }

  async addRisk(projectId: bigint, data: any, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    try {
      const year = new Date().getFullYear();
      const count = await this.prisma.projectRisk.count({
        where: {
          createTime: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          }
        }
      });
      const riskNo = `RSK-${year}-${(count + 1).toString().padStart(3, '0')}`;

      const mId = data.milestoneId || data.milestone_id;
      const oName = data.ownerName || data.owner_name;
      const dLine = data.deadline;

      const { id, projectId: pId, owner_name, ownerName, milestoneId, milestone_id, deadline, ...rest } = data;

      const res = await this.prisma.projectRisk.create({
        data: {
          ...rest,
          projectId,
          riskNo,
          status: data.status || 'pending',
          deadline: dLine ? new Date(dLine) : null,
          milestoneId: (mId && mId !== '') ? BigInt(mId) : null,
          ownerName: oName || null,
        }
      });
      return this.mapRisk(res);
    } catch (error) {
      console.error('[ProjectExtensionService.addRisk] Error:', error);
      throw error;
    }
  }

  async updateRisk(id: bigint, data: any, user: any) {
    const risk = await this.prisma.projectRisk.findUnique({ where: { id } });
    if (!risk) throw new NotFoundException('风险不存在');

    const role = await this.checkUserProjectRole(risk.projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const mId = data.milestoneId || data.milestone_id;
    const oName = data.ownerName || data.owner_name;
    const dLine = data.deadline;

    const { id: dummy, projectId, owner_name, ownerName, milestoneId, milestone_id, deadline, ...rest } = data;
    const updateData: any = { ...rest };
    
    if (data.status === 'closed') {
      updateData.closedAt = new Date();
    } else if (data.status && data.status !== 'closed') {
      updateData.closedAt = null;
    }

    if (dLine !== undefined) {
      updateData.deadline = dLine ? new Date(dLine) : null;
    }
    if (mId !== undefined) {
      updateData.milestoneId = (mId && mId !== '') ? BigInt(mId) : null;
    }
    if (oName !== undefined) {
      updateData.ownerName = oName;
    }

    const res = await this.prisma.projectRisk.update({
      where: { id },
      data: updateData
    });
    return this.mapRisk(res);
  }

  async deleteRisk(id: bigint, user: any) {
    const risk = await this.prisma.projectRisk.findUnique({ where: { id } });
    if (!risk) throw new NotFoundException('风险不存在');

    const role = await this.checkUserProjectRole(risk.projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    await this.prisma.projectRisk.delete({ where: { id } });
    return { success: true };
  }

  // ---- Expenses ----
  async getExpenses(projectId: bigint) {
    const list = await this.prisma.projectExpense.findMany({
      where: { projectId },
      orderBy: { date: 'desc' }
    });
    return list.map(item => ({
      ...item,
      id: item.id.toString(),
      projectId: item.projectId.toString(),
      amount: item.amount.toString()
    }));
  }

  async addExpense(projectId: bigint, data: any, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const res = await this.prisma.projectExpense.create({
      data: {
        ...data,
        projectId,
        amount: data.amount,
        date: new Date(data.date)
      }
    });
    return { ...res, id: res.id.toString(), projectId: res.projectId.toString(), amount: res.amount.toString() };
  }

  async deleteExpense(id: bigint, user: any) {
    const expense = await this.prisma.projectExpense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('费用不存在');

    const role = await this.checkUserProjectRole(expense.projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    await this.prisma.projectExpense.delete({ where: { id } });
    return { success: true };
  }

  // ---- Staffing Plans ----
  async getStaffingPlans(projectId: bigint) {
    const list = await this.prisma.projectStaffingPlan.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' }
    });
    return list.map(item => ({
      ...item,
      id: item.id.toString(),
      projectId: item.projectId.toString()
    }));
  }

  async addStaffingPlan(projectId: bigint, data: any, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以添加人员计划');
    }

    const res = await this.prisma.projectStaffingPlan.create({
      data: {
        ...data,
        projectId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });
    return { ...res, id: res.id.toString(), projectId: res.projectId.toString() };
  }

  async deleteStaffingPlan(id: bigint, user: any) {
    const plan = await this.prisma.projectStaffingPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('人员计划不存在');

    const role = await this.checkUserProjectRole(plan.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以删除人员计划');
    }

    await this.prisma.projectStaffingPlan.delete({ where: { id } });
    return { success: true };
  }

  // ---- Personnel Permissions ----
  async updatePersonnelPermission(projectId: bigint, employeeId: bigint, canEdit: boolean, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以修改成员权限');
    }

    const res = await this.prisma.projectMember.update({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId
        }
      },
      data: { canEdit }
    });
    return { ...res, id: res.id.toString(), projectId: res.projectId.toString(), employeeId: res.employeeId.toString() };
  }

  async getPersonnel(projectId: bigint, user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        employee: true
      }
    });

    return members.map(m => ({
      employee_id: m.employeeId.toString(),
      name: m.employee?.name || '未知',
      role: m.roleName || 'Member',
      can_edit: m.canEdit || false
    }));
  }
}
