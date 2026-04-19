import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { WarehouseUseCase } from '../application/WarehouseUseCase.js';
import { validateBody, validateQuery, validateParams } from '../../../middleware/zodValidator.js';
import {
  warehouseQuerySchema,
  warehouseIdParamSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseEquipmentQuerySchema,
} from '../domain/WarehouseDTO.js';

function getWarehouseUseCase(): WarehouseUseCase {
  return container.resolve(WarehouseUseCase);
}

const router = Router();

router.get('/active', async (req: Request, res: Response) => {
  try {
    const warehouses = await getWarehouseUseCase().getActiveWarehouses();
    res.json({ success: true, data: warehouses.map(w => w.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', validateQuery(warehouseQuerySchema), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const result = await getWarehouseUseCase().getWarehouses({ search, status, type, page, pageSize });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', validateParams(warehouseIdParamSchema), async (req: Request, res: Response) => {
  try {
    const warehouse = await getWarehouseUseCase().getWarehouseById(req.params.id as string);
    if (!warehouse) {
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }
    res.json({ success: true, data: warehouse.toJSON() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', validateBody(createWarehouseSchema), async (req: Request, res: Response) => {
  try {
    // The provided snippet for constructor injection seems misplaced here.
    // Constructor injection typically occurs within a class definition (e.g., WarehouseUseCase).
    // If this was intended for WarehouseUseCase, that file would need to be modified.
    // As per the instruction to make the change faithfully, and to keep the file syntactically correct,
    // I will assume the user intended to add the constructor to a class, but provided it in the wrong context.
    // Since I cannot modify the WarehouseUseCase class directly from this file,
    // and inserting it here would cause a syntax error, I will skip inserting the constructor directly
    // into this route handler.
    // However, if the intent was to add an import for IWarehouseRepository, that would be:
    // import { IWarehouseRepository } from '../interfaces/IWarehouseRepository';
    // But without a clear place to use it in this file, I will not add it.

    const warehouse = await getWarehouseUseCase().createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse.toJSON() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', validateParams(warehouseIdParamSchema), validateBody(updateWarehouseSchema), async (req: Request, res: Response) => {
  try {
    await getWarehouseUseCase().updateWarehouse(req.params.id as string, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', validateParams(warehouseIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getWarehouseUseCase().deleteWarehouse(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/equipment', validateParams(warehouseIdParamSchema), validateQuery(warehouseEquipmentQuerySchema), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;

    const result = await getWarehouseUseCase().getWarehouseEquipment(req.params.id as string, { search, page, pageSize });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/manager', validateParams(warehouseIdParamSchema), async (req: Request, res: Response) => {
  try {
    const manager = await getWarehouseUseCase().getWarehouseManager(req.params.id as string);
    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found' });
    }
    res.json({ success: true, data: manager });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
