import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { DepartmentUseCase } from '../application/DepartmentUseCase.js';
import { PositionUseCase } from '../application/PositionUseCase.js';
import { thirdPartyConfigService, syncLogService } from '../../../services/ThirdPartyService.js';
import { createWeChatWorkAdapter } from '../../../services/WeChatWorkAdapter.js';
import { validateBody, validateQuery, validateParams } from '../../../middleware/zodValidator.js';
import {
  departmentQuerySchema,
  departmentIdParamSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  positionQuerySchema,
  positionIdParamSchema,
  createPositionSchema,
  updatePositionSchema,
} from '../domain/OrganizationDTO.js';

function getDepartmentUseCase(): DepartmentUseCase {
  return container.resolve(DepartmentUseCase);
}

function getPositionUseCase(): PositionUseCase {
  return container.resolve(PositionUseCase);
}

const router = Router();

// --- Department Routes ---

router.get('/departments', validateQuery(departmentQuerySchema), async (req: Request, res: Response) => {
  try {
    const { parent_id, status, include_inactive, tree } = req.query;
    
    if (tree === 'true') {
      const departmentTree = await getDepartmentUseCase().getDepartmentTree();
      res.json({ success: true, data: departmentTree });
      return;
    }
    
    const departments = await getDepartmentUseCase().getDepartments({
      parent_id: parent_id as string,
      status: status as string
    });
    
    res.json({ success: true, data: departments.map(d => d.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/departments/:id', validateParams(departmentIdParamSchema), async (req: Request, res: Response) => {
  try {
    const department = await getDepartmentUseCase().getDepartmentById(req.params.id as string);
    if (!department) return res.status(404).json({ error: '部门不存在' });
    res.json({ success: true, data: department.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/departments', validateBody(createDepartmentSchema), async (req: Request, res: Response) => {
  try {
    const department = await getDepartmentUseCase().createDepartment(req.body);
    res.status(201).json({ success: true, data: department.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/departments/:id', validateParams(departmentIdParamSchema), validateBody(updateDepartmentSchema), async (req: Request, res: Response) => {
  try {
    const department = await getDepartmentUseCase().updateDepartment(req.params.id as string, req.body);
    res.json({ success: true, data: department.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/departments/:id', validateParams(departmentIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getDepartmentUseCase().deleteDepartment(req.params.id as string);
    res.json({ success: true, message: '部门删除成功' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/departments/:id/path', async (req: Request, res: Response) => {
  try {
    const path = await getDepartmentUseCase().getDepartmentPath(req.params.id as string);
    res.json({ success: true, data: path.map(p => p.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/departments/:id/children', async (req: Request, res: Response) => {
  try {
    const children = await getDepartmentUseCase().getAllChildren(req.params.id as string);
    res.json({ success: true, data: children.map(c => c.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Position Routes ---

router.get('/positions', validateQuery(positionQuerySchema), async (req: Request, res: Response) => {
  try {
    const { department_id, status, category } = req.query;
    const positions = await getPositionUseCase().getPositions({
      department_id: department_id as string,
      status: status as string,
      category: category as string
    });
    res.json({ success: true, data: positions.map(p => p.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/positions/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getPositionUseCase().getPositionCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/positions/:id', validateParams(positionIdParamSchema), async (req: Request, res: Response) => {
  try {
    const position = await getPositionUseCase().getPositionById(req.params.id as string);
    if (!position) return res.status(404).json({ error: '岗位不存在' });
    res.json({ success: true, data: position.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/positions', validateBody(createPositionSchema), async (req: Request, res: Response) => {
  try {
    const position = await getPositionUseCase().createPosition(req.body);
    res.status(201).json({ success: true, data: position.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/positions/:id', validateParams(positionIdParamSchema), validateBody(updatePositionSchema), async (req: Request, res: Response) => {
  try {
    const position = await getPositionUseCase().updatePosition(req.params.id as string, req.body);
    res.json({ success: true, data: position.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/positions/:id', validateParams(positionIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getPositionUseCase().deletePosition(req.params.id as string);
    res.json({ success: true, message: '岗位删除成功' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- Third-party Sync Routes ---

router.get('/third-party/configs', async (req: Request, res: Response) => {
  try {
    const configs = await thirdPartyConfigService.getConfigs(req.query as any);
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/third-party/configs/:id/sync', async (req: Request, res: Response) => {
  try {
    const { sync_type } = req.body;
    const config = await thirdPartyConfigService.getConfigById(req.params.id as string);
    if (!config || config.platform_type !== 'wechat_work') {
      return res.status(404).json({ error: '配置不存在或平台不支持' });
    }

    const adapter = createWeChatWorkAdapter(config);
    const log = await syncLogService.createLog({
      config_id: config.id,
      platform_type: config.platform_type,
      sync_type: sync_type || 'full',
      sync_mode: 'manual'
    });

    let result;
    if (sync_type === 'department' || sync_type === 'full') {
      result = await adapter.syncDepartments();
    } else {
      result = await adapter.syncEmployees();
    }

    await syncLogService.updateLog(log.id, {
      status: result.success ? 'success' : 'partial',
      total_count: result.total_count,
      success_count: result.success_count,
      failed_count: result.failed_count,
      created_count: result.created_count,
      updated_count: result.updated_count,
      end_time: new Date(),
      error_message: result.message
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/third-party/sync-logs', async (req: Request, res: Response) => {
  try {
    const logs = await syncLogService.getLogs(req.query as any);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
