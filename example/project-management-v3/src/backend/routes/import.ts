import express from 'express';
import multer from 'multer';
import { excelImportService } from '../services/ExcelImportService.js';
import { excelExportService } from '../services/ExcelExportService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.xls', '.xlsx'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 Excel 文件 (.xls, .xlsx)'), false);
    }
  }
});

router.post('/projects', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' });
    }

    const rows = excelImportService.parseExcelFile(req.file.buffer);
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' });
    }

    const result = excelImportService.importProjects(rows);

    if (result.data && result.data.length > 0) {
      for (const project of result.data) {
        await prisma.projects.create({
          data: {
            id: project.id,
            code: project.code || project.id,
            name: project.name,
            type: project.type,
            country: project.country,
            start_date: new Date(project.start_date),
            end_date: project.end_date ? new Date(project.end_date) : null,
            description: project.description,
            status: project.status
          }
        });
      }
    }

    res.json({
      success: result.success,
      message: `成功导入 ${result.succeeded} 条项目数据${result.failed > 0 ? `，${result.failed} 条失败` : ''}`,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error: any) {
    console.error('[Import] 项目导入失败:', error);
    res.status(500).json({ success: false, error: error.message || '导入失败' });
  }
});

router.post('/equipment', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' });
    }

    const rows = excelImportService.parseExcelFile(req.file.buffer);
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' });
    }

    const result = excelImportService.importEquipment(rows);

    if (result.data && result.data.length > 0) {
      for (const equipment of result.data) {
        let warehouseId = null;
        if (equipment.warehouse_name) {
          const warehouse = await prisma.warehouses.findFirst({
            where: { name: equipment.warehouse_name }
          });
          warehouseId = warehouse?.id;
        }

        await prisma.equipment_instances.create({
          data: {
            id: equipment.id,
            equipment_name: equipment.name,
            manage_code: equipment.equipment_no || equipment.id,
            model_no: equipment.model_no,
            category: equipment.category,
            brand: equipment.brand,
            quantity: equipment.quantity,
            unit: equipment.unit,
            location_id: warehouseId,
            health_status: 'excellent' as any,
            usage_status: 'idle' as any,
            notes: equipment.notes
          }
        });
      }
    }

    res.json({
      success: result.success,
      message: `成功导入 ${result.succeeded} 条设备数据${result.failed > 0 ? `，${result.failed} 条失败` : ''}`,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error: any) {
    console.error('[Import] 设备导入失败:', error);
    res.status(500).json({ success: false, error: error.message || '导入失败' });
  }
});

router.get('/template/projects', (req, res) => {
  try {
    const buffer = excelImportService.generateProjectTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=project-import-template.xlsx');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: '生成模板失败' });
  }
});

router.get('/template/equipment', (req, res) => {
  try {
    const buffer = excelImportService.generateEquipmentTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=equipment-import-template.xlsx');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: '生成模板失败' });
  }
});

router.post('/accessories', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' });
    }

    const rows = excelImportService.parseExcelFile(req.file.buffer);
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' });
    }

    const result = excelImportService.importAccessories(rows);

    if (result.data && result.data.length > 0) {
      for (const accessory of result.data) {
        await prisma.equipment_accessory_instances.create({
          data: {
            id: accessory.id,
            accessory_name: accessory.accessory_name,
            model_no: accessory.model_no,
            category: accessory.category,
            brand: accessory.brand,
            quantity: accessory.quantity,
            unit: accessory.unit,
            serial_number: accessory.serial_number,
            manage_code: accessory.manage_code,
            purchase_date: accessory.purchase_date ? new Date(accessory.purchase_date) : null,
            purchase_price: accessory.purchase_price,
            supplier: accessory.supplier,
            health_status: accessory.health_status,
            usage_status: accessory.usage_status,
            location_status: accessory.location_status,
            source_type: accessory.source_type,
            notes: accessory.notes,
            tracking_type: accessory.tracking_type,
            status: accessory.status
          }
        });
      }
    }

    res.json({
      success: result.success,
      message: `成功导入 ${result.succeeded} 条配件数据${result.failed > 0 ? `，${result.failed} 条失败` : ''}`,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error: any) {
    console.error('[Import] 配件导入失败:', error);
    res.status(500).json({ success: false, error: error.message || '导入失败' });
  }
});

router.get('/template/accessories', (req, res) => {
  try {
    const buffer = excelImportService.generateAccessoryTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=accessory-import-template.xlsx');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: '生成模板失败' });
  }
});

// ==================== 导出功能 ====================

router.get('/export/projects', async (req, res) => {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    const buffer = excelExportService.exportProjects(projects);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=projects-export.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('[Export] 项目导出失败:', error);
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

router.get('/export/equipment', async (req, res) => {
  try {
    const equipment = await prisma.equipment_instances.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    const buffer = excelExportService.exportEquipment(equipment);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=equipment-export.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('[Export] 设备导出失败:', error);
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

router.get('/export/accessories', async (req, res) => {
  try {
    const accessories = await prisma.equipment_accessory_instances.findMany({
      include: {
        equipment_instances: { select: { equipment_name: true } },
        employees: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    
    const formattedData = accessories.map(a => ({
      ...a,
      host_equipment_name: a.equipment_instances?.equipment_name,
      keeper_name: a.employees?.name
    }));
    
    const buffer = excelExportService.exportAccessories(formattedData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=accessories-export.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('[Export] 配件导出失败:', error);
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

export default router;
