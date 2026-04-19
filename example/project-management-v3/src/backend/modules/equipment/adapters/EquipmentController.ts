import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentUseCase } from '../application/EquipmentUseCase.js';
import { AccessoryUseCase } from '../application/AccessoryUseCase.js';
import { EquipmentInboundUseCase } from '../application/EquipmentInboundUseCase.js';
import { TransferUseCase } from '../application/TransferUseCase.js';
import { RepairUseCase } from '../application/RepairUseCase.js';
import { InboundOrderUseCase } from '../application/InboundOrderUseCase.js';
import { ScrapSaleUseCase } from '../application/ScrapSaleUseCase.js';
import { requireDataPermission } from '../../../middleware/dataPermissionMiddleware.js';
import { validateBody, validateQuery, validateParams } from '../../../middleware/zodValidator.js';
import {
  equipmentQuerySchema,
  equipmentIdParamSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentTransferSchema,
  equipmentInboundSchema,
  equipmentRepairSchema,
  repairQuerySchema,
  inboundQuerySchema,
  inboundExecutionSchema,
} from '../domain/EquipmentDTO.js';

const equipmentUploadDir = process.env.EQUIPMENT_IMAGE_DIR || path.join(process.cwd(), 'uploads', 'equipment-images');
import * as fs from 'fs';
if (!fs.existsSync(equipmentUploadDir)) {
  fs.mkdirSync(equipmentUploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, equipmentUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的图片格式。支持的格式: JPEG, PNG, GIF, WebP'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

function getEquipmentUseCase(): EquipmentUseCase {
  return container.resolve(EquipmentUseCase);
}

function getAccessoryUseCase(): AccessoryUseCase {
  return container.resolve(AccessoryUseCase);
}

function getInboundUseCase(): EquipmentInboundUseCase {
  return container.resolve(EquipmentInboundUseCase);
}

function getTransferUseCase(): TransferUseCase {
  return container.resolve(TransferUseCase);
}

function getRepairUseCase(): RepairUseCase {
  return container.resolve(RepairUseCase);
}


function getInboundOrderUseCase(): InboundOrderUseCase {
  return container.resolve(InboundOrderUseCase);
}

function getScrapSaleUseCase(): ScrapSaleUseCase {
  return container.resolve(ScrapSaleUseCase);
}

const router = Router();

router.get('/instances', validateQuery(equipmentQuerySchema), requireDataPermission('equipment'), async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, any>;
    const page = parseInt(String(query.page || '1')) || 1;
    const pageSize = parseInt(String(query.pageSize || '10')) || 10;
    const { model_id, location_id, status, search, location_status, category, health_status, usage_status, equipment_source, aggregated } = query;

    const useAggregated = aggregated !== 'false';

    const result = await getEquipmentUseCase().getInstances({
      model_id: model_id ? String(model_id) : undefined,
      location_id: location_id ? String(location_id) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      location_status: location_status ? String(location_status) : undefined,
      category: category ? String(category) : undefined,
      health_status: health_status ? String(health_status) : undefined,
      usage_status: usage_status ? String(usage_status) : undefined,
      equipment_source: equipment_source ? String(equipment_source) : undefined,
      merge: useAggregated,
      page,
      pageSize,
      dataScope: req.dataScope
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/v3/equipment/archives', requireDataPermission('equipment'), async (req: Request, res: Response) => {
  try {
    const query = req.query as any;
    const result = await getEquipmentUseCase().getArchives({
      page: parseInt(query.page || '1'),
      pageSize: parseInt(query.pageSize || '15'),
      keyword: query.keyword,
      status: query.status,
      dataScope: req.dataScope
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scrap-sales', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || 'System';
    const result = await getScrapSaleUseCase().createOrder(req.body, userId, userName);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scrap-sales/:id', async (req: Request, res: Response) => {
  try {
    const result = await getScrapSaleUseCase().getOrderDetail(req.params.id as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scrap-list', requireDataPermission('equipment'), async (req: Request, res: Response) => {
  try {
    const { page, pageSize, startDate, endDate, type } = req.query;
    const result = await getScrapSaleUseCase().getScrapList({
      page: page ? parseInt(String(page)) : 1,
      pageSize: pageSize ? parseInt(String(pageSize)) : 20,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      type: type as 'scrap' | 'sale' | undefined,
      dataScope: req.dataScope
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/instances/by-location', requireDataPermission('equipment'), async (req: Request, res: Response) => {
  try {
    const { originalLocationType, originalLocationId, location_type, location_id, search, page = '1', pageSize = '50' } = req.query;
    const locType = originalLocationType || location_type;
    const locId = originalLocationId || location_id;
    if (!locType || !locId) {
      return res.json({ success: true, data: [], total: 0 });
    }
    const pageNum = parseInt(String(page)) || 1;
    const pageSizeNum = parseInt(String(pageSize)) || 50;
    const searchStr = search ? String(search) : undefined;
    const result = await getEquipmentUseCase().getInstances({
      location_id: String(locId),
      location_status: locType === 'warehouse' ? 'warehouse' : 'in_project',
      search: searchStr,
      page: pageNum,
      pageSize: pageSizeNum,
      merge: false,
      dataScope: req.dataScope
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/instances/:id', async (req: Request, res: Response) => {
  try {
    const instance = await getEquipmentUseCase().getInstanceById((req.params as any).id as any as any);
    if (!instance) return res.status(404).json({ success: false, error: 'Instance not found' });
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/instances', validateBody(createEquipmentSchema), async (req: Request, res: Response) => {
  try {
    const instance = await getEquipmentUseCase().createEquipment(req.body);
    res.status(201).json({ success: true, data: instance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/instances/:id', async (req: Request, res: Response) => {
  try {
    await getEquipmentUseCase().updateEquipmentStatus((req.params as any).id as any as any, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/instances/:id', validateParams(equipmentIdParamSchema), validateBody(updateEquipmentSchema), async (req: Request, res: Response) => {
  try {
    const { version, ...data } = req.body;
    const instance = await getEquipmentUseCase().updateEquipment((req.params as any).id as any, data, Number(version || 0));
    if (!instance) return res.status(404).json({ success: false, error: 'Instance not found' });
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/instances/:id', validateParams(equipmentIdParamSchema), async (req: Request, res: Response) => {
  try {
    await getEquipmentUseCase().deleteEquipment((req.params as any).id as any as any);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/v3/manage-code/check', async (req: Request, res: Response) => {
  try {
    const code = (req.query as any).code as any;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    const isUnique = await getEquipmentUseCase().checkManageCodeUnique(code);
    res.json({ success: true, unique: isUnique });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stock-distribution', async (req: Request, res: Response) => {
  try {
    const equipmentName = (req.query as any).equipment_name as any;
    const modelNo = (req.query as any).model_no as any;

    if (!equipmentName || !modelNo) {
      return res.status(400).json({ success: false, error: 'equipment_name and model_no are required' });
    }

    const distribution = await getEquipmentUseCase().getStockDistribution(equipmentName, modelNo);
    res.json({ success: true, data: distribution });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await getEquipmentUseCase().getStatistics();
    res.json({ success: true, data: statistics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const q = req.query as any;
    const locationId = q.locationId as string;
    const category = q.category as string;
    
    // Check if we are asking for accessories (either standalone or grouped)
    if (category === 'accessory' || category === '配件' || category === '独立配件') {
      const result = await getAccessoryUseCase().getAllAccessories({
        location_id: locationId,
        bound: false,
        page: 1,
        pageSize: 1000
      });
      // Flatten/Map to the expected equipment summary format
      const mapped = result.data.map((acc: any) => ({
        id: acc.id,
        equipment_name: acc.accessory_name,
        model_no: acc.model_no || acc.modelNo || '',
        manage_code: acc.manage_code || '',
        category: 'accessory',
        manufacturer: acc.manufacturer,
        unit: acc.unit || '台',
        quantity: acc.quantity,
        total_quantity: acc.quantity,
        available_quantity: (acc.usage_status === 'idle' || acc.usage_status === 'IDLE' || !acc.usage_status) ? acc.quantity : 0,
        main_image: acc.main_image || null,
        is_accessory: true, // IMPORTANT: Mark as accessory for transfer logic
        accessories: [] // Standalone accessories themselves have no bound children
      }));
      return res.json({ success: true, data: mapped });
    }

    const result = await getEquipmentUseCase().getInstances({
      location_id: locationId,
      category: (category && category !== 'all') ? category : undefined,
      merge: true,
      page: 1,
      pageSize: 1000
    });
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/names', async (req: Request, res: Response) => {
  try {
    const category = (req.query as any).category as any;
    const names = await getEquipmentUseCase().getEquipmentNames(category);
    res.json({ success: true, data: names });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const equipmentName = (req.query as any).equipment_name as any;
    const category = (req.query as any).category as any;

    if (equipmentName) {
      const models = await getEquipmentUseCase().getModelsByName(equipmentName);
      res.json({ success: true, data: models });
    } else if (category) {
      const models = await getEquipmentUseCase().getModelsByCategory(category);
      res.json({ success: true, data: models });
    } else {
      const models = await getEquipmentUseCase().getAllModels();
      res.json({ success: true, data: models });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/images/equipment/:equipmentId', async (req: Request, res: Response) => {
  try {
    const images = await getEquipmentUseCase().getImagesByEquipmentId((req.params as any).equipmentId);
    res.json({ success: true, data: images });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/images/:imageId', async (req: Request, res: Response) => {
  try {
    const deleted = await getEquipmentUseCase().deleteImage((req.params as any).imageId);
    if (deleted) {
      res.json({ success: true, message: '图片删除成功' });
    } else {
      res.status(404).json({ success: false, error: '图片不存在或删除失败' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/images/upload', uploadImage.single('image'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有上传图片文件' });
    }

    const userId = (req as any).user?.id || 'anonymous';
    const userName = (req as any).user?.name || '匿名用户';
    const imageUrl = `/uploads/equipment-images/${req.file.filename}`;

    const imageId = uuidv4();
    const { prisma } = await import('../../../database/prisma.js');

    await prisma.equipment_images.create({
      data: {
        id: imageId,
        equipment_id: req.body.equipment_id || null,
        equipment_name: req.body.equipment_name || null,
        model_no: req.body.model_no || null,
        category: req.body.category || null,
        image_type: req.body.image_type || 'main',
        image_url: imageUrl,
        image_name: req.file.originalname,
        image_size: req.file.size,
        image_format: req.file.mimetype,
        business_type: req.body.business_type || null,
        business_id: req.body.business_id || null,
        uploader_id: userId,
        uploader_name: userName,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    const imageData = {
      id: imageId,
      image_url: imageUrl,
      image_name: req.file.originalname,
      image_type: req.body.image_type || 'main'
    };

    res.json({ success: true, data: imageData });
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/images/accessory/:accessoryId', async (req: Request, res: Response) => {
  try {
    const images = await getAccessoryUseCase().getImagesByAccessoryId((req.params as any).accessoryId);
    res.json({ success: true, data: images });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/accessories/images/:imageId', async (req: Request, res: Response) => {
  try {
    const deleted = await getAccessoryUseCase().deleteImage((req.params as any).imageId);
    if (deleted) {
      res.json({ success: true, message: '图片删除成功' });
    } else {
      res.status(404).json({ success: false, error: '图片不存在或删除失败' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accessories', async (req: Request, res: Response) => {
  try {
    const { category, status, location_status, bound, keyword, page, pageSize } = req.query;

    const result = await getAccessoryUseCase().getAllAccessories({
      category: category as any,
      status: status as any,
      location_status: location_status as any,
      bound: bound !== undefined ? (bound === 'true' ? true : (bound === 'false' ? false : undefined)) : undefined,
      keyword: keyword as any,
      location_id: (req.query as any).location_id as any,
      page: page ? parseInt(page as any) : 1,
      pageSize: pageSize ? parseInt(pageSize as any) : 20
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Accessory Candidate Routes (Must be before parameterized :id) ---
router.get('/accessories/names', async (req: Request, res: Response) => {
  try {
    const names = await getAccessoryUseCase().getAccessoryNames();
    res.json({ success: true, data: names });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accessories/models', async (req: Request, res: Response) => {
  try {
    const q = req.query as any;
    const name = q.accessory_name || q.equipment_name || q.name as string;
    const models = await getAccessoryUseCase().getAccessoryModelsByName(name);
    res.json({ success: true, data: models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accessories/unbound', async (req: Request, res: Response) => {
  try {
    const { category, status, keyword } = req.query;

    const accessories = await getAccessoryUseCase().getUnboundAccessories({
      category: category as any,
      status: status as any,
      keyword: keyword as any
    });

    res.json({ success: true, data: accessories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accessories/:id', async (req: Request, res: Response) => {
  try {
    const accessory = await getAccessoryUseCase().getAccessoryById((req.params as any).id as any);
    if (!accessory) {
      return res.status(404).json({ success: false, error: '配件不存在' });
    }
    res.json({ success: true, data: accessory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accessories', async (req: Request, res: Response) => {
  try {
    const dto = req.body;
    const accessory = await getAccessoryUseCase().createAccessoryInstance(dto);
    res.json({ success: true, data: accessory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/accessories/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const result = await getAccessoryUseCase().updateAccessoryInstance((req.params as any).id as any, updates);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/accessories/:id', async (req: Request, res: Response) => {
  try {
    const result = await getAccessoryUseCase().deleteAccessoryInstance((req.params as any).id as any);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accessories/:id/bind', async (req: Request, res: Response) => {
  try {
    const { host_equipment_id, quantity } = req.body;
    const result = await getAccessoryUseCase().bindAccessoryToEquipment(
      (req.params as any).id as any,
      host_equipment_id,
      quantity || 1
    );
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accessories/:id/bind-to-host', async (req: Request, res: Response) => {
  try {
    const { host_equipment_id, quantity } = req.body;
    const result = await getAccessoryUseCase().splitAndBindAccessory(
      (req.params as any).id as any,
      host_equipment_id,
      quantity
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/accessories/:id/unbind', async (req: Request, res: Response) => {
  try {
    const { host_equipment_id, equipment_id, quantity } = req.body;
    const result = await getAccessoryUseCase().unbindAccessoryFromEquipment(
      (req.params as any).id as any,
      host_equipment_id || equipment_id,
      quantity || 1
    );
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accessories/:id/mark-lost', async (req: Request, res: Response) => {
  try {
    const { operator_id, operator_name, reason, equipment_id, transfer_order_id } = req.body;
    const result = await getAccessoryUseCase().markAccessoryLost(
      (req.params as any).id as any,
      operator_id,
      operator_name,
      reason,
      equipment_id,
      transfer_order_id
    );
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accessories/:id/recover', async (req: Request, res: Response) => {
  try {
    const { operator_id, operator_name, notes } = req.body;
    const result = await getAccessoryUseCase().recoverAccessory(
      (req.params as any).id as any,
      operator_id,
      operator_name,
      notes
    );
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accessories/:id/lost-records', async (req: Request, res: Response) => {
  try {
    const records = await getAccessoryUseCase().getLostRecords((req.params as any).id as any);
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.get('/instances/:id/accessories', async (req: Request, res: Response) => {
  try {
    const accessories = await getAccessoryUseCase().getAccessoriesWithDetails((req.params as any).id as any);
    res.json({ success: true, data: accessories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transfers', validateBody(equipmentTransferSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || '系统';
    const order = await getTransferUseCase().createOrder(req.body, userId, userName);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any).page as any) || 1;
    const pageSize = parseInt((req.query as any).pageSize as any) || 20;
    const { status, from_warehouse_id, from_project_id, to_warehouse_id, to_project_id, applicant_id, search } = req.query;

    const result = await getTransferUseCase().getList({
      status: status as any,
      from_warehouse_id: from_warehouse_id as any,
      from_project_id: from_project_id as any,
      to_warehouse_id: to_warehouse_id as any,
      to_project_id: to_project_id as any,
      applicant_id: applicant_id as any,
      search: search as any,
      page,
      pageSize
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transfers/:id', async (req: Request, res: Response) => {
  try {
    const order = await getTransferUseCase().getById((req.params as any).id as any);
    if (!order) {
      return res.status(404).json({ success: false, error: '调拨单不存在' });
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/submit', async (req: Request, res: Response) => {
  try {
    await getTransferUseCase().submitOrder((req.params as any).id as any);
    res.json({ success: true, message: '提交成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || '系统';
    const { approved, remark } = req.body;

    await getTransferUseCase().approveOrder((req.params as any).id as any, userId, userName, approved, remark);
    res.json({ success: true, message: '操作完成' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/ship', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const { shipped_at, shipping_no, shipping_attachment, item_images, package_images } = req.body;

    const order = await getTransferUseCase().confirmShipping((req.params as any).id as any, {
      shipping_no,
      shipped_by: userId,
      shipped_at,
      shipping_attachment,
      item_images,
      package_images
    });

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('[Transfer Ship] 发货失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/receive', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const { receive_status, receive_comment, item_images, package_images, received_items, received_at } = req.body;

    const success = await getTransferUseCase().confirmReceiving((req.params as any).id as any, {
      received_by: userId,
      received_at,
      receive_status,
      receive_comment,
      package_images,
      received_items
    });

    res.json({ success, message: success ? '收货成功' : '收货失败' });
  } catch (error: any) {
    console.error('[EquipmentController /receive] 收货失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/return-to-shipping', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const { return_comment } = req.body;

    const success = await getTransferUseCase().returnToShipping((req.params as any).id as any, userId, return_comment);
    res.json({ success, message: success ? '回退成功' : '回退失败' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/transfers/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const order = await getTransferUseCase().cancelOrder((req.params as any).id as any);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/repairs', validateBody(equipmentRepairSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || '系统';
    const order = await getRepairUseCase().createRepairOrder(req.body, userId, userName);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/repairs', validateQuery(repairQuerySchema), async (req: Request, res: Response) => {
  try {
    const { status, page, pageSize } = req.query;

    const result = await getRepairUseCase().getList({
      status: status as any,
      page: page ? parseInt(page as any) : 1,
      pageSize: pageSize ? parseInt(pageSize as any) : 10
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/repairs/:id', async (req: Request, res: Response) => {
  try {
    const order = await getRepairUseCase().getById((req.params as any).id as any);
    if (!order) {
      return res.status(404).json({ success: false, error: '维修单不存在' });
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/repairs/:id/ship', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const { shipping_no, shipped_at, shipping_remark, item_images, package_images } = req.body;
    
    const result = await getRepairUseCase().shipRepairOrder(
      (req.params as any).id as any, 
      userId,
      {
        shipping_no,
        shipped_at,
        shipping_remark,
        item_images,
        package_images
      }
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Repair Ship] 发货失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/repairs/:id/receive', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const result = await getRepairUseCase().receiveRepairOrder((req.params as any).id as any, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Inbound Routes
router.post('/inbounds', validateBody(equipmentInboundSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || '系统';
    const order = await getInboundOrderUseCase().createOrder(req.body, userId, userName);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/inbounds', validateQuery(inboundQuerySchema), async (req: Request, res: Response) => {
  try {
    const { status, warehouse_id, equipment_id, page, pageSize } = req.query;
    const result = await getInboundOrderUseCase().getList({
      status: status as any,
      warehouse_id: warehouse_id as any,
      equipment_id: equipment_id as any,
      page: page ? parseInt(page as any) : 1,
      pageSize: pageSize ? parseInt(pageSize as any) : 20
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/inbounds/:id', async (req: Request, res: Response) => {
  try {
    const order = await getInboundOrderUseCase().getById((req.params as any).id as any);
    if (!order) return res.status(404).json({ success: false, error: '入库单不存在' });
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/inbounds/:id/submit', async (req: Request, res: Response) => {
  try {
    const order = await getInboundOrderUseCase().submitOrder((req.params as any).id as any);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/inbounds/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const userName = (req as any).user?.name || '系统';
    const { approved, remark } = req.body;
    if (approved) {
      await getInboundOrderUseCase().approveOrder((req.params as any).id as any, userId, userName, remark);
    } else {
      await getInboundOrderUseCase().rejectOrder((req.params as any).id as any, userId, userName, remark);
    }
    res.json({ success: true, message: '操作完成' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/inbounds/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const order = await getInboundOrderUseCase().cancelOrder((req.params as any).id as any, reason);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inbound-execution', validateBody(inboundExecutionSchema), async (req: Request, res: Response) => {
  try {
    const result = await getInboundUseCase().executeInbound(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inbound-accessory-execution', async (req: Request, res: Response) => {
  try {
    const result = await getInboundUseCase().executeAccessoryInbound(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate, page = '1', pageSize = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    
    const result = await getEquipmentUseCase().getEquipmentHistory({
      type: type as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: pageNum,
      pageSize: pageSizeNum
    });
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
