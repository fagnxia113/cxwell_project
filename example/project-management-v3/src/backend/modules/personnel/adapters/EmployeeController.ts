import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { EmployeeUseCase } from '../application/EmployeeUseCase.js';
import { requireDataPermission } from '../../../middleware/dataPermissionMiddleware.js';
import { validateBody, validateQuery, validateParams } from '../../../middleware/zodValidator.js';
import {
  employeeQuerySchema,
  employeeIdParamSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../domain/EmployeeDTO.js';

function getEmployeeUseCase(): EmployeeUseCase {
  return container.resolve(EmployeeUseCase);
}

const router = Router();

router.get('/', validateQuery(employeeQuerySchema), requireDataPermission('employee'), async (req: Request, res: Response) => {
  try {
    const { search, status, department_id, role, page, pageSize } = req.query;
    
    const result = await getEmployeeUseCase().getEmployees({
      search: search as string,
      status: status as string,
      department_id: department_id as string,
      role: role as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 100,
      dataScope: req.dataScope
    });
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/active', async (req: Request, res: Response) => {
  try {
    const employees = await getEmployeeUseCase().getActiveEmployees();
    res.json({ success: true, data: employees.map(e => e.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', validateParams(employeeIdParamSchema), async (req: Request, res: Response) => {
  try {
    const employee = await getEmployeeUseCase().getEmployeeById((req.params as any).id);
    
    if (!employee) {
      return res.status(404).json({ error: '员工不存在' });
    }
    
    res.json({ success: true, data: employee.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/user-id', validateParams(employeeIdParamSchema), async (req: Request, res: Response) => {
  try {
    const employee = await getEmployeeUseCase().getEmployeeById((req.params as any).id);
    
    if (!employee) {
      return res.status(404).json({ error: '员工不存在' });
    }
    
    if (!employee.userId) {
      return res.status(404).json({ error: '该员工没有关联的用户账号' });
    }
    
    res.json({ success: true, data: { userId: employee.userId } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', validateBody(createEmployeeSchema), async (req: Request, res: Response) => {
  try {
    const employee = await getEmployeeUseCase().createEmployee(req.body);
    res.status(201).json({ success: true, data: employee.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', validateParams(employeeIdParamSchema), validateBody(updateEmployeeSchema), async (req: Request, res: Response) => {
  try {
    const employee = await getEmployeeUseCase().updateEmployee((req.params as any).id, req.body);
    res.json({ success: true, data: employee.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', validateParams(employeeIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getEmployeeUseCase().deleteEmployee((req.params as any).id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
