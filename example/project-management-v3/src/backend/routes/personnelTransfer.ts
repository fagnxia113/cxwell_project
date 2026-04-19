import { Router } from 'express';
import { personnelTransferService } from '../services/PersonnelTransferService.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// 获取调拨历史
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const history = await personnelTransferService.getTransferHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

// 发起人员调拨 (仅管理员或HR等)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { employeeId, sourceProjectId, targetProjectId, transferDate, remark } = req.body;
    
    if (!employeeId || !transferDate) {
      return res.status(400).json({ success: false, message: '员工ID和调拨日期是必填项' });
    }

    const result = await personnelTransferService.transferPersonnel(
      employeeId,
      sourceProjectId,
      targetProjectId,
      new Date(transferDate),
      remark
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
