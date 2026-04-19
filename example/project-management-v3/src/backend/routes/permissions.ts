import { Router, Request, Response } from 'express'
import { permissionService } from '../services/PermissionService.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userPerm = await permissionService.getUserPermissions(req.user!.id)
    res.json({ success: true, data: userPerm })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/users/:userId/effective-permissions', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userPerm = await permissionService.getUserPermissions(req.params.userId as string)
    res.json({ success: true, data: userPerm })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/check', authenticate, async (req: Request, res: Response) => {
  try {
    const { code } = req.query
    
    if (!code) {
      return res.status(400).json({ error: '缺少权限码' })
    }
    
    const hasPermission = await permissionService.hasPermission(
      req.user!.id,
      code as string
    )
    
    res.json({ success: true, data: { hasPermission } })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/menus', authenticate, async (req: Request, res: Response) => {
  try {
    const menus = await permissionService.getUserMenus(req.user!.id)
    res.json({ success: true, data: menus })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/roles', authenticate, async (req: Request, res: Response) => {
  try {
    const roles = await permissionService.getRoles()
    res.json({ success: true, data: roles })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/roles/:code', authenticate, async (req: Request, res: Response) => {
  try {
    const role = await permissionService.getRoleByCode(req.params.code as string)
    
    if (!role) {
      return res.status(404).json({ error: '角色不存在' })
    }
    
    res.json({ success: true, data: role })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/permissions', authenticate, async (req: Request, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions()
    res.json({ success: true, data: permissions })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/permissions/by-module', authenticate, async (req: Request, res: Response) => {
  try {
    const grouped = await permissionService.getPermissionsByModule()
    res.json({ success: true, data: grouped })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/roles', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const roleId = await permissionService.saveRole(req.body)
    res.json({ success: true, data: { id: roleId } })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/roles/:code', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await permissionService.saveRole({
      ...req.body,
      code: req.params.code
    })
    res.json({ success: true, message: '角色已更新' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/roles/:code/permissions', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { permissionCodes } = req.body
    await permissionService.assignPermissions(req.params.code as string, permissionCodes || [])
    res.json({ success: true, message: '权限分配成功' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/roles/:code/data-scopes', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { scopes } = req.body
    await permissionService.assignDataScopes(req.params.code as string, scopes || {})
    res.json({ success: true, message: '数据权限分配成功' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/roles/:code', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await permissionService.deleteRole(req.params.code as string)
    res.json({ success: true, message: '角色已删除' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/users/:userId/roles/:roleCode', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await permissionService.assignUserRole(req.params.userId as string, req.params.roleCode as string)
    res.json({ success: true, message: '角色分配成功' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/users/:userId/roles/:roleCode', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await permissionService.removeUserRole(req.params.userId as string, req.params.roleCode as string)
    res.json({ success: true, message: '角色已移除' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
