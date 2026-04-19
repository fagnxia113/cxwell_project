import { Router, Request, Response } from 'express';
import { milestoneService } from '../services/MilestoneService.js';

const router = Router();

// 获取项目的里程碑
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const data = await milestoneService.getProjectMilestones(req.params.projectId as string);
    res.json({ success: true, data });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存项目的里程碑设定
router.post('/project/:projectId', async (req: Request, res: Response) => {
  try {
    await milestoneService.saveMilestones(req.params.projectId as string, req.body.milestones);
    res.json({ success: true, message: '里程碑设定保存成功' });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新里程碑进度
router.put('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { progress, status, actual_start_date, actualEndDate } = req.body;
    await milestoneService.updateMilestoneProgress(
      req.params.id as string,
      Number(progress),
      actualEndDate,
      status,
      actual_start_date
    );
    res.json({ success: true, message: '进度更新成功' });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新里程碑资源
router.post('/:id/resources', async (req: Request, res: Response) => {
  try {
    await milestoneService.saveResources(req.params.id as string, req.body.resources);
    res.json({ success: true, message: '资源信息保存成功' });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
