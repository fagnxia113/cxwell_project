import { db } from '../database/connection.js';
import { ApproverSource, Approver, ProcessContext } from '../types/workflow.js';

export class ApproverResolver {
  async resolveApprovers(source: ApproverSource, context: ProcessContext): Promise<Approver[]> {
    try {
      const approvers = await this.doResolveApprovers(source, context);
      if (approvers.length > 0) return approvers;
      if (source.fallback) return this.resolveApprovers(source.fallback, context);
      return [];
    } catch (error) {
      console.error('解析审批人失败:', error);
      if (source.fallback) return this.resolveApprovers(source.fallback, context);
      return [];
    }
  }

  private async doResolveApprovers(source: ApproverSource, context: ProcessContext): Promise<Approver[]> {
    switch (source.type) {
      case 'fixed':
      case 'user':
        return this.resolveFixed(Array.isArray(source.value) ? source.value : [source.value]);
      case 'role':
      case 'department_manager':
      case 'project_manager':
        return this.getUsersByRole(Array.isArray(source.value) ? source.value : [source.value as string]);
      case 'department':
        return this.getUsersByDepartment(Array.isArray(source.value) ? source.value : [source.value as string]);
      case 'superior':
        return this.resolveSuperior(context.initiator.id, source.value as string);
      case 'warehouse_manager':
        return this.resolveWarehouseManager(context);
      case 'form_field':
      case 'field':
        return this.resolveFromFormField(Array.isArray(source.value) ? source.value : [source.value as string], context.formData);
      case 'expression':
        return this.resolveByExpression(source.value as string, context);
      case 'variable':
        return this.resolveByVariable(source.value as string, context);
      case 'previous_handler':
        return this.resolvePreviousHandler(context);
      case 'initiator':
        return [context.initiator];
      default:
        return [];
    }
  }

  private async resolveFixed(userIds: string[]): Promise<Approver[]> {
    const approvers: Approver[] = [];
    for (const userId of userIds) {
      const user = await this.getUserInfo(userId);
      if (user) approvers.push(user);
    }
    return approvers;
  }

  private async getUsersByRole(roles: string[]): Promise<Approver[]> {
    const approvers: Approver[] = [];
    for (const role of roles) {
      const users = await db.query<any>(
        `SELECT u.id as user_id, e.name, e.department_id, e.position
         FROM users u JOIN employees e ON u.id = e.user_id
         WHERE u.role = ? AND e.status = 'active'`,
        [role]
      );
      users.forEach((row: any) => approvers.push({
        id: row.user_id, name: row.name, department: row.department_id, position: row.position
      }));
    }
    return approvers;
  }

  private async getUsersByDepartment(departments: string[]): Promise<Approver[]> {
    const approvers: Approver[] = [];
    for (const dept of departments) {
      const users = await db.query<any>(
        `SELECT u.id as user_id, e.name, e.department_id, e.position
         FROM employees e LEFT JOIN users u ON e.user_id = u.id
         WHERE e.department_id = ? AND e.status = 'active'`,
        [dept]
      );
      users.forEach((row: any) => approvers.push({
        id: row.user_id || row.id, name: row.name, department: row.department_id, position: row.position
      }));
    }
    return approvers;
  }

  private async resolveSuperior(userId: string, level: string): Promise<Approver[]> {
    const user = await this.getUserInfo(userId);
    if (!user) return [];

    if (level === 'department') {
      const dept = await db.queryOne<any>(
        `SELECT manager_id, manager_name FROM departments WHERE id = ?`, [user.department]
      );
      if (dept?.manager_id) return [{ id: dept.manager_id, name: dept.manager_name, department: user.department, position: 'department_manager' }];

      const managers = await db.query<any>(
        `SELECT id, name, department_id, position FROM employees
         WHERE department_id = ? AND status = 'active' AND (role = 'department_manager' OR position LIKE '%经理%' OR position LIKE '%总监%') LIMIT 1`,
        [user.department]
      );
      if (managers?.length > 0) return managers.map((r: any) => ({ id: r.id, name: r.name, department: r.department_id, position: r.position }));
      return [];
    }

    const rows = await db.query<any>(
      `SELECT id, name, department_id, position FROM employees WHERE department_id = ? AND position IN ('manager', 'director')`,
      [user.department]
    );
    return rows.map((r: any) => ({ id: r.id, name: r.name, department: r.department_id, position: r.position }));
  }

  private async resolveFromFormField(fields: string[], formData: Record<string, any>): Promise<Approver[]> {
    const approvers: Approver[] = [];
    for (const field of fields) {
      const userId = this.getFieldValue(formData, field);
      if (userId) {
        const user = await this.getUserInfo(userId);
        if (user) approvers.push(user);
      }
    }
    return approvers;
  }

