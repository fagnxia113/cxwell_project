import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../database/prisma.js';
import { IProjectRepository } from '../domain/IProjectRepository.js';
import { Project } from '../domain/Project.entity.js';
import { Task } from '../domain/Task.entity.js';

export class PrismaProjectRepository implements IProjectRepository {
  private prisma: PrismaClient = prisma;

  // -------------------------------------------------------
  // Projects
  // -------------------------------------------------------

  async save(project: Project): Promise<Project> {
    const data = project.toJSON();
    const { id, ...rest } = data;

    const record = await this.prisma.projects.upsert({
      where: { id: id as string },
      create: {
        id: id as string,
        code: rest.code,
        name: rest.name,
        type: rest.type as any,
        manager_id: rest.managerId,
        status: rest.status as any,
        progress: rest.progress,
        start_date: rest.startDate instanceof Date ? rest.startDate : new Date(rest.startDate),
        end_date: rest.endDate ? (rest.endDate instanceof Date ? rest.endDate : new Date(rest.endDate)) : null,
        budget: rest.budget,
        customer_id: rest.customerId,
        organization_id: rest.organizationId,
        description: rest.description,
        country: rest.country,
        address: rest.address,
        attachments: rest.attachments,
        phase: rest.phase,
        phase_start_date: rest.phaseStartDate ? (rest.phaseStartDate instanceof Date ? rest.phaseStartDate : new Date(rest.phaseStartDate)) : null,
        phase_end_date: rest.phaseEndDate ? (rest.phaseEndDate instanceof Date ? rest.phaseEndDate : new Date(rest.phaseEndDate)) : null,
        estimated_days: rest.estimatedDays,
        remaining_days: rest.remainingDays,
        building_area: rest.buildingArea,
        it_capacity: rest.itCapacity,
        cabinet_count: rest.cabinetCount,
        cabinet_power: rest.cabinetPower,
        power_architecture: rest.powerArchitecture,
        hvac_architecture: rest.hvacArchitecture,
        fire_architecture: rest.fireArchitecture,
        weak_electric_architecture: rest.weakElectricArchitecture,
        approval_mode: rest.approvalMode,
        technical_lead_id: rest.technicalLeadId,
        end_customer: rest.endCustomer,
        rack_power: rest.rackPower,
        manager: rest.managerName
      },
      update: {
        code: rest.code,
        name: rest.name,
        type: rest.type as any,
        manager_id: rest.managerId,
        status: rest.status as any,
        progress: rest.progress,
        start_date: rest.startDate instanceof Date ? rest.startDate : new Date(rest.startDate),
        end_date: rest.endDate ? (rest.endDate instanceof Date ? rest.endDate : new Date(rest.endDate)) : null,
        budget: rest.budget,
        customer_id: rest.customerId,
        organization_id: rest.organizationId,
        description: rest.description,
        country: rest.country,
        address: rest.address,
        attachments: rest.attachments,
        phase: rest.phase,
        phase_start_date: rest.phaseStartDate ? (rest.phaseStartDate instanceof Date ? rest.phaseStartDate : new Date(rest.phaseStartDate)) : null,
        phase_end_date: rest.phaseEndDate ? (rest.phaseEndDate instanceof Date ? rest.phaseEndDate : new Date(rest.phaseEndDate)) : null,
        estimated_days: rest.estimatedDays,
        remaining_days: rest.remainingDays,
        building_area: rest.buildingArea,
        it_capacity: rest.itCapacity,
        cabinet_count: rest.cabinetCount,
        cabinet_power: rest.cabinetPower,
        power_architecture: rest.powerArchitecture,
        hvac_architecture: rest.hvacArchitecture,
        fire_architecture: rest.fireArchitecture,
        weak_electric_architecture: rest.weakElectricArchitecture,
        approval_mode: rest.approvalMode,
        technical_lead_id: rest.technicalLeadId,
        end_customer: rest.endCustomer,
        rack_power: rest.rackPower,
        manager: rest.managerName,
        updated_at: new Date()
      }
    });

    return this.mapToProject(record);
  }

