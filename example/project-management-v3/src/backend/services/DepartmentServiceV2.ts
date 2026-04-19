import { singleton } from 'tsyringe';
import { container } from 'tsyringe';
import { DepartmentUseCase } from '../modules/organization/application/DepartmentUseCase.js';

@singleton()
export class DepartmentServiceV2 {
  private get departmentUseCase(): DepartmentUseCase {
    return container.resolve(DepartmentUseCase);
  }

  async getDepartmentById(id: string) {
    return this.departmentUseCase.getDepartmentById(id);
  }

  async getAllDepartments(params: any) {
    return this.departmentUseCase.getDepartments(params);
  }

  async createDepartment(data: any) {
    return this.departmentUseCase.createDepartment(data);
  }

  async updateDepartment(id: string, data: any) {
    return this.departmentUseCase.updateDepartment(id, data);
  }

  async deleteDepartment(id: string) {
    return this.departmentUseCase.deleteDepartment(id);
  }

  async getDepartmentTree() {
    return this.departmentUseCase.getDepartmentTree();
  }
}

export const departmentServiceV2 = new DepartmentServiceV2();
