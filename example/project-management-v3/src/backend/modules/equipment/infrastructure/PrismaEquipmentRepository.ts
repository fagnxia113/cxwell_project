import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Equipment } from '../domain/Equipment.entity.js';
import type { IEquipmentProps, EquipmentCategory, TrackingType, LocationStatus, HealthStatus, UsageStatus } from '../domain/Equipment.entity.js';
import { Accessory } from '../domain/Accessory.entity.js';
import type { IEquipmentRepository, EquipmentQueryParams, EquipmentStatistics, StockDistribution } from '../domain/IEquipmentRepository.js';
import { Decimal } from '@prisma/client/runtime/library';

@singleton()
export class PrismaEquipmentRepository implements IEquipmentRepository {

  async save(equipment: Equipment): Promise<void> {
    const data = equipment.toJSON();
    
    // 检查 manage_code 是否已存在（包括设备和配件表）
    if (data.manageCode) {
      const equipWhere: any = { manage_code: data.manageCode };
      if (data.id) {
        equipWhere.id = { not: data.id as string };
      }
      const existingEquip = await prisma.equipment_instances.findFirst({
        where: equipWhere
      });
      if (existingEquip) {
        throw new Error(`管理编码 "${data.manageCode}" 已存在，请使用其他编码`);
      }
      
      const accWhere: any = { manage_code: data.manageCode };
      if (data.id) {
        accWhere.id = { not: data.id as string };
      }
      const existingAcc = await prisma.equipment_accessory_instances.findFirst({
        where: accWhere
      });
      if (existingAcc) {
        throw new Error(`管理编码 "${data.manageCode}" 已存在，请使用其他编码`);
      }
    }
    
    const updateData: any = {
      equipment_name: data.equipmentName,
      model_no: data.modelNo,
      brand: data.brand,
      manufacturer: data.manufacturer,
      technical_params: data.technicalParams,
      category: data.category as any,
      tracking_type: data.trackingType as any,
      quantity: data.quantity,
      serial_number: data.serialNumber,
      unit: data.unit,
      location_id: data.locationId,
      location_status: data.locationStatus as any,
      health_status: data.healthStatus as any,
      usage_status: data.usageStatus as any,
      keeper_id: data.keeperId,
      purchase_date: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchase_price: data.purchasePrice ? new Decimal(data.purchasePrice) : null,
      calibration_expiry: data.calibrationExpiry ? new Date(data.calibrationExpiry) : null,
      certificate_no: data.certificateNo,
      certificate_issuer: data.certificateIssuer,
      supplier: data.supplier,
      notes: data.notes,
      attachments: data.attachments as any,
      updated_at: new Date()
    };
    
    if (data.manageCode) {
      updateData.manage_code = data.manageCode;
    }
    
    // 检查记录是否存在
    const existingRecord = await prisma.equipment_instances.findUnique({
      where: { id: data.id as string }
    });
    
    if (existingRecord) {
      // 更新现有记录
      await prisma.equipment_instances.update({
        where: { id: data.id as string },
        data: updateData
      });
    } else {
      // 创建新记录
      await prisma.equipment_instances.create({
        data: {
          id: data.id as string,
          ...updateData,
          manage_code: data.manageCode,
          version: 1
        }
      });
    }
  }

  async update(equipment: Equipment): Promise<void> {
    await this.save(equipment);
  }

  async saveAccessory(accessory: Accessory): Promise<void> {
    const data = accessory.toJSON();
    
    await prisma.equipment_accessory_instances.upsert({
      where: { id: data.id as string },
      update: {
        accessory_name: data.accessoryName,
        model_no: data.modelNo,
        category: data.category as any,
        tracking_type: data.trackingType as any,
        quantity: data.quantity,
        serial_number: data.serialNumber,
        manage_code: data.manageCode,
        unit: data.unit,
        location_id: data.locationId,
        location_status: data.locationStatus as any,
        keeper_id: data.keeperId,
        purchase_date: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchase_price: data.purchasePrice ? new Decimal(data.purchasePrice) : null,
        host_equipment_id: data.hostEquipmentId,
        usage_status: data.usageStatus as any,
        source_type: data.sourceType as any,
        version: { increment: 1 }
      },
      create: {
        id: data.id as string,
        accessory_name: data.accessoryName,
        model_no: data.modelNo,
        category: data.category as any,
        tracking_type: data.trackingType as any,
        quantity: data.quantity,
        serial_number: data.serialNumber,
        manage_code: data.manageCode,
        unit: data.unit,
        location_id: data.locationId,
        location_status: data.locationStatus as any,
        keeper_id: data.keeperId,
        purchase_date: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchase_price: data.purchasePrice ? new Decimal(data.purchasePrice) : null,
        host_equipment_id: data.hostEquipmentId,
        usage_status: data.usageStatus as any,
        source_type: data.sourceType as any,
        notes: data.notes,
        attachments: data.attachments as any,
        version: 1
      }
    });
  }

