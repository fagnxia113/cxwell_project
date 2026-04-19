export class Position {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  level?: number;
  category?: string;
  description?: string;
  requirements?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;

  constructor(data: Partial<Position>) {
    this.id = data.id || '';
    this.code = data.code || '';
    this.name = data.name || '';
    this.departmentId = data.departmentId || (data as any).department_id;
    this.departmentName = data.departmentName || (data as any).department_name;
    this.level = data.level;
    this.category = data.category;
    this.description = data.description;
    this.requirements = data.requirements;
    this.status = data.status || 'active';
    this.sortOrder = data.sortOrder !== undefined ? data.sortOrder : (data as any).sort_order;
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      department_id: this.departmentId,
      department_name: this.departmentName,
      level: this.level,
      category: this.category,
      description: this.description,
      requirements: this.requirements,
      status: this.status,
      sort_order: this.sortOrder
    };
  }
}