  async findById(id: string): Promise<Project | null> {
    const record = await this.prisma.projects.findUnique({
      where: { id, deleted_at: null }
    });
    return record ? this.mapToProject(record) : null;
  }

  async findAll(params: {
    search?: string;
    status?: string;
    manager_id?: string;
    page?: number;
    pageSize?: number;
    dataScope?: {
      scope: string;
      userId: string;
      employeeId?: string;
      departmentId?: string;
      projectIds?: string[];
    };
  }): Promise<{ data: Project[]; total: number }> {
    const { search, status, manager_id, page = 1, pageSize = 10, dataScope } = params;
    const where: any = { deleted_at: null };

    if (status) where.status = status;
    if (manager_id) where.manager_id = manager_id;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }

    if (dataScope) {
      if (dataScope.scope === 'self') {
        where.manager_id = dataScope.employeeId || dataScope.userId;
      } else if (dataScope.scope === 'department') {
        if (!dataScope.departmentId) where.id = 'none';
        else where.organization_id = dataScope.departmentId;
      } else if (dataScope.scope === 'project') {
        if (!dataScope.projectIds || dataScope.projectIds.length === 0) {
          where.id = 'none';
        } else {
          where.id = { in: dataScope.projectIds };
        }
      }
    }

    const [total, records] = await Promise.all([
      this.prisma.projects.count({ where }),
      this.prisma.projects.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      data: records.map(r => this.mapToProject(r)),
      total
    };
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await this.prisma.$transaction([
      this.prisma.projects.update({
        where: { id },
        data: { deleted_at: new Date() } as any
      }),
      this.prisma.tasks.updateMany({
        where: { project_id: id },
        data: { deleted_at: new Date() } as any
      })
    ]);
  }

  // -------------------------------------------------------
  // Tasks
  // -------------------------------------------------------

  async saveTask(task: Task): Promise<Task> {
    const data = task.toJSON();
    const { id, ...rest } = data;

    const record = await this.prisma.tasks.upsert({
      where: { id: id as string },
      create: {
        id: id as string,
        project_id: rest.projectId,
        parent_id: rest.parentId,
        wbs_path: rest.wbsPath,
        wbs_code: rest.wbsCode,
        name: rest.name,
        task_type: rest.taskType as any,
        description: rest.description,
        assignee_id: rest.assigneeId,
        planned_start_date: rest.plannedStartDate instanceof Date ? rest.plannedStartDate : new Date(rest.plannedStartDate),
        planned_end_date: rest.plannedEndDate instanceof Date ? rest.plannedEndDate : new Date(rest.plannedEndDate),
        actual_start_date: rest.actualStartDate ? (rest.actualStartDate instanceof Date ? rest.actualStartDate : new Date(rest.actualStartDate)) : null,
        actual_end_date: rest.actualEndDate ? (rest.actualEndDate instanceof Date ? rest.actualEndDate : new Date(rest.actualEndDate)) : null,
        progress: rest.progress,
        status: rest.status as any,
        priority: rest.priority as any
      },
      update: {
        parent_id: rest.parentId,
        wbs_path: rest.wbsPath,
        wbs_code: rest.wbsCode,
        name: rest.name,
        task_type: rest.taskType as any,
        description: rest.description,
        assignee_id: rest.assigneeId,
        planned_start_date: rest.plannedStartDate instanceof Date ? rest.plannedStartDate : new Date(rest.plannedStartDate),
        planned_end_date: rest.plannedEndDate instanceof Date ? rest.plannedEndDate : new Date(rest.plannedEndDate),
        actual_start_date: rest.actualStartDate ? (rest.actualStartDate instanceof Date ? rest.actualStartDate : new Date(rest.actualStartDate)) : null,
        actual_end_date: rest.actualEndDate ? (rest.actualEndDate instanceof Date ? rest.actualEndDate : new Date(rest.actualEndDate)) : null,
        progress: rest.progress,
        status: rest.status as any,
        priority: rest.priority as any,
        updated_at: new Date()
      }
    });

    return this.mapToTask(record);
  }

