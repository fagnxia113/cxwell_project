import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Employee } from '../domain/Employee.entity.js';
import type { IEmployeeRepository, EmployeeQueryParams } from '../domain/IEmployeeRepository.js';
import { Prisma } from '@prisma/client';

@singleton()
export class PrismaEmployeeRepository implements IEmployeeRepository {
  private mapRowToEntity(row: any): Employee {
    return new Employee({
      id: row.id,
      employeeNo: row.employee_no,
      name: row.name,
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      departmentId: row.department_id,
      position: row.position,
      status: row.status,
      currentStatus: row.current_status,
      hireDate: row.hire_date,
      leaveDate: row.leave_date,
      role: row.role,
      dailyCost: row.daily_cost ? Number(row.daily_cost) : undefined,
      skills: row.skills,
      avatarColor: row.avatar_color,
      userId: row.user_id,
      employeeType: row.employee_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  async create(employee: Employee): Promise<void> {
    const data = employee.toJSON();
    await prisma.employees.create({
      data: {
        id: data.id,
        employee_no: data.employeeNo,
        name: data.name,
        gender: data.gender as any,
        phone: data.phone || '',
        email: data.email || '',
        department_id: data.departmentId,
        position: data.position || '',
        status: data.status as any,
        current_status: data.currentStatus as any,
        hire_date: data.hireDate ? new Date(data.hireDate) : new Date(),
        leave_date: data.leaveDate ? new Date(data.leaveDate) : null,
        role: data.role as any,
        daily_cost: data.dailyCost,
        skills: (data.skills as any) || {},
        avatar_color: data.avatarColor,
        user_id: data.userId,
        employee_type: data.employeeType as any
      }
    });
  }

  async update(employee: Employee): Promise<void> {
    const data = employee.toJSON();
    await prisma.employees.update({
      where: { id: data.id },
      data: {
        name: data.name,
        gender: data.gender as any,
        phone: data.phone || '',
        email: data.email || '',
        department_id: data.departmentId,
        position: data.position || '',
        status: data.status as any,
        current_status: data.currentStatus as any,
        hire_date: data.hireDate ? new Date(data.hireDate) : undefined,
        leave_date: data.leaveDate ? new Date(data.leaveDate) : null,
        role: data.role as any,
        daily_cost: data.dailyCost,
        skills: (data.skills as any) || {},
        avatar_color: data.avatarColor,
        user_id: data.userId,
        employee_type: data.employeeType as any
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.employees.delete({
      where: { id }
    });
  }

  async softDelete(id: string): Promise<boolean> {
    await prisma.employees.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
    return true;
  }

  async findById(id: string): Promise<Employee | null> {
    const row = await prisma.employees.findFirst({
      where: { id, deleted_at: null }
    });
    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const row = await prisma.employees.findFirst({
      where: { user_id: userId, deleted_at: null }
    });
    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findAll(params: EmployeeQueryParams): Promise<{ data: Employee[]; total: number }> {
    const { page = 1, pageSize = 100, search, status, department_id, role } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.employeesWhereInput = {
      deleted_at: null
    };

    if (status) where.status = status as any;
    if (department_id) where.department_id = department_id;
    if (role) where.role = role as any;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employee_no: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const ds = (params as any).dataScope;
    if (ds) {
      if (ds.scope === 'self') {
        where.user_id = ds.userId;
      } else if (ds.scope === 'department') {
        if (!ds.departmentId) {
          where.id = 'none';
        } else {
          where.department_id = ds.departmentId;
        }
      }
    }

    const [total, rows] = await Promise.all([
      prisma.employees.count({ where }),
      prisma.employees.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return {
      data: rows.map(row => this.mapRowToEntity(row)),
      total
    };
  }

  async findActive(): Promise<Employee[]> {
    const rows = await prisma.employees.findMany({
      where: { status: 'active', deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return rows.map(row => this.mapRowToEntity(row));
  }
}
