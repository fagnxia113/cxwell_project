import { singleton, inject } from 'tsyringe';
import type { IEmployeeRepository, EmployeeQueryParams } from '../domain/IEmployeeRepository.js';
import { Employee } from '../domain/Employee.entity.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateEmployeeDto {
  employee_no?: string;
  name: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  department_id?: string;
  position?: string;
  status?: 'active' | 'resigned' | 'probation';
  current_status?: 'on_duty' | 'leave' | 'business_trip' | 'other';
  hire_date?: string;
  role?: string;
  daily_cost?: number;
  skills?: any;
  avatar_color?: string;
  user_id?: string;
  employee_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
}

export interface UpdateEmployeeDto {
  name?: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  department_id?: string;
  position?: string;
  status?: 'active' | 'resigned' | 'probation';
  current_status?: 'on_duty' | 'leave' | 'business_trip' | 'other';
  hire_date?: string;
  leave_date?: string;
  role?: string;
  daily_cost?: number;
  skills?: any;
  avatar_color?: string;
  user_id?: string;
  employee_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
}

@singleton()
export class EmployeeUseCase {
  constructor(
    @inject('IEmployeeRepository') private repository: IEmployeeRepository
  ) {}

  private async generateEmployeeNo(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const result = await this.repository.findAll({ page: 1, pageSize: 1000 });
    const count = result.data.filter(e => e.employeeNo.includes(`EMP-${year}${month}`)).length;
    const seq = (count + 1).toString().padStart(4, '0');
    
    return `EMP-${year}${month}-${seq}`;
  }

  async createEmployee(data: CreateEmployeeDto) {
    const id = uuidv4();
    const employeeNo = data.employee_no || await this.generateEmployeeNo();

    const employee = new Employee({
      id,
      employeeNo,
      name: data.name,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      departmentId: data.department_id,
      position: data.position,
      status: data.status || 'active',
      currentStatus: data.current_status || 'on_duty',
      hireDate: data.hire_date,
      role: (data.role as any) || 'user',
      dailyCost: data.daily_cost,
      skills: data.skills,
      avatarColor: data.avatar_color || '#1890ff',
      userId: data.user_id,
      employeeType: data.employee_type
    });

    await this.repository.create(employee);
    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('员工不存在');
    }

    const updated = new Employee({
      ...existing.snapshot(),
      id,
      name: data.name ?? existing.name,
      gender: data.gender ?? existing.gender,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      departmentId: data.department_id ?? existing.departmentId,
      position: data.position ?? existing.position,
      status: data.status ?? existing.status,
      currentStatus: data.current_status ?? existing.currentStatus,
      hireDate: data.hire_date ?? existing.hireDate,
      leaveDate: data.leave_date ?? existing.leaveDate,
      role: (data.role as any) ?? existing.role,
      dailyCost: data.daily_cost ?? existing.dailyCost,
      skills: data.skills ?? existing.skills,
      avatarColor: data.avatar_color ?? existing.avatarColor,
      userId: data.user_id ?? existing.userId,
      employeeType: data.employee_type ?? existing.employeeType
    });

    await this.repository.update(updated);
    return updated;
  }

  async deleteEmployee(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('员工不存在');
    }
    await this.repository.softDelete(id);
    return true;
  }

  async getEmployeeById(id: string) {
    return this.repository.findById(id);
  }

  async getEmployeeByUserId(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async getEmployees(params: EmployeeQueryParams) {
    return this.repository.findAll(params);
  }

  async getActiveEmployees() {
    return this.repository.findActive();
  }
}
