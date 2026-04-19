import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { ProjectUseCase } from '../application/ProjectUseCase.js';
import { TaskUseCase } from '../application/TaskUseCase.js';
import { validateBody, validateQuery, validateParams } from '../../../middleware/zodValidator.js';
import { requireDataPermission } from '../../../middleware/dataPermissionMiddleware.js';
import {
  projectQuerySchema,
  projectIdParamSchema,
  createProjectSchema,
  updateProjectSchema,
  taskQuerySchema,
  taskIdParamSchema,
  createTaskSchema,
  updateTaskSchema,
} from '../domain/ProjectDTO.js';

function getProjectUseCase(): ProjectUseCase {
  return container.resolve(ProjectUseCase);
}

function getTaskUseCase(): TaskUseCase {
  return container.resolve(TaskUseCase);
}

const router = Router();

router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await getProjectUseCase().getProjectStatistics();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Project API ---

router.get('/', validateQuery(projectQuerySchema), requireDataPermission('project'), async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any).page as string) || 1;
    const pageSize = parseInt((req.query as any).pageSize as string) || 10;
    const { status, manager_id, search } = req.query;

    console.log('[DEBUG ProjectList] user:', req.user?.id, 'dataScope:', JSON.stringify(req.dataScope));

    const result = await getProjectUseCase().getProjects({
      status: status as string,
      manager_id: manager_id as string,
      search: search as string,
      page,
      pageSize,
      dataScope: req.dataScope
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', validateParams(projectIdParamSchema), async (req: Request, res: Response) => {
  try {
    const project = await getProjectUseCase().getProjectById((req.params as any).id);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', validateBody(createProjectSchema), async (req: Request, res: Response) => {
  try {
    const project = await getProjectUseCase().createProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', validateParams(projectIdParamSchema), validateBody(updateProjectSchema), async (req: Request, res: Response) => {
  try {
    const project = await getProjectUseCase().updateProject((req.params as any).id, req.body);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', validateParams(projectIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getProjectUseCase().deleteProject((req.params as any).id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/manager', validateParams(projectIdParamSchema), async (req: Request, res: Response) => {
  try {
    const manager = await getProjectUseCase().getProjectManager((req.params as any).id);
    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found' });
    }
    res.json({ success: true, data: manager });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Task / WBS API ---

router.get('/:id/tasks', validateParams(projectIdParamSchema), validateQuery(taskQuerySchema), async (req: Request, res: Response) => {
  try {
    const tasks = await getTaskUseCase().getTasksByProject((req.params as any).id);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Alias for getting WBS structure
router.get('/:id/structure', validateParams(projectIdParamSchema), async (req: Request, res: Response) => {
  try {
    const tasks = await getTaskUseCase().getTasksByProject((req.params as any).id);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/tasks', validateParams(projectIdParamSchema), validateBody(createTaskSchema), async (req: Request, res: Response) => {
  try {
    const task = await getTaskUseCase().createTask({
      projectId: (req.params as any).id,
      ...req.body
    });
    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/tasks/:taskId/progress', async (req: Request, res: Response) => {
  try {
    const { progress } = req.body;
    const task = await getTaskUseCase().updateTaskProgress((req.params as any).taskId, progress);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    await getTaskUseCase().deleteTask((req.params as any).taskId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


export default router;
