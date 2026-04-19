import { Router, Request, Response } from 'express';
import { projectExtensionService } from '../services/ProjectExtensionService.js';

const router = Router();

// --- Expenses ---
router.get('/:projectId/expenses', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.getProjectExpenses(req.params.projectId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/expenses', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.addProjectExpense(req.params.projectId as string, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/expenses/:id', async (req: Request, res: Response) => {
  try {
    await projectExtensionService.deleteProjectExpense(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Risks ---
router.get('/:projectId/risks', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.getProjectRisks(req.params.projectId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/risks', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.addProjectRisk(req.params.projectId as string, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/risks/:id', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.updateProjectRisk(req.params.id as string, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/risks/:id', async (req: Request, res: Response) => {
  try {
    await projectExtensionService.deleteProjectRisk(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Staffing Plans ---
router.get('/:projectId/staffing-plans', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.getProjectStaffingPlans(req.params.projectId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/staffing-plans', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.addStaffingPlan(req.params.projectId as string, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/staffing-plans/:id', async (req: Request, res: Response) => {
  try {
    await projectExtensionService.deleteStaffingPlan(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Personnel Permissions ---
router.get('/:projectId/personnel', async (req: Request, res: Response) => {
  try {
    const data = await projectExtensionService.getProjectPersonnel(req.params.projectId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:projectId/personnel/:employeeId/permission', async (req: Request, res: Response) => {
  try {
    const { canEdit } = req.body;
    await projectExtensionService.updatePersonnelPermission(req.params.projectId as string, req.params.employeeId as string, canEdit);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Unified Task Board ---
router.get('/task-board', async (req: any, res: Response) => {
  try {
    // 假设 middleware 已经把用户信息放到了 req.user
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const data = await projectExtensionService.getUnifiedTaskBoard(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
