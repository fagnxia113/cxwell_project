import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Department } from '../domain/Department.entity.js';
import type { IDepartmentRepository, DepartmentQueryParams } from '../domain/IDepartmentRepository.js';

@singleton()
export class PrismaDepartmentRepository implements IDepartmentRepository {
  private mapToEntity(row: any): Department {
    return new Department({
      id: row.id,
      code: row.code,
      name: row.name,
      parentId: row.parent_id,
      managerId: row.manager_id,
      managerName: row.manager_name,
      level: row.level,
      path: row.path,
      sortOrder: row.sort_order,
      status: row.status,
      description: row.description
    });
  }

  async findById(id: string): Promise<Department | null> {
    const row = await prisma.departments.findUnique({ where: { id } });
    return row ? this.mapToEntity(row) : null;
  }

  async findByCode(code: string): Promise<Department | null> {
    const row = await prisma.departments.findUnique({ where: { code } });
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(params?: DepartmentQueryParams): Promise<Department[]> {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.parent_id) where.parent_id = params.parent_id;

    const rows = await prisma.departments.findMany({
      where,
      orderBy: { sort_order: 'asc' }
    });
    return rows.map(row => this.mapToEntity(row));
  }

  async create(department: Department): Promise<Department> {
    const row = await prisma.departments.create({
      data: {
        id: department.id,
        code: department.code,
        name: department.name,
        parent_id: department.parentId || null,
        manager_id: department.managerId || null,
        manager_name: department.managerName || null,
        level: department.level || 1,
        path: department.path || null,
        sort_order: department.sortOrder || 0,
        status: (department.status as any) || 'active',
        description: department.description || null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    return this.mapToEntity(row);
  }

  async update(id: string, department: Partial<Department>): Promise<Department> {
    const data: any = {
      updated_at: new Date()
    };
    if (department.code !== undefined) data.code = department.code;
    if (department.name !== undefined) data.name = department.name;
    if (department.parentId !== undefined) data.parent_id = department.parentId;
    if (department.managerId !== undefined) data.manager_id = department.managerId;
    if (department.managerName !== undefined) data.manager_name = department.managerName;
    if (department.level !== undefined) data.level = department.level;
    if (department.path !== undefined) data.path = department.path;
    if (department.sortOrder !== undefined) data.sort_order = department.sortOrder;
    if (department.status !== undefined) data.status = department.status;
    if (department.description !== undefined) data.description = department.description;

    const row = await prisma.departments.update({
      where: { id },
      data
    });
    return this.mapToEntity(row);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.departments.delete({ where: { id } });
    return true;
  }

  async countEmployees(departmentId: string): Promise<number> {
    return prisma.employees.count({
      where: { department_id: departmentId }
    });
  }
}
