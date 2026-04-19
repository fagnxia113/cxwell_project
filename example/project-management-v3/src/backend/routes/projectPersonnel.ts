import { Router } from 'express';
import { prisma } from '../database/prisma.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import { personnelTransferService } from '../services/PersonnelTransferService.js';

const router = Router();

// 获取项目所有成员
router.get('/:projectId/personnel', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const personnel = await prisma.project_personnel.findMany({
      where: { project_id: projectId, on_duty_status: 'on_duty' }
    });

    if (personnel.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 手动关联员工信息，因为 Prisma Schema 中缺失了 project_personnel 到 employees 的关联关系
    const employeeIds = personnel.map(p => p.employee_id);
    const employees = await prisma.employees.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, position: true, phone: true }
    });

    const employeeMap = new Map(employees.map(e => [e.id, e]));

    const result = personnel.map(p => ({
      ...p,
      employee_name: employeeMap.get(p.employee_id)?.name || 'Unknown',
      position: employeeMap.get(p.employee_id)?.position || '--',
      phone: employeeMap.get(p.employee_id)?.phone || '--'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// 简单添加成员到项目
router.post('/:projectId/personnel/add', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { employeeId, roleInProject, transferInDate } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: '员工ID是必填项' });
    }

    // 调用调拨服务执行添加逻辑 (sourceProjectId 为 null 表示新加入)
    const result = await personnelTransferService.transferPersonnel(
      employeeId,
      null,
      projectId,
      transferInDate ? new Date(transferInDate) : new Date(),
      '手动添加至项目'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// 快速调拨成员
router.post('/:projectId/personnel/transfer', authenticate, async (req, res, next) => {
  try {
    const { projectId: sourceProjectId } = req.params;
    const { employeeId, targetProjectId, transferDate, remark } = req.body;

    if (!employeeId || !targetProjectId) {
      return res.status(400).json({ success: false, message: '员工ID和目标项目ID是必填项' });
    }

    const result = await personnelTransferService.transferPersonnel(
      employeeId,
      sourceProjectId,
      targetProjectId,
      transferDate ? new Date(transferDate) : new Date(),
      remark || '跨项目调拨'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// 移除成员 (退场)
router.post('/:projectId/personnel/:employeeId/remove', authenticate, async (req, res, next) => {
  try {
    const { projectId, employeeId } = req.params;
    const { transferOutDate, remark } = req.body;

    const result = await personnelTransferService.transferPersonnel(
      employeeId,
      projectId,
      null, // targetProjectId 为 null 表示退场回到资源池
      transferOutDate ? new Date(transferOutDate) : new Date(),
      remark || '项目退场'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
