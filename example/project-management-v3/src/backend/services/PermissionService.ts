import { db } from '../database/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  resource: string
  action: string
  type: 'menu' | 'button' | 'api'
  parent_id: string | null
  sort_order: number
  status: 'active' | 'inactive'
}

export interface Role {
  id: string
  code: string
  name: string
  description?: string
  is_system: boolean
  is_system_role: boolean
  status: 'active' | 'inactive'
  permissions: string[]
  data_scope?: Record<string, 'all' | 'department' | 'project' | 'self'>
}

export type DataScope = 'all' | 'department' | 'project' | 'self'

export interface UserPermission {
  userId: string
  roles: string[]
  roleCodes: string[]
  permissions: string[]
  menuPermissions: string[]
  dataScopes: Record<string, DataScope>
  isSuperAdmin: boolean
  isAdmin: boolean
}

export class PermissionService {
  async getUserRoles(userId: string): Promise<{ id: string; code: string }[]> {
    const rows = await db.query<{ id: string; code: string }>(
      `SELECT r.id, r.code
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.status = 'active'`,
      [userId]
    )
    return rows
  }

  async getUserPermissions(userId: string): Promise<UserPermission> {
    const roles = await this.getUserRoles(userId)

    if (roles.length === 0) {
      return {
        userId,
        roles: [],
        roleCodes: [],
        permissions: [],
        menuPermissions: [],
        dataScopes: {},
        isSuperAdmin: false,
        isAdmin: false
      }
    }

    const roleCodes = roles.map(r => r.code)

    const isSuperAdmin = roleCodes.includes('super_admin')
    const isAdmin = roleCodes.includes('admin') || isSuperAdmin

    const rows = await db.query<{ code: string; type: string }>(
      `SELECT DISTINCT p.code, p.type
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = ?
         AND r.status = 'active'
         AND p.status = 'active'`,
      [userId]
    )

    let permissions = rows.map(r => r.code)
    const menuPermissions = rows.filter(r => r.type === 'menu').map(r => r.code)

    if (isSuperAdmin) {
      permissions = ['*']
    }

    const dataScopes = await this.getDataScopes(roleCodes)

    return {
      userId,
      roles: roles.map(r => r.id),
      roleCodes,
      permissions,
      menuPermissions,
      dataScopes,
      isSuperAdmin,
      isAdmin
    }
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const { permissions, isAdmin, isSuperAdmin } = await this.getUserPermissions(userId)
    if (isSuperAdmin) return true
    return permissions.includes(permissionCode)
  }

  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    const { permissions, isAdmin, isSuperAdmin } = await this.getUserPermissions(userId)
    if (isSuperAdmin) return true
    return permissionCodes.some(code => permissions.includes(code))
  }

  async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    const { permissions, isAdmin, isSuperAdmin } = await this.getUserPermissions(userId)
    if (isSuperAdmin) return true
    return permissionCodes.every(code => permissions.includes(code))
  }

  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId)
    return roles.some(r => r.code === roleCode)
  }

  async getDataScopes(roleCodes: string[]): Promise<Record<string, DataScope>> {
    if (roleCodes.includes('super_admin') || roleCodes.includes('admin')) {
      return { '*': 'all' }
    }

    const rows = await db.query<{ entity_type: string; scope: DataScope }>(
      `SELECT DISTINCT dp.entity_type, dp.scope
       FROM data_permissions dp
       JOIN roles r ON dp.role_id = r.id
       WHERE r.code IN (?) AND r.status = 'active'`,
      [roleCodes]
    )

    const scopes: Record<string, DataScope> = {}
    for (const row of rows) {
      scopes[row.entity_type] = row.scope
    }
    return scopes
  }

  async getDataScopeForEntity(userId: string, entityType: string): Promise<DataScope> {
    const { dataScopes, isAdmin, isSuperAdmin } = await this.getUserPermissions(userId)

    if (isSuperAdmin || isAdmin) return 'all'
    if (dataScopes['*'] === 'all') return 'all'

    // 对于项目、任务等实体，检查用户是否是项目成员
    // 如果用户是某个项目的成员，scope应该包含'project'
    if (entityType === 'project' || entityType === 'task') {
      const userProjectIds = await this.getUserProjectIds(userId)
      if (userProjectIds.length > 0) {
        return 'project' // 返回project范围，让调用方用projectIds过滤
      }
    }

    return dataScopes[entityType] || 'self'
  }

  async applyDataPermission(
    userId: string,
    entityType: string,
    baseQuery: string,
    baseParams: any[],
    tableAlias: string = 't'
  ): Promise<{ query: string; params: any[] }> {
    const scope = await this.getDataScopeForEntity(userId, entityType)

    if (scope === 'all') {
      return { query: baseQuery, params: baseParams }
    }

    if (scope === 'department') {
      const userDept = await db.queryOne<{ department_id: string }>(
        'SELECT department_id FROM employees WHERE user_id = ?',
        [userId]
      )

      if (userDept?.department_id) {
        return {
          query: baseQuery + ` AND ${tableAlias}.department_id = ?`,
          params: [...baseParams, userDept.department_id]
        }
      }
    }

    if (scope === 'project') {
      const userProjectIds = await this.getUserProjectIds(userId)
      if (userProjectIds.length > 0) {
        return {
          query: baseQuery + ` AND ${tableAlias}.project_id IN (?)`,
          params: [...baseParams, userProjectIds]
        }
      }
    }

    if (entityType === 'project' && scope === 'self') {
      const employeeId = await this.getEmployeeIdByUser(userId)
      if (employeeId) {
        return {
          query: baseQuery + ` AND ${tableAlias}.manager_id = ?`,
          params: [...baseParams, employeeId]
        }
      }
    }

    return {
      query: baseQuery + ` AND ${tableAlias}.created_by = ?`,
      params: [...baseParams, userId]
    }
  }

  async getEmployeeIdByUser(userId: string): Promise<string | null> {
    const row = await db.queryOne<{ id: string }>(
      'SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL',
      [userId]
    )
    return row?.id || null
  }

  async getUserProjectIds(userId: string): Promise<string[]> {
    console.log('[DEBUG getUserProjectIds] userId:', userId);

    // 1. 用户作为项目成员的项目
    const memberProjects = await db.query<{ project_id: string }>(
      `SELECT DISTINCT pm.project_id
       FROM project_members pm
       WHERE pm.user_id = ?`,
      [userId]
    )
    console.log('[DEBUG getUserProjectIds] memberProjects:', memberProjects);

    // 2. 用户作为项目经理负责的项目（manager_id 字段存储的是 employee_id）
    const employeeId = await this.getEmployeeIdByUser(userId)
    let managedProjects: { id: string }[] = []
    
    if (employeeId) {
      managedProjects = await db.query<{ id: string }>(
        `SELECT id FROM projects WHERE (manager_id = ? OR technical_lead_id = ?) AND deleted_at IS NULL`,
        [employeeId, employeeId]
      )
      console.log('[DEBUG getUserProjectIds] employeeId:', employeeId, 'managedProjects:', managedProjects);
    } else {
      console.log('[DEBUG getUserProjectIds] No employee record found for userId:', userId);
    }

    // 合并并去重
    const allProjectIds = new Set([
      ...memberProjects.map(r => r.project_id),
      ...managedProjects.map(r => r.id)
    ])

    console.log('[DEBUG getUserProjectIds] final projectIds:', Array.from(allProjectIds));
    return Array.from(allProjectIds)
  }

  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const row = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM project_members WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    )
    return (row?.count || 0) > 0
  }

  async getProjectMemberRole(userId: string, projectId: string): Promise<'owner' | 'manager' | 'member' | 'viewer' | null> {
    const row = await db.queryOne<{ role: 'owner' | 'manager' | 'member' | 'viewer' }>(
      'SELECT role FROM project_members WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    )
    return row?.role || null
  }

  async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const { isSuperAdmin, isAdmin, roleCodes } = await this.getUserPermissions(userId)

    if (isSuperAdmin || isAdmin) return true

    const memberRole = await this.getProjectMemberRole(userId, projectId)
    if (memberRole) return true

    // 检查是否是项目经理或技术负责人 (使用 employee_id)
    const employeeId = await this.getEmployeeIdByUser(userId)
    if (employeeId) {
      const isManager = await db.queryOne<{ id: string }>(
        'SELECT id FROM projects WHERE id = ? AND (manager_id = ? OR technical_lead_id = ?) AND deleted_at IS NULL',
        [projectId, employeeId, employeeId]
      )
      if (isManager) return true
    }

    const deptScope = await this.getDataScopeForEntity(userId, 'project')
    if (deptScope === 'department') {
      const project = await db.queryOne<{ department_id: string }>(
        'SELECT department_id FROM projects WHERE id = ?',
        [projectId]
      )
      if (project) {
        const userDept = await db.queryOne<{ department_id: string }>(
          'SELECT department_id FROM employees WHERE user_id = ?',
          [userId]
        )
        return project.department_id === userDept?.department_id
      }
    }

    return false
  }

  async getRoles(): Promise<Role[]> {
    const roles = await db.query<Role>(
      "SELECT id, code, name, description, level, is_system, is_system_role, status FROM roles WHERE status = 'active' ORDER BY level DESC"
    )

    const result: Role[] = []
    for (const role of roles) {
      const perms = await db.query<{ code: string }>(
        `SELECT p.code
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? AND p.status = 'active'`,
        [role.id]
      )

      const dataScopes = await db.query<{ entity_type: string; scope: DataScope }>(
        'SELECT entity_type, scope FROM data_permissions WHERE role_id = ?',
        [role.id]
      )

      const scopeMap: Record<string, DataScope> = {}
      for (const s of dataScopes) {
        scopeMap[s.entity_type] = s.scope
      }

      result.push({
        ...role,
        permissions: perms.map(p => p.code),
        data_scope: scopeMap
      })
    }
    return result
  }

  async getRoleByCode(code: string): Promise<Role | null> {
    const role = await db.queryOne<Role>(
      "SELECT id, code, name, description, level, is_system, is_system_role, status FROM roles WHERE code = ? AND status = 'active'",
      [code]
    )

    if (!role) return null

    const perms = await db.query<{ code: string }>(
      `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.status = 'active'`,
      [role.id]
    )

    const dataScopes = await db.query<{ entity_type: string; scope: DataScope }>(
      'SELECT entity_type, scope FROM data_permissions WHERE role_id = ?',
      [role.id]
    )

    const scopeMap: Record<string, DataScope> = {}
    for (const s of dataScopes) {
      scopeMap[s.entity_type] = s.scope
    }

    return {
      ...role,
      permissions: perms.map(p => p.code),
      data_scope: scopeMap
    }
  }

  private parsePermissionFields(p: any): Permission {
    return {
      ...p,
      module: p.module || 'system',
      resource: p.resource || 'global',
      action: p.action || 'view'
    } as Permission;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const rows = await db.query<any>(
      "SELECT * FROM permissions WHERE status = 'active' ORDER BY sort_order"
    )
    return rows.map(r => this.parsePermissionFields(r));
  }

  async getMenuPermissions(): Promise<Permission[]> {
    const rows = await db.query<any>(
      "SELECT * FROM permissions WHERE type = 'menu' AND status = 'active' ORDER BY sort_order"
    )
    return rows.map(r => this.parsePermissionFields(r));
  }

  async getButtonPermissions(): Promise<Permission[]> {
    const rows = await db.query<any>(
      "SELECT * FROM permissions WHERE type = 'button' AND status = 'active' ORDER BY sort_order"
    )
    return rows.map(r => this.parsePermissionFields(r));
  }

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const perms = await this.getAllPermissions()
    const grouped: Record<string, Permission[]> = {}

    for (const p of perms) {
      if (!grouped[p.module]) {
        grouped[p.module] = []
      }
      grouped[p.module].push(p)
    }

    return grouped
  }

  async saveRole(role: Partial<Role> & { code: string; name: string }): Promise<string> {
    const existing = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ?', [role.code])

    if (existing) {
      if (role.code === 'admin') {
        throw new Error('不能修改系统预置角色')
      }

      await db.execute(
        'UPDATE roles SET name = ?, description = ?, updated_at = NOW() WHERE code = ?',
        [role.name, role.description || '', role.code]
      )
      return existing.id
    } else {
      const id = role.id || uuidv4()
      await db.execute(
        `INSERT INTO roles (id, code, name, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        [id, role.code, role.name, role.description || '']
      )
      return id
    }
  }

  async assignPermissions(roleCode: string, permissionCodes: string[]): Promise<void> {
    const role = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ?', [roleCode])
    if (!role) throw new Error('角色不存在')

    if (roleCode === 'admin') {
      throw new Error('不能修改系统预置角色的权限')
    }

    await db.transaction(async (conn: any) => {
      await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [role.id])

      if (permissionCodes.length > 0) {
        const [perms] = await conn.query(
          'SELECT id FROM permissions WHERE code IN (?) AND status = "active"',
          [permissionCodes]
        )

        for (const p of (perms as any[])) {
          await conn.query(
            'INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES (?, ?, ?, NOW())',
            [uuidv4(), role.id, p.id]
          )
        }
      }
    })
  }

  async assignDataScopes(roleCode: string, scopes: Record<string, DataScope>): Promise<void> {
    const role = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ?', [roleCode])
    if (!role) throw new Error('角色不存在')

    if (roleCode === 'admin') {
      throw new Error('不能修改系统预置角色的数据权限')
    }

    await db.transaction(async (conn: any) => {
      await conn.query('DELETE FROM data_permissions WHERE role_id = ?', [role.id])

      for (const [entityType, scope] of Object.entries(scopes)) {
        await conn.query(
          'INSERT INTO data_permissions (id, role_id, entity_type, scope, created_at) VALUES (?, ?, ?, ?, NOW())',
          [uuidv4(), role.id, entityType, scope]
        )
      }
    })
  }

  async deleteRole(code: string): Promise<void> {
    const role = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ?', [code])
    if (!role) return

    if (code === 'admin') {
      throw new Error('不能删除系统预置角色')
    }

    await db.transaction(async (conn: any) => {
      await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [role.id])
      await conn.query('DELETE FROM data_permissions WHERE role_id = ?', [role.id])
      await conn.query('DELETE FROM user_roles WHERE role_id = ?', [role.id])
      await conn.query('DELETE FROM roles WHERE id = ?', [role.id])
    })
  }

  async assignUserRole(userId: string, roleCode: string): Promise<void> {
    const role = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ? AND status = "active"', [roleCode])
    if (!role) throw new Error('角色不存在')

    await db.execute(
      `INSERT INTO user_roles (id, user_id, role_id, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE role_id = ?`,
      [uuidv4(), userId, role.id, role.id]
    )
  }

  async removeUserRole(userId: string, roleCode: string): Promise<void> {
    const role = await db.queryOne<{ id: string }>('SELECT id FROM roles WHERE code = ?', [roleCode])
    if (!role) return

    await db.execute('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, role.id])
  }

  async getUserMenus(userId: string): Promise<string[]> {
    const { menuPermissions, isSuperAdmin } = await this.getUserPermissions(userId)

    if (isSuperAdmin) {
      const allMenus = await db.query<{ code: string }>("SELECT code FROM permissions WHERE type = 'menu' AND status = 'active'")
      return allMenus.map(m => m.code)
    }

    return menuPermissions
  }

  async getUserMenuTree(userId: string): Promise<Permission[]> {
    const menuCodes = await this.getUserMenus(userId)
    if (menuCodes.includes('*')) {
      return await this.getMenuPermissions()
    }

    if (menuCodes.length === 0) {
      return [];
    }

    const rows = await db.query<Permission>(
      "SELECT * FROM permissions WHERE type = 'menu' AND status = 'active' AND code IN (?) ORDER BY sort_order",
      [menuCodes]
    )
    return rows.map(r => this.parsePermissionFields(r));
  }
}

export const permissionService = new PermissionService()
