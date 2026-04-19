import { Router } from 'express'
import dataRouter from './data.js'
import metadataRouter from './metadata.js'
import workflowRouter from './workflow.js'
import workflowAdminRouter from './workflowAdmin.js'
import enhancedWorkflowRouter from './enhancedWorkflowRoutes.js'
import authRouter from './auth.js'
import organizationDddRouter from '../modules/organization/adapters/OrganizationController.js'
import adminRouter from './admin.js'
import healthRouter from './health.js'
import performanceRoutes from './performanceRoutes.js'
import formTemplateRoutes from './formTemplateRoutes.js'
import equipmentDddRouter from '../modules/equipment/adapters/EquipmentController.js'
import warehouseDddRouter from '../modules/warehouse/adapters/WarehouseController.js'
import personnelDddRouter from '../modules/personnel/adapters/EmployeeController.js'
import projectDddRouter from '../modules/project/adapters/ProjectController.js'
import customerDddRouter from '../modules/customer/adapters/CustomerController.js'
import knowledgeDddRouter from '../modules/knowledge/adapters/KnowledgeController.js'
import workTimeRouter from './work-time.js'
import notificationsRouter from './notifications.js'
import permissionsRouter from './permissions.js'
import processFormsRouter from './process-forms.js'
import uploadRouter from './upload.js'
import auditRouter from './audit.js'
import draftRouter from './draft.js'
import importRouter from './import.js'
import milestoneRouter from './milestones.js'
import reportsRouter from './reports.js'
import personnelTransferRouter from './personnelTransfer.js'
import rotationRouter from './rotation.js'
import projectPersonnelRouter from './projectPersonnel.js'

import systemConfigRouter from './systemConfig.js'
import projectExtensionsRouter from './projectExtensions.js'
import { attendanceService } from '../services/AttendanceService.js'
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js'


const router = Router()

// 1. 公开路由 (无需认证)
router.use('/auth', authRouter)
router.use('/health', healthRouter)

// 2. 认证守卫 (后续所有路由均需登录)
router.use(authenticate)

// 3. 基础业务与元数据
router.use('/data', dataRouter)
router.use('/metadata', metadataRouter)

// 4. 流程相关 (顺序很重要，具体路径在前，通用路径在后)
router.use('/workflow/v2', enhancedWorkflowRouter)
router.use('/workflow/form-presets', processFormsRouter)
router.use('/workflow/performance', performanceRoutes)
router.use('/workflow/form-templates', formTemplateRoutes)
router.use('/workflow', workflowAdminRouter)
router.use('/workflow', workflowRouter)

// 5. 系统管理与辅助
router.use('/admin', adminRouter)
router.use('/permissions', permissionsRouter)
router.use('/audit', auditRouter)
router.use('/upload', uploadRouter)
router.use('/import', importRouter)
router.use('/draft', draftRouter)

// 6. 业务模块 (DDD)
router.use('/organization', organizationDddRouter)
router.use('/personnel/employees', personnelDddRouter)
router.use('/projects', projectDddRouter)
router.use('/customers', customerDddRouter)
router.use('/projects/extensions', projectExtensionsRouter)
router.use('/equipment', equipmentDddRouter)
router.use('/stock', equipmentDddRouter)

router.use('/warehouses', warehouseDddRouter)
router.use('/knowledge', knowledgeDddRouter)
router.use('/work-time', workTimeRouter)
router.use('/milestones', milestoneRouter)
router.use('/reports', reportsRouter)
router.use('/notifications', notificationsRouter)
router.use('/personnel/transfer', personnelTransferRouter)
router.use('/personnel/rotation', rotationRouter)
router.use('/projects/personnel-mgmt', projectPersonnelRouter)

router.use('/system-config', systemConfigRouter)

// 出勤看板与提醒
router.get('/personnel/attendance/board', authenticate, async (req, res) => {
  try {
    const board = await attendanceService.getDailyAttendanceBoard();
    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/personnel/attendance/remind', authenticate, async (req, res) => {
  try {
    const count = await attendanceService.sendDailyReportReminders();
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router