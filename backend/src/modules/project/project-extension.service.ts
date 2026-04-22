import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectExtensionService {
  constructor(private prisma: PrismaService) {}

  // ---- Risks ----
  async getRisks(projectId: bigint) {
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
      milestone_id: item.milestoneId?.toString() || null, // 兼容前端字段名
      owner_name: item.ownerName, // 兼容前端字段名
      closed_at: item.closedAt, // 兼容前端字段名
      create_time: item.createTime,
      update_time: item.updateTime
    };
  }

  async addRisk(projectId: bigint, data: any) {
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

      // 提取字段并处理类型，兼容驼峰和下划线
      const mId = data.milestoneId || data.milestone_id;
      const oName = data.ownerName || data.owner_name;
      const dLine = data.deadline;

      // 移除可能冲突的字段
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

  async updateRisk(id: bigint, data: any) {
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

  async deleteRisk(id: bigint) {
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

  async addExpense(projectId: bigint, data: any) {
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

  async deleteExpense(id: bigint) {
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

  async addStaffingPlan(projectId: bigint, data: any) {
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

  async deleteStaffingPlan(id: bigint) {
    await this.prisma.projectStaffingPlan.delete({ where: { id } });
    return { success: true };
  }

  // ---- Personnel Permissions ----
  async updatePersonnelPermission(projectId: bigint, employeeId: bigint, canEdit: boolean) {
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
}
