import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectExtensionService {
  constructor(private prisma: PrismaService) {}

  // ---- Risks ----
  async getRisks(projectId: bigint) {
    const list = await this.prisma.projectRisk.findMany({
      where: { projectId, status: 'open' },
      orderBy: { createTime: 'desc' }
    });
    return list.map(item => ({
      ...item,
      id: item.id.toString(),
      projectId: item.projectId.toString()
    }));
  }

  async addRisk(projectId: bigint, data: any) {
    const res = await this.prisma.projectRisk.create({
      data: {
        ...data,
        projectId,
        status: 'open'
      }
    });
    return { ...res, id: res.id.toString(), projectId: res.projectId.toString() };
  }

  async updateRisk(id: bigint, data: any) {
    const res = await this.prisma.projectRisk.update({
      where: { id },
      data
    });
    return { ...res, id: res.id.toString(), projectId: res.projectId.toString() };
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
