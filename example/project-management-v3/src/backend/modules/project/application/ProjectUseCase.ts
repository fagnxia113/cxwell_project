import { singleton, inject } from 'tsyringe';
import type { IProjectRepository } from '../domain/IProjectRepository.js';
import { Project } from '../domain/Project.entity.js';
import type { ProjectType } from '../domain/Project.entity.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProjectDto {
  code: string;
  name: string;
  type?: ProjectType;
  manager_id?: string;
  start_date: string | Date;
  end_date?: string | Date;
  budget?: number;
  customer_id?: string;
  description?: string;
  [key: string]: any;
}

@singleton()
export class ProjectUseCase {
  constructor(
    @inject('IProjectRepository') private repository: IProjectRepository
  ) {}

  async createProject(dto: CreateProjectDto) {
    const project = new Project({
      ...dto,
      managerId: dto.manager_id || (dto as any).managerId,
      startDate: dto.start_date || (dto as any).startDate,
      endDate: dto.end_date || (dto as any).endDate,
      customerId: dto.customer_id || (dto as any).customerId,
      // 映射下划线字段到驼峰属性，修复 building_area 等字段触发的 Null 约束错误
      buildingArea: dto.building_area || (dto as any).buildingArea,
      itCapacity: dto.it_capacity || (dto as any).itCapacity,
      cabinetCount: dto.cabinet_count || (dto as any).cabinetCount,
      cabinetPower: dto.cabinet_power || (dto as any).cabinetPower,
      powerArchitecture: dto.power_architecture || (dto as any).powerArchitecture,
      hvacArchitecture: dto.hvac_architecture || (dto as any).hvacArchitecture,
      fireArchitecture: dto.fire_architecture || (dto as any).fireArchitecture,
      weakElectricArchitecture: dto.weak_electric_architecture || (dto as any).weakElectricArchitecture,
      technicalLeadId: dto.technical_lead_id || (dto as any).technicalLeadId,
      endCustomer: dto.end_customer || (dto as any).endCustomer,
      rackPower: dto.rack_power || (dto as any).rackPower,
      managerName: dto.manager || dto.managerName || (dto as any).manager_name
    });

    return (await this.repository.save(project)).toJSON();
  }

  async getProjectById(id: string) {
    const project = await this.repository.findById(id);
    if (!project) throw new Error('项目不存在');
    return project.toJSON();
  }

  async getProjects(params: any) {
    const result = await this.repository.findAll(params);
    return {
      data: result.data.map(p => p.toJSON()),
      total: result.total
    };
  }

  async updateProject(id: string, updates: any) {
    const project = await this.repository.findById(id);
    if (!project) throw new Error('项目不存在');

    // Update props
    const currentData = project.toJSON();
    const updatedProject = new Project({
      ...currentData,
      ...updates,
      // 映射下划线字段到驼峰属性，确保更新动作也能识别表单传来的 snake_case 键
      managerId: updates.manager_id || updates.managerId || currentData.managerId,
      startDate: updates.start_date || updates.startDate || currentData.startDate,
      endDate: updates.end_date || updates.endDate || currentData.endDate,
      buildingArea: updates.building_area || updates.buildingArea || currentData.buildingArea,
      itCapacity: updates.it_capacity || updates.itCapacity || currentData.itCapacity,
      cabinetCount: updates.cabinet_count || updates.cabinetCount || currentData.cabinetCount,
      cabinetPower: updates.cabinet_power || updates.cabinetPower || currentData.cabinetPower,
      powerArchitecture: updates.power_architecture || updates.powerArchitecture || currentData.powerArchitecture,
      hvacArchitecture: updates.hvac_architecture || updates.hvacArchitecture || currentData.hvacArchitecture,
      fireArchitecture: updates.fire_architecture || updates.fireArchitecture || currentData.fireArchitecture,
      weakElectricArchitecture: updates.weak_electric_architecture || updates.weakElectricArchitecture || currentData.weakElectricArchitecture,
      rackPower: updates.rack_power || updates.rackPower || currentData.rackPower,
      customerId: updates.customer_id || updates.customerId || currentData.customerId,
      managerName: updates.manager || updates.managerName || currentData.managerName,
      id // Ensure ID remains same
    });

    const saved = await this.repository.save(updatedProject);
    
    // Logic for syncing keepers if manager changes (Optional, following old logic)
    if (updates.manager_id && updates.manager_id !== currentData.managerId) {
       // This could be a domain event
    }

    return saved.toJSON();
  }

  async deleteProject(id: string) {
    await this.repository.delete(id);
    return true;
  }

  async getProjectManager(projectId: string) {
    const project = await this.repository.findById(projectId);
    if (!project) return null;
    
    const projectData = project.toJSON();
    const managerId = projectData.manager_id || projectData.managerId;
    
    if (!managerId) return null;
    
    // 使用 db 直接查询以避免重复创建 PrismaClient
    const { db } = await import('../../../database/connection.js');
    const employee = await db.queryOne<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM employees WHERE id = ?',
      [managerId]
    );
    
    return employee;
  }

  async getProjectStatistics() {
    const { db } = await import('../../../database/connection.js');
    const stats = await db.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM projects GROUP BY status`
    );

    const result = {
      total: 0,
      in_progress: 0,
      delayed: 0,
      completed: 0
    };

    stats.forEach(s => {
      const count = Number(s.count);
      result.total += count;
      if (s.status === 'in_progress') result.in_progress = count;
      else if (s.status === 'delayed') result.delayed = count;
      else if (s.status === 'completed') result.completed = count;
    });

    return result;
  }
}