  async checkManageCodeUnique(manageCode: string, excludeId?: string): Promise<boolean> {
    if (!manageCode) return true;

    const equipWhere: any = { manage_code: manageCode };
    if (excludeId) {
      equipWhere.id = { not: excludeId };
    }
    const equipCount = await prisma.equipment_instances.count({ where: equipWhere });
    if (equipCount > 0) return false;

    const accWhere: any = { manage_code: manageCode };
    if (excludeId) {
      accWhere.id = { not: excludeId };
    }
    const accCount = await prisma.equipment_accessory_instances.count({ where: accWhere });
    if (accCount > 0) return false;

    return true;
  }

  async findById(id: string): Promise<Equipment | null> {
    const row = await prisma.equipment_instances.findFirst({
      where: { id, deleted_at: null }
    });
    if (!row) return null;

    // 获取位置名称
    let locationName = '';
    if (row.location_id) {
       if (row.location_status === 'warehouse') {
         const w = await prisma.warehouses.findUnique({ where: { id: row.location_id }, select: { name: true } });
         locationName = w?.name || '';
       } else if (row.location_status === 'in_project') {
         const p = await (prisma as any).projects.findUnique({ where: { id: row.location_id }, select: { name: true } });
         locationName = p?.name || '';
       }
    }
    
    return new Equipment({
      id: row.id,
      equipmentName: row.equipment_name,
      modelNo: row.model_no,
      brand: row.brand || undefined,
      manufacturer: row.manufacturer || undefined,
      category: row.category as any,
      trackingType: row.tracking_type as any,
      quantity: row.quantity || 0,
      manageCode: row.manage_code || undefined,
      serialNumber: row.serial_number || undefined,
      unit: row.unit || '台',
      locationId: row.location_id || '',
      locationStatus: row.location_status as any,
      healthStatus: row.health_status as any,
      usageStatus: row.usage_status as any,
      keeperId: row.keeper_id || undefined,
      purchaseDate: row.purchase_date || undefined,
      purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
      supplier: (row as any).supplier || undefined,
      calibrationExpiry: row.calibration_expiry || undefined,
      certificateNo: row.certificate_no || undefined,
      certificateIssuer: row.certificate_issuer || undefined,
      technicalParams: row.technical_params || undefined,
      attachments: row.attachments as any,
      version: row.version,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
      locationName
    });
  }

  async findLocationDetails(locationId: string): Promise<{ manager_id: string | null; type: 'warehouse' | 'in_project' | null }> {
    if (!locationId) return { manager_id: null, type: null };

    const warehouse = await prisma.warehouses.findUnique({
      where: { id: locationId },
      select: { manager_id: true }
    });
    if (warehouse) return { manager_id: warehouse.manager_id, type: 'warehouse' };

    const project = await prisma.projects.findUnique({
      where: { id: locationId },
      select: { manager_id: true }
    });
    if (project) return { manager_id: project.manager_id, type: 'in_project' };

    return { manager_id: null, type: null };
  }

