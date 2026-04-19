import { singleton, inject } from 'tsyringe';
import { Department } from '../domain/Department.entity.js';
import type { IDepartmentRepository, DepartmentQueryParams } from '../domain/IDepartmentRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface DepartmentTree extends ReturnType<Department['toJSON']> {
  children?: DepartmentTree[];
}

@singleton()
export class DepartmentUseCase {
  constructor(
    @inject('IDepartmentRepository') private repository: IDepartmentRepository
  ) {}

  async createDepartment(data: any): Promise<Department> {
    const allDepts = await this.repository.findAll();
    const maxSeq = allDepts.reduce((max, dept) => {
      const match = dept.code.match(/^DEPT-(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        return seq > max ? seq : max;
      }
      return max;
    }, 0);
    const nextSeq = String(maxSeq + 1).padStart(3, '0');

    const department = new Department({
      ...data,
      id: uuidv4(),
      code: data.code || `DEPT-${nextSeq}`
    });
    return this.repository.create(department);
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    return this.repository.findById(id);
  }

  async getDepartments(params?: DepartmentQueryParams): Promise<Department[]> {
    return this.repository.findAll(params);
  }

  async getDepartmentTree(): Promise<DepartmentTree[]> {
    const allDepts = await this.repository.findAll();
    return this.buildTree(allDepts);
  }

  private buildTree(departments: Department[]): DepartmentTree[] {
    const map = new Map<string, DepartmentTree>();
    const roots: DepartmentTree[] = [];

    departments.forEach(dept => {
      map.set(dept.id, { ...dept.toJSON(), children: [] });
    });

    departments.forEach(dept => {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    return this.repository.update(id, data);
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const children = await this.repository.findAll({ parent_id: id });
    if (children.length > 0) {
      throw new Error('存在子部门，无法删除');
    }

    const employeeCount = await this.repository.countEmployees(id);
    if (employeeCount > 0) {
      throw new Error('部门下存在员工，无法删除');
    }

    return this.repository.delete(id);
  }

  async getDepartmentPath(id: string): Promise<Department[]> {
    const path: Department[] = [];
    let current = await this.repository.findById(id);

    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = await this.repository.findById(current.parentId);
      } else {
        break;
      }
    }

    return path;
  }

  async getAllChildren(id: string): Promise<Department[]> {
    const allDepts = await this.repository.findAll();
    const children: Department[] = [];
    const queue = [id];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      for (const dept of allDepts) {
        if (dept.parentId === currentId) {
          children.push(dept);
          queue.push(dept.id);
        }
      }
    }
    
    return children;
  }
}