  async findTaskById(id: string): Promise<Task | null> {
    const record = await this.prisma.tasks.findUnique({
      where: { id, deleted_at: null }
    });
    return record ? this.mapToTask(record) : null;
  }

  async findTasksByProject(projectId: string): Promise<Task[]> {
    const records = await this.prisma.tasks.findMany({
      where: { project_id: projectId, deleted_at: null },
      orderBy: { wbs_code: 'asc' }
    });
    return records.map(r => this.mapToTask(r));
  }

  async deleteTask(id: string): Promise<void> {
    await this.prisma.tasks.update({
      where: { id },
      data: { deleted_at: new Date() } as any
    });
  }

  async deleteTasksByProject(projectId: string): Promise<void> {
    await this.prisma.tasks.updateMany({
      where: { project_id: projectId },
      data: { deleted_at: new Date() } as any
    });
  }

  async findChildTasks(parentId: string): Promise<Task[]> {
    const records = await this.prisma.tasks.findMany({
      where: { parent_id: parentId, deleted_at: null },
      orderBy: { wbs_code: 'asc' }
    });
    return records.map(r => this.mapToTask(r));
  }

  async getMaxSiblingWBSCode(projectId: string, parentId: string | null): Promise<string | null> {
    const record = await this.prisma.tasks.findFirst({
      where: { project_id: projectId, parent_id: parentId, deleted_at: null },
      orderBy: { wbs_code: 'desc' },
      select: { wbs_code: true }
    });
    return record?.wbs_code || null;
  }

  async updateProjectProgress(projectId: string, progress: number): Promise<void> {
    await this.prisma.projects.update({
      where: { id: projectId },
      data: { progress, updated_at: new Date() }
    });
  }

  private mapToProject(record: any): Project {
    return new Project({
      id: record.id,
      code: record.code,
      name: record.name,
      type: record.type,
      managerId: record.manager_id,
      managerName: record.manager,
      status: record.status,
      progress: record.progress,
      startDate: record.start_date,
      endDate: record.end_date,
      budget: record.budget ? parseFloat(record.budget.toString()) : undefined,
      customerId: record.customer_id,
      organizationId: record.organization_id,
      description: record.description,
      country: record.country,
      address: record.address,
      attachments: record.attachments,
      phase: record.phase,
      phaseStartDate: record.phase_start_date,
      phaseEndDate: record.phase_end_date,
      estimatedDays: record.estimated_days,
      remainingDays: record.remaining_days,
      buildingArea: record.building_area ? parseFloat(record.building_area.toString()) : (record.area ? parseFloat(record.area.toString()) : undefined),
      itCapacity: record.it_capacity ? parseFloat(record.it_capacity.toString()) : (record.capacity ? parseFloat(record.capacity.toString()) : undefined),
      cabinetCount: record.cabinet_count ?? record.rack_count,
      cabinetPower: record.cabinet_power ? parseFloat(record.cabinet_power.toString()) : (record.rack_power ? parseFloat(record.rack_power.toString()) : undefined),
      powerArchitecture: record.power_architecture || record.power_arch,
      hvacArchitecture: record.hvac_architecture || record.hvac_arch,
      fireArchitecture: record.fire_architecture || record.fire_arch,
      weakElectricArchitecture: record.weak_electric_architecture || record.weak_arch,
      approvalMode: record.approval_mode,
      technicalLeadId: record.technical_lead_id,
      endCustomer: record.end_customer,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at
    });
  }

  private mapToTask(record: any): Task {
    return new Task({
      id: record.id,
      projectId: record.project_id,
      parentId: record.parent_id,
      wbsPath: record.wbs_path,
      wbsCode: record.wbs_code,
      name: record.name,
      taskType: record.task_type,
      description: record.description,
      assigneeId: record.assignee_id,
      assigneeName: record.assignee,
      plannedStartDate: record.planned_start_date,
      plannedEndDate: record.planned_end_date,
      actualStartDate: record.actual_start_date,
      actualEndDate: record.actual_end_date,
      progress: record.progress,
      status: record.status,
      priority: record.priority,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at
    });
  }
}
