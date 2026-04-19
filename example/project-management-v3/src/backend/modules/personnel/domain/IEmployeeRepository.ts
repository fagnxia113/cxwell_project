import { Employee } from './Employee.entity.js';

export interface EmployeeQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  department_id?: string;
  role?: string;
  dataScope?: any;
}

export interface IEmployeeRepository {
  create(employee: Employee): Promise<void>;
  update(employee: Employee): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<boolean>;
  findById(id: string): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findAll(params: EmployeeQueryParams): Promise<{ data: Employee[]; total: number }>;
  findActive(): Promise<Employee[]>;
}

export const IEmployeeRepositoryToken = Symbol('IEmployeeRepository');
