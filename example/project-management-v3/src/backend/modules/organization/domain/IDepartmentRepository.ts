import { Department } from './Department.entity.js';

export interface DepartmentQueryParams {
  status?: string;
  parent_id?: string;
}

export interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  findByCode(code: string): Promise<Department | null>;
  findAll(params?: DepartmentQueryParams): Promise<Department[]>;
  create(department: Department): Promise<Department>;
  update(id: string, department: Partial<Department>): Promise<Department>;
  delete(id: string): Promise<boolean>;
  countEmployees(departmentId: string): Promise<number>;
}
