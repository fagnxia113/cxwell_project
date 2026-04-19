import { Request, Response, NextFunction } from 'express'
import { permissionService, DataScope } from '../services/PermissionService.js'
import { AuthorizationError } from '../errors/AppError.js'

declare global {
  namespace Express {
    interface Request {
      dataScope?: {
        scope: DataScope
        projectIds?: string[]
        departmentId?: string
        userId: string
      }
    }
  }
}

export const requireDataPermission = (entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError('未认证'))
    }

    try {
      const scope = await permissionService.getDataScopeForEntity(req.user.id, entityType)

      const dataScope: any = {
        scope,
        userId: req.user.id,
        employeeId: await permissionService.getEmployeeIdByUser(req.user.id)
      }

      if (scope === 'department') {
        dataScope.departmentId = req.user.departmentId
      }

      if (scope === 'project') {
        dataScope.projectIds = await permissionService.getUserProjectIds(req.user.id)
      }

      req.dataScope = dataScope
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthorizationError('未认证'))
  }

  const projectId = req.params.projectId || req.body.projectId || req.query.projectId

  if (!projectId) {
    return next()
  }

  try {
    const canAccess = await permissionService.canAccessProject(req.user.id, projectId)
    if (!canAccess) {
      return next(new AuthorizationError('无权访问此项目'))
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const requireProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthorizationError('未认证'))
  }

  const projectId = req.params.projectId || req.body.projectId

  if (!projectId) {
    return next()
  }

  try {
    const isMember = await permissionService.isProjectMember(req.user.id, projectId)
    if (!isMember) {
      return next(new AuthorizationError('不是项目成员，无权访问'))
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const requireProjectRole = (...roles: ('owner' | 'manager' | 'member' | 'viewer')[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError('未认证'))
    }

    const projectId = req.params.projectId || req.body.projectId

    if (!projectId) {
      return next()
    }

    try {
      const memberRole = await permissionService.getProjectMemberRole(req.user.id, projectId)
      if (!memberRole || !roles.includes(memberRole)) {
        return next(new AuthorizationError('项目角色权限不足'))
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const applyDataFilter = (entityType: string, tableAlias: string = 't') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError('未认证'))
    }

    try {
      const scope = await permissionService.getDataScopeForEntity(req.user.id, entityType)

      if (scope === 'all') {
        return next()
      }

      if (scope === 'department') {
        if (!req.user.departmentId) {
          req.query.department_id = 'none'
          return next()
        }
        req.query.department_id = req.user.departmentId
      }

      if (scope === 'project') {
        const projectIds = await permissionService.getUserProjectIds(req.user.id)
        if (projectIds.length === 0) {
          req.query.project_id = 'none'
        } else {
          req.query.project_id_in = projectIds.join(',')
        }
      }

      if (scope === 'self') {
        req.query.created_by = req.user.id
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
