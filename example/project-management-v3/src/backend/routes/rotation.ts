import { Router, Request, Response } from 'express';
import { personnelRotationService } from '../services/PersonnelRotationService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { permissionService } from '../services/PermissionService.js';

const router = Router();

// 获取个人月度报备
router.get('/plan/:employeeId/:yearMonth', authenticate, async (req: Request, res: Response) => {
  try {
    const { employeeId, yearMonth } = req.params;
    const plan = await personnelRotationService.getEmployeeSchedule(employeeId as string, yearMonth as string);
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 提交/更新月度报备
router.post('/plan/:employeeId/:yearMonth', authenticate, async (req: Request, res: Response) => {
  try {
    const { employeeId, yearMonth } = req.params;
    const { segments } = req.body;
    
    if (!segments || !Array.isArray(segments)) {
      return res.status(400).json({ success: false, error: 'Invalid segments data' });
    }

    const result = await personnelRotationService.saveMonthlySchedule(employeeId as string, yearMonth as string, segments);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目的预计出勤一览表数据 (PM视角)
router.get('/project-report/:projectId/:yearMonth', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, yearMonth } = req.params;
    const userId = req.user?.id;

    // 检查用户是否有权查看该项目的数据
    const { isAdmin } = await permissionService.getUserPermissions(userId!);
    if (!isAdmin) {
      const hasAccess = await permissionService.canAccessProject(userId!, projectId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: '无权访问此项目的数据' });
      }
    }

    const data = await personnelRotationService.getProjectExpectedAttendance(projectId as string, yearMonth as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
