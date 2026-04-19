import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { AuditService } from '../services/AuditService.js';

function getAuditService(): AuditService {
  return container.resolve('AuditService');
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const operatorId = req.query.operatorId as string | undefined;
    const action = req.query.action as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await getAuditService().getAuditLogs({
      entityType,
      entityId,
      operatorId,
      action: action as any,
      startDate,
      endDate,
      page,
      pageSize
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await getAuditService().getAuditLogs({
      entityType,
      entityId,
      page,
      pageSize
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