  private async resolveByExpression(value: string, context: ProcessContext): Promise<Approver[]> {
    try {
      const expression = value.replace(/\$\{(.*?)\}/g, (_, expr) => {
        const parts = expr.split('.');
        let current: any = { formData: context.formData, variables: context.variables, initiator: context.initiator };
        for (const part of parts) {
          if (current && typeof current === 'object') current = current[part];
          else return '';
        }
        return current || '';
      });

      if (!expression) return [];
      if (expression.includes('department_id') || this.isDepartmentId(expression)) return this.resolveDepartmentManager(expression);
      if (expression.includes(',')) return this.resolveFixed(expression.split(',').map((id: string) => id.trim()));

      const user = await this.getUserInfo(expression);
      if (user) return [user];
      return this.resolveDepartmentManager(expression);
    } catch (error) {
      console.error('解析表达式失败:', error);
      return [];
    }
  }

  private isDepartmentId(id: string): boolean {
    return id.startsWith('dept-') || id.startsWith('department-');
  }

  private async resolveByVariable(value: string, context: ProcessContext): Promise<Approver[]> {
    try {
      const variableValue = context.formData?.[value] || context.variables?.[value];
      if (!variableValue) return [];

      if (Array.isArray(variableValue)) {
        const approvers: Approver[] = [];
        for (const id of variableValue) {
          const user = await this.getUserInfo(id);
          if (user) approvers.push(user);
        }
        return approvers;
      }

      if (typeof variableValue === 'string') {
        if (variableValue.includes(',')) return this.resolveFixed(variableValue.split(',').map((id: string) => id.trim()));
        const user = await this.getUserInfo(variableValue);
        if (user) return [user];
      }
      return [];
    } catch (error) {
      console.error('解析变量失败:', error);
      return [];
    }
  }

  private async resolveDepartmentManager(departmentId: string): Promise<Approver[]> {
    if (!departmentId) return [];
    try {
      const dept = await db.queryOne<any>(
        `SELECT manager_id, manager_name FROM departments WHERE id = ? AND status = 'active'`, [departmentId]
      );
      if (dept?.manager_id) return [{ id: dept.manager_id, name: dept.manager_name, department: departmentId, position: 'department_manager' }];

      const managers = await db.query<any>(
        `SELECT id, name, department_id, position FROM employees
         WHERE department_id = ? AND status = 'active' AND (role = 'department_manager' OR position LIKE '%经理%' OR position LIKE '%总监%') LIMIT 1`,
        [departmentId]
      );
      if (managers?.length > 0) return managers.map((r: any) => ({ id: r.id, name: r.name, department: r.department_id, position: r.position }));
      return [];
    } catch (error) {
      console.error('获取部门经理失败:', error);
      return [];
    }
  }

  private async resolveWarehouseManager(context: ProcessContext): Promise<Approver[]> {
    const warehouseId = context.formData?.warehouse_id;
    if (!warehouseId) return [];

    try {
      const warehouse = await db.queryOne<any>(
        `SELECT manager_id FROM warehouses WHERE id = ? AND status = 'active'`, [warehouseId]
      );
      if (!warehouse?.manager_id) return [];
      return this.resolveFixed([warehouse.manager_id]);
    } catch (error) {
      console.error('获取仓库管理员失败:', error);
      return [];
    }
  }

  private async resolvePreviousHandler(context: ProcessContext): Promise<Approver[]> {
    if (!context.currentTask) return [];
    const rows = await db.query<any>(
      `SELECT DISTINCT assignee_id, assignee_name FROM workflow_tasks
       WHERE instance_id = ? AND id != ? AND assignee_id IS NOT NULL ORDER BY completed_at DESC LIMIT 1`,
      [context.process.id, context.currentTask.id]
    );
    return rows.map((r: any) => ({ id: r.assignee_id, name: r.assignee_name }));
  }

  private async getUserInfo(userId: string): Promise<Approver | null> {
    const userRow = await db.queryOne<any>(
      `SELECT id, username, name FROM users WHERE id = ?`, [userId]
    );
    if (userRow) {
      const emp = await db.queryOne<any>(
        `SELECT name, department_id, position FROM employees WHERE user_id = ?`, [userId]
      );
      return {
        id: userRow.id,
        name: emp?.name || userRow.name,
        department: emp?.department_id,
        position: emp?.position
      };
    }

    const empRow = await db.queryOne<any>(
      `SELECT id, name, department_id, position, user_id FROM employees WHERE id = ?`, [userId]
    );
    if (!empRow) return null;
    return {
      id: empRow.user_id || empRow.id,
      name: empRow.name,
      department: empRow.department_id,
      position: empRow.position
    };
  }

  private getFieldValue(formData: Record<string, any>, fieldPath: string): string | null {
    const parts = fieldPath.split('.');
    let current: any = formData;
    for (const part of parts) {
      if (current && typeof current === 'object') current = current[part];
      else return null;
    }
    return (current as string) || null;
  }
}

export const approverResolver = new ApproverResolver();