  async findAll(params: EquipmentQueryParams): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      category,
      status,
      location_id,
      locationId,
      trackingType,
      search,
      location_status,
      health_status,
      usage_status
    } = params;
    
    const finalLocationId = location_id || locationId;
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE (ei.deleted_at IS NULL)";
    const values: any[] = [];

    whereClause += " AND (ei.health_status IS NULL OR (ei.health_status != 'scrapped' AND ei.health_status != 'broken'))";
    whereClause += " AND (ei.usage_status IS NULL OR (ei.usage_status != 'scrapped' AND ei.usage_status != 'SCRAPPED' AND ei.usage_status != 'SOLD' AND ei.usage_status != 'lost'))";

    const ds = (params as any).dataScope;
    if (ds) {
      if (ds.scope === 'self') {
        whereClause += ' AND ei.keeper_id = ?';
        values.push(ds.employeeId || ds.userId);
      } else if (ds.scope === 'project') {
        if (!ds.projectIds || ds.projectIds.length === 0) {
          whereClause += ' AND ei.id = "none"';
        } else {
          whereClause += ` AND ei.location_id IN (${ds.projectIds.map(() => '?').join(',')})`;
          values.push(...ds.projectIds);
        }
      }
    }

    if (category) {
      whereClause += ' AND ei.category = ?';
      values.push(category);
    }

    if (status) {
      whereClause += ' AND ei.health_status = ?';
      values.push(status);
    }

    if (finalLocationId) {
      whereClause += ' AND ei.location_id = ?';
      values.push(finalLocationId);
    }

    if (trackingType) {
      whereClause += ' AND ei.tracking_type = ?';
      values.push(trackingType);
    }

    if (search) {
      whereClause += ' AND (ei.equipment_name LIKE ? OR ei.model_no LIKE ? OR ei.manage_code LIKE ?)';
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location_status) {
      whereClause += ' AND ei.location_status = ?';
      values.push(location_status);
    }

    if (health_status) {
      whereClause += ' AND ei.health_status = ?';
      values.push(health_status);
    }

    if (usage_status) {
      whereClause += ' AND ei.usage_status = ?';
      values.push(usage_status);
    }

    const totalRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM equipment_instances ei ${whereClause}`,
      ...values
    );
    const total = Number(totalRaw[0]?.total || 0);

    const instances = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ei.*, 
        CASE 
          WHEN ei.location_status = 'warehouse' THEN w.name 
          WHEN ei.location_status IN ('project', 'project_on', 'in_project') THEN p.name 
          ELSE NULL 
        END as location_name, 
        e.name as keeper_name
       FROM equipment_instances ei
       LEFT JOIN warehouses w ON ei.location_id = w.id
       LEFT JOIN projects p ON ei.location_id = p.id
       LEFT JOIN employees e ON ei.keeper_id = e.id
       ${whereClause} 
       ORDER BY ei.created_at DESC 
       LIMIT ? OFFSET ?`,
      ...values, pageSize, offset
    );

    if (instances && instances.length > 0) {
      const instanceIds = instances.map(i => i.id);
      
      const imagesResult = await prisma.equipment_images.findMany({
        where: {
          equipment_id: { in: instanceIds },
          image_type: { in: ['main', 'accessory'] }
        }
      });
      
      const imagesMap: Record<string, string> = {};
      for (const img of imagesResult) {
        if (img.equipment_id) {
          imagesMap[img.equipment_id] = img.image_url;
        }
      }

      for (const instance of instances) {
        instance.main_image = imagesMap[instance.id] || null;
        
        const accessories = await prisma.equipment_accessory_instances.findMany({
          where: {
            host_equipment_id: instance.id,
            deleted_at: null
          }
        });
        instance.accessories = accessories;
      }
    }

    return { total, data: instances };
  }

  async findAggregated(params: EquipmentQueryParams): Promise<{ data: any[]; total: number; totalPages: number }> {
    const { page = 1, pageSize = 10, category, status, location_id, locationId, search, location_status, health_status, usage_status } = params;
    
    const finalLocationId = location_id || locationId;
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE (ei.deleted_at IS NULL)";
    const values: any[] = [];

    whereClause += " AND (ei.health_status IS NULL OR (ei.health_status != 'scrapped' AND ei.health_status != 'broken'))";
    whereClause += " AND (ei.usage_status IS NULL OR (ei.usage_status != 'scrapped' AND ei.usage_status != 'SCRAPPED' AND ei.usage_status != 'SOLD' AND ei.usage_status != 'lost'))";

    const ds = (params as any).dataScope;
    if (ds) {
      if (ds.scope === 'self') {
        whereClause += ' AND ei.keeper_id = ?';
        values.push(ds.employeeId || ds.userId);
      } else if (ds.scope === 'project') {
        if (!ds.projectIds || ds.projectIds.length === 0) {
          whereClause += ' AND ei.id = "none"';
        } else {
          whereClause += ` AND ei.location_id IN (${ds.projectIds.map(() => '?').join(',')})`;
          values.push(...ds.projectIds);
        }
      }
    }

    if (category) {
      whereClause += ' AND ei.category = ?';
      values.push(category);
    }

    if (status) {
      whereClause += ' AND ei.health_status = ?';
      values.push(status);
    }

    if (finalLocationId) {
      whereClause += ' AND ei.location_id = ?';
      values.push(finalLocationId);
    }

    if (search) {
      whereClause += ' AND (ei.equipment_name LIKE ? OR ei.model_no LIKE ? OR ei.manage_code LIKE ?)';
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location_status) {
      whereClause += ' AND ei.location_status = ?';
      values.push(location_status);
    }

    if (health_status) {
      whereClause += ' AND ei.health_status = ?';
      values.push(health_status);
    }

    if (usage_status) {
      whereClause += ' AND ei.usage_status = ?';
      values.push(usage_status);
    }

    const instrumentWhereClause = whereClause + " AND ei.category = 'instrument'";
    const aggregatedWhereClause = whereClause + " AND ei.category IN ('fake_load', 'cable', 'accessory')";
    
    const groupBy = `GROUP BY ei.equipment_name, ei.model_no, ei.brand, ei.health_status, ei.usage_status, ei.location_status, ei.location_id, ei.purchase_date, ei.category`;
    
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT 1 FROM equipment_instances ei ${instrumentWhereClause}
        UNION ALL
        SELECT 1 FROM (
          SELECT 1 FROM equipment_instances ei ${aggregatedWhereClause} ${groupBy}
        ) as t
      ) as combined
    `;
    
    const totalRaw = await prisma.$queryRawUnsafe<any[]>(countSql, ...values, ...values);
    const total = Number(totalRaw[0]?.total || 0);

    const instrumentSql = `
      SELECT 
        ei.id, 
        ei.equipment_name, 
        ei.model_no, 
        ei.brand, 
        ei.manufacturer, 
        ei.category,
        ei.unit,
        ei.quantity, 
        ei.health_status, 
        ei.usage_status, 
        ei.location_status, 
        ei.location_id, 
        ei.purchase_date,
        ei.purchase_price,
        ei.supplier,
        CASE 
          WHEN ei.location_status = 'warehouse' THEN w.name 
          WHEN ei.location_status IN ('project', 'project_on', 'in_project') THEN p.name 
          ELSE NULL 
        END as location_name, 
        e.name as keeper_name,
        ei.technical_params,
        ei.notes,
        ei.attachments,
        ei.created_at,
        'single' as display_type,
        ei.manage_code,
        ei.serial_number,
        ei.calibration_expiry,
        ei.certificate_no,
        ei.certificate_issuer,
        NULL as instance_ids
       FROM equipment_instances ei
       LEFT JOIN warehouses w ON ei.location_id = w.id
       LEFT JOIN projects p ON ei.location_id = p.id
       LEFT JOIN employees e ON ei.keeper_id = e.id
       ${instrumentWhereClause}
       ORDER BY ei.created_at DESC
    `;

    const aggregatedSql = `
      SELECT 
        MAX(ei.id) as id, 
        ei.equipment_name, 
        ei.model_no, 
        ei.brand, 
        MAX(ei.manufacturer) as manufacturer, 
        ei.category,
        MAX(ei.unit) as unit,
        SUM(ei.quantity) as quantity, 
        ei.health_status, 
        ei.usage_status, 
        ei.location_status, 
        ei.location_id, 
        ei.purchase_date, 
        MAX(ei.purchase_price) as purchase_price, 
        MAX(ei.supplier) as supplier,
        CASE 
          WHEN ei.location_status = 'warehouse' THEN MAX(w.name) 
          WHEN ei.location_status IN ('project', 'project_on', 'in_project') THEN MAX(p.name) 
          ELSE NULL 
        END as location_name, 
        MAX(e.name) as keeper_name, 
        MAX(ei.technical_params) as technical_params, 
        MAX(ei.notes) as notes, 
        MAX(ei.attachments) as attachments, 
        MAX(ei.created_at) as created_at,
        'aggregated' as display_type,
        GROUP_CONCAT(ei.manage_code) as manage_codes, 
        MAX(ei.serial_number) as serial_number,
        MAX(ei.calibration_expiry) as calibration_expiry,
        MAX(ei.certificate_no) as certificate_no,
        MAX(ei.certificate_issuer) as certificate_issuer,
        GROUP_CONCAT(ei.id) as instance_ids
       FROM equipment_instances ei
       LEFT JOIN warehouses w ON ei.location_id = w.id
       LEFT JOIN projects p ON ei.location_id = p.id
       LEFT JOIN employees e ON ei.keeper_id = e.id
       ${aggregatedWhereClause}
       ${groupBy}
       ORDER BY MAX(ei.created_at) DESC
    `;

    const unionSql = `
      SELECT * FROM (
        (${instrumentSql})
        UNION ALL
        (${aggregatedSql})
      ) as combined
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const instances = await prisma.$queryRawUnsafe<any[]>(
      unionSql,
      ...values,
      ...values,
      pageSize, offset
    );

    for (const instance of instances) {
      if (instance.display_type === 'aggregated' && instance.instance_ids) {
        const ids = instance.instance_ids.split(',');
        const accessories = await prisma.equipment_accessory_instances.findMany({
          where: {
            host_equipment_id: { in: ids },
            deleted_at: null
          }
        });
        instance.accessories = accessories;
      }
      
      // Fetch main image for each instance, with model-level fallback
      const specificImage = await prisma.equipment_images.findFirst({
        where: {
          equipment_id: instance.id,
          image_type: { in: ['main', 'accessory'] }
        },
        orderBy: { created_at: 'desc' },
        select: { image_url: true }
      });

      let mainImageUrl = specificImage?.image_url || null;
      if (!mainImageUrl) {
        const fallbackImage = await prisma.equipment_images.findFirst({
          where: {
            equipment_name: instance.equipment_name,
            model_no: instance.model_no || null,
            image_type: { in: ['main', 'accessory'] }
          },
          orderBy: { created_at: 'desc' },
          select: { image_url: true }
        });
        mainImageUrl = fallbackImage?.image_url || null;
      }
      instance.main_image = mainImageUrl;
      
      if (typeof instance.attachments === 'string') {
        try {
          instance.attachments = JSON.parse(instance.attachments);
        } catch (e) {
          instance.attachments = [];
        }
      }
    }

    return { total, data: instances, totalPages: Math.ceil(total / pageSize) };
  }

  async findStatistics(): Promise<EquipmentStatistics> {
    const [total, serialized, batch, inUse, idle] = await Promise.all([
      prisma.equipment_instances.count({
        where: { deleted_at: null }
      }),
      prisma.equipment_instances.count({
        where: { tracking_type: 'SERIALIZED', deleted_at: null }
      }),
      prisma.equipment_instances.count({
        where: { tracking_type: 'BATCH', deleted_at: null }
      }),
      prisma.equipment_instances.count({
        where: { usage_status: 'in_use', deleted_at: null }
      }),
      prisma.equipment_instances.count({
        where: { usage_status: 'idle', deleted_at: null }
      })
    ]);

    return { total, serialized, batch, inUse, idle };
  }

  async findStockDistribution(equipmentName: string, modelNo: string): Promise<StockDistribution[]> {
    const results = await prisma.equipment_instances.groupBy({
      by: ['equipment_name', 'model_no', 'location_id'],
      where: {
        equipment_name: equipmentName || undefined,
        model_no: modelNo || undefined,
        deleted_at: null
      },
      _sum: {
        quantity: true
      }
    });

    return results.map(r => ({
      equipmentName: r.equipment_name,
      modelNo: r.model_no,
      locationId: r.location_id || '',
      quantity: r._sum.quantity || 0
    }));
  }

  async findEquipmentNames(category?: string): Promise<string[]> {
    const results = await prisma.equipment_instances.findMany({
      where: { 
        equipment_name: { not: "" },
        category: category ? category as any : undefined,
        deleted_at: null
      },
      select: { equipment_name: true },
      distinct: ['equipment_name'],
      orderBy: { equipment_name: 'asc' }
    });
    return results.map(r => r.equipment_name);
  }

  async findModelsByName(equipmentName: string): Promise<any[]> {
    return prisma.equipment_instances.findMany({
      where: { equipment_name: equipmentName, deleted_at: null },
      distinct: ['model_no']
    });
  }

  async findModelsByCategory(category: string): Promise<any[]> {
    return prisma.equipment_instances.findMany({
      where: { category: category as any, deleted_at: null },
      distinct: ['model_no']
    });
  }

  async findAllModels(): Promise<any[]> {
    return prisma.equipment_instances.findMany({
      where: { deleted_at: null },
      distinct: ['model_no'],
      orderBy: [{ equipment_name: 'asc' }, { model_no: 'asc' }]
    });
  }

  async updateStatus(id: string, status: { health_status?: string; usage_status?: string; location_status?: string; location_id?: string; keeper_id?: string }): Promise<any> {
    await prisma.equipment_instances.update({
      where: { id },
      data: {
        health_status: status.health_status as any,
        usage_status: status.usage_status as any,
        location_status: status.location_status as any,
        location_id: status.location_id,
        keeper_id: status.keeper_id,
        updated_at: new Date()
      }
    });

    return this.findById(id);
  }

  async transferEquipment(id: string, targetLocationId: string, targetStatus: string, keeperId?: string): Promise<void> {
    await prisma.equipment_instances.update({
      where: { id },
      data: {
        location_id: targetLocationId,
        location_status: targetStatus as any,
        keeper_id: keeperId,
        updated_at: new Date()
      }
    });
  }

  async syncKeepersByLocation(locationId: string, keeperId: string): Promise<void> {
    await prisma.equipment_instances.updateMany({
      where: { location_id: locationId },
      data: { keeper_id: keeperId }
    });

    await prisma.equipment_accessory_instances.updateMany({
      where: { location_id: locationId },
      data: { keeper_id: keeperId }
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.equipment_instances.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async saveImages(equipmentId: string, images: string[], imageType: string = 'main'): Promise<void> {
    if (!images || images.length === 0) return;
    
    for (const imageUrl of images) {
      await (prisma as any).equipment_images.create({
        data: {
          id: crypto.randomUUID(),
          equipment_id: equipmentId,
          image_url: imageUrl,
          image_type: imageType,
          created_at: new Date()
        }
      });
    }
  }

  async findBatchInventory(modelId: string, locationId: string): Promise<any | null> {
    return prisma.equipment_instances.findFirst({
      where: {
        model_no: modelId,
        location_id: locationId,
        tracking_type: 'BATCH',
        deleted_at: null
      }
    });
  }

  async updateBatchInventory(id: string, quantity: number): Promise<void> {
    await prisma.equipment_instances.update({
      where: { id },
      data: { quantity }
    });
  }

  async findImagesByEquipmentId(equipmentId: string): Promise<any[]> {
    return prisma.equipment_images.findMany({
      where: { equipment_id: equipmentId },
      orderBy: { created_at: 'desc' }
    });
  }

  async deleteImage(imageId: string): Promise<boolean> {
    try {
      await prisma.equipment_images.delete({
        where: { id: imageId }
      });
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }

  async getBatchInventory(): Promise<any[]> {
    return prisma.equipment_instances.groupBy({
      by: ['model_no', 'location_id'],
      where: { tracking_type: 'BATCH', deleted_at: null },
      _sum: { quantity: true }
    } as any) as any;
  }

  async findArchives(params: any): Promise<{ data: any[]; total: number }> {
    const { page = 1, pageSize = 15, keyword, status } = params;
    const offset = (page - 1) * pageSize;
    
    let whereClause = "WHERE (ei.usage_status IN ('SCRAPPED', 'SOLD', 'scrapped', 'lost'))";
    const values: any[] = [];

    const ds = params.dataScope;
    if (ds) {
      if (ds.scope === 'self') {
        whereClause += ' AND ei.keeper_id = ?';
        values.push(ds.employeeId || ds.userId);
      } else if (ds.scope === 'project') {
        if (!ds.projectIds || ds.projectIds.length === 0) {
          whereClause += ' AND ei.id = "none"';
        } else {
          whereClause += ` AND ei.location_id IN (${ds.projectIds.map(() => '?').join(',')})`;
          values.push(...ds.projectIds);
        }
      }
    }

    if (status) {
      whereClause += " AND ei.usage_status = ?";
      values.push(status);
    }

    if (keyword) {
      whereClause += " AND (ei.equipment_name LIKE ? OR ei.manage_code LIKE ? OR ei.serial_number LIKE ?)";
      values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const totalRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM equipment_instances ei ${whereClause}`,
      ...values
    );
    const total = Number(totalRaw[0]?.total || 0);

    const data = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ei.* FROM equipment_instances ei ${whereClause} ORDER BY ei.updated_at DESC LIMIT ? OFFSET ?`,
      ...values, pageSize, offset
    );

    return { data, total };
  }
}
