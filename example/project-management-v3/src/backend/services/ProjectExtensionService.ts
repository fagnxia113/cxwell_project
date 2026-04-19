import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class ProjectExtensionService {
  // --- Expenses ---
  async getProjectExpenses(projectId: string) {
    return await prisma.project_expenses.findMany({
      where: { project_id: projectId },
      orderBy: { date: 'desc' },
    });
  }

  async addProjectExpense(projectId: string, data: any) {
    return await prisma.project_expenses.create({
      data: {
        id: uuidv4(),
        project_id: projectId,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes,
      },
    });
  }

  async deleteProjectExpense(id: string) {
    return await prisma.project_expenses.delete({
      where: { id },
    });
  }

  // --- Risks ---
  async getProjectRisks(projectId: string) {
    return await prisma.project_risks.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });
  }

  async addProjectRisk(projectId: string, data: any) {
    return await prisma.project_risks.create({
      data: {
        id: uuidv4(),
        project_id: projectId,
        title: data.title,
        description: data.description || '',
        level: data.level || 'medium',
        status: data.status || 'open',
        owner_id: data.owner_id,
      },
    });
  }

  async updateProjectRisk(id: string, data: any) {
    return await prisma.project_risks.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        level: data.level,
        status: data.status,
        owner_id: data.owner_id,
        updated_at: new Date(),
      },
    });
  }

  async deleteProjectRisk(id: string) {
    return await prisma.project_risks.delete({
      where: { id },
    });
  }

  // --- Staffing Plans ---
  async getProjectStaffingPlans(projectId: string) {
    return await prisma.project_staffing_plans.findMany({
      where: { project_id: projectId },
      orderBy: { start_date: 'asc' },
    });
  }

  async addStaffingPlan(projectId: string, data: any) {
    return await prisma.project_staffing_plans.create({
      data: {
        id: uuidv4(),
        project_id: projectId,
        employee_id: data.employee_id,
        plan_type: data.plan_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        notes: data.notes,
      },
    });
  }

  async deleteStaffingPlan(id: string) {
    return await prisma.project_staffing_plans.delete({
      where: { id },
    });
  }

  // --- Personnel Edit Permission ---
  async updatePersonnelPermission(projectId: string, employeeId: string, canEdit: boolean) {
    return await prisma.project_personnel.update({
      where: {
        project_id_employee_id: {
          project_id: projectId,
          employee_id: employeeId,
        },
      },
      data: {
        can_edit: canEdit,
      },
    });
  }

  async getProjectPersonnel(projectId: string) {
    return await prisma.project_personnel.findMany({
      where: { project_id: projectId },
    });
  }

  // --- Unified Task Board ---
  async getUnifiedTaskBoard(employeeId: string) {
    // 1. 获取用户参与的项目（作为PM或成员）
    const projectPersonnel = await prisma.project_personnel.findMany({
      where: { employee_id: employeeId }
    });

    const projectIds = projectPersonnel.map(p => p.project_id);

    // 单独查询项目信息
    const projects = await prisma.projects.findMany({
      where: { id: { in: projectIds } }
    });
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // 2. 聚合里程碑 (未完成的，且用户有权限或为PM)
    const milestones = await prisma.project_milestones.findMany({
      where: {
        project_id: { in: projectIds },
        status: { not: 'completed' }
      }
    });

    // 3. 聚合风险 (未关闭的，且用户是责任人)
    const risks = await prisma.project_risks.findMany({
      where: {
        owner_id: employeeId,
        status: 'open'
      }
    });

    // 4. 待办报告 (简化逻辑：仅获取最近未提交的日报任务，这里可能需要关联具体逻辑，暂以 mock 为主或基于 existing reports)
    // 实际生产中可能需要 scan 考勤记录但无日报的情况
    
    return {
      milestones: milestones.map((m: any) => ({
        id: m.id,
        title: m.name,
        type: 'milestone',
        projectId: m.project_id,
        projectName: projectMap.get(m.project_id)?.name,
        dueDate: m.planned_end_date,
        status: m.status,
      })),
      risks: risks.map(r => ({
        id: r.id,
        title: r.title,
        type: 'risk',
        projectId: r.project_id,
        projectName: projectMap.get(r.project_id)?.name,
        status: r.status,
        level: r.level
      }))
    };
  }
}

export const projectExtensionService = new ProjectExtensionService();
