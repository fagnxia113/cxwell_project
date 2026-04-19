export class Department {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  managerId?: string;
  managerName?: string;
  level?: number;
  path?: string;
  sortOrder?: number;
  status?: 'active' | 'inactive';
  description?: string;

  constructor(data: Partial<Department>) {
    this.id = data.id || '';
    this.code = data.code || '';
    this.name = data.name || '';
    this.parentId = data.parentId;
    this.managerId = data.managerId;
    this.managerName = data.managerName;
    this.level = data.level;
    this.path = data.path;
    this.sortOrder = data.sortOrder;
    this.status = data.status || 'active';
    this.description = data.description;
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      parent_id: this.parentId,
      manager_id: this.managerId,
      manager_name: this.managerName,
      level: this.level,
      path: this.path,
      sort_order: this.sortOrder,
      status: this.status,
      description: this.description
    };
  }
}
