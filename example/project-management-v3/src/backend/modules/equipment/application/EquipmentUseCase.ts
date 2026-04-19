import { singleton, inject } from 'tsyringe';
import type { PrismaEquipmentRepository } from '../infrastructure/PrismaEquipmentRepository.js';
import type { AuditService } from '../../../services/AuditService.js';
import { prisma, Prisma } from '../../../database/prisma.js';

export interface CreateEquipmentDto {
  name: string;
  category?: string;
  model_no?: string;
  serial_number?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_end_date?: string;
  location_id?: string;
  location_status?: string;
  health_status?: string;
  usage_status?: string;
  equipment_source?: string;
  supplier?: string;
  technical_params?: Record<string, any>;
  management_number?: string;
  remarks?: string;
}

export interface UpdateEquipmentDto {
  name?: string;
  category?: string;
  model_no?: string;
  serial_number?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_end_date?: string;
  location_id?: string;
  location_status?: string;
  health_status?: string;
  usage_status?: string;
  equipment_source?: string;
  supplier?: string;
  technical_params?: Record<string, any>;
  management_number?: string;
  remarks?: string;
  status?: string;
}

type LocationStatus = 'in_storage' | 'in_use' | 'in_transfer' | 'in_repair' | 'returned';
type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';
type UsageStatus = 'idle' | 'in_use' | 'reserved';

@singleton()
export class EquipmentUseCase {
  constructor(
    @inject('PrismaEquipmentRepository') private repository: PrismaEquipmentRepository,
    @inject('AuditService') private auditService: AuditService
  ) {}

  async getInstances(params: any) {
    const { page = 1, pageSize = 10, merge, ...filters } = params;
    
    const result = (merge === true || merge === 'true') 
      ? await this.repository.findAggregated(params)
      : await this.repository.findAll(params);

    if (result.data.length > 0) {
      const ids = result.data.map((item: any) => item.id).filter(Boolean);
      
      // Fetch both bound instances and standard BOM definitions
      const [allInstanceAcc, allBomAcc] = await Promise.all([
        prisma.equipment_accessory_instances.findMany({
          where: { host_equipment_id: { in: ids }, deleted_at: null }
        }),
        prisma.equipment_accessories.findMany({
          where: { host_equipment_id: { in: ids } }
        })
      ]);

      result.data = result.data.map((item: any) => {
        const instances = allInstanceAcc.filter((acc: any) => acc.host_equipment_id === item.id);
        const boms = allBomAcc.filter((acc: any) => acc.host_equipment_id === item.id);
        
        return {
          ...item,
          // Preference to instances, fallback to BOMs
          accessories: instances.length > 0 ? instances : boms.map(b => ({
            ...b,
            model_no: b.accessory_model, // Map to standard field
            quantity: b.quantity || 1
          }))
        };
      });
    }

    return { 
      data: result.data, 
      total: result.total, 
      totalPages: Math.ceil(result.total / pageSize),
      page, 
      pageSize 
    };
  }

  async getInstanceById(id: string) {
    const equipment = await this.repository.findById(id);
    if (!equipment) return null;
    
    const accessories = await prisma.equipment_accessory_instances.findMany({
      where: { host_equipment_id: id, deleted_at: null }
    });
    
    const equipmentData = equipment.toJSON();
    return {
      ...equipmentData,
      accessories
    };
  }

  async createEquipment(data: CreateEquipmentDto) {
    const id = crypto.randomUUID();
    // 映射 DTO 到领域对象属性
    const equipmentData: any = {
      id,
      equipmentName: data.name,
      modelNo: data.model_no || '',
      category: data.category as any || 'instrument',
      manufacturer: data.manufacturer,
      purchaseDate: data.purchase_date,
      purchasePrice: data.purchase_price,
      locationId: data.location_id || '',
      locationStatus: data.location_status as any || 'warehouse',
      healthStatus: data.health_status as any || 'normal',
      usageStatus: data.usage_status as any || 'idle',
      manageCode: data.management_number,
      serialNumber: data.serial_number,
      supplier: data.supplier,
      notes: data.remarks,
      technicalParams: data.technical_params ? JSON.stringify(data.technical_params) : undefined,
      quantity: 1
    };

    await (this.repository as any).save({
      toJSON: () => equipmentData,
      snapshot: equipmentData,
      id
    });

    await this.auditService.log({
      entityType: 'Equipment',
      entityId: id,
      action: 'create',
      newValue: equipmentData,
      operatorId: 'system',
      operatorName: 'System'
    });

    return equipmentData;
  }

  async updateEquipment(id: string, data: UpdateEquipmentDto, version: number) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    if (version !== undefined && existing.version !== version) {
      throw new Error('Version mismatch');
    }

    const updates: any = {
      ...existing.snapshot,
      ...data,
      id,
      version: version !== undefined ? version + 1 : (existing as any).version + 1,
      updated_at: new Date()
    };

    await (this.repository as any).save({
        toJSON: () => updates,
        snapshot: updates,
        id
    });

    await this.auditService.log({
      entityType: 'Equipment',
      entityId: id,
      action: 'update',
      oldValue: existing.snapshot as any,
      newValue: updates,
      operatorId: 'system',
      operatorName: 'System'
    });

    return this.getInstanceById(id);
  }

  async updateEquipmentStatus(id: string, status: {
    health_status?: string;
    usage_status?: string;
    location_status?: string;
    location_id?: string;
    keeper_id?: string;
  }) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    const oldStatus = existing.snapshot;

    await this.repository.updateStatus(id, status);

    await this.auditService.log({
      entityType: 'Equipment',
      entityId: id,
      action: 'status_change',
      oldValue: oldStatus as any,
      newValue: { ...oldStatus, ...status },
      operatorId: 'system',
      operatorName: 'System'
    });

    return this.getInstanceById(id);
  }

  async deleteEquipment(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('设备不存在');
    }

    await this.auditService.log({
      entityType: 'Equipment',
      entityId: id,
      action: 'delete',
      oldValue: existing.snapshot as any,
      operatorId: 'system',
      operatorName: 'System'
    });

    await this.repository.softDelete(id);
    return true;
  }

  async getStatistics() {
    return this.repository.findStatistics();
  }

  async getStockDistribution(equipmentName: string, modelNo: string) {
    return this.repository.findStockDistribution(equipmentName, modelNo);
  }

  async getEquipmentNames(category?: string) {
    return this.repository.findEquipmentNames(category);
  }

  async getModelsByName(equipmentName: string) {
    return this.repository.findModelsByName(equipmentName);
  }

  async syncKeepersByLocation(locationId: string, keeperId: string) {
    return (this.repository as any).syncKeepersByLocation(locationId, keeperId);
  }

  async getImagesByEquipmentId(equipmentId: string) {
    return (this.repository as any).findImagesByEquipmentId(equipmentId);
  }

  async deleteImage(imageId: string): Promise<boolean> {
    return (this.repository as any).deleteImage(imageId);
  }

  async checkManageCodeUnique(code: string) {
    return (this.repository as any).checkManageCodeUnique(code);
  }

  async getModelsByCategory(category: string) {
    return (this.repository as any).findModelsByCategory(category);
  }

  async getAllModels() {
    return (this.repository as any).findAllModels();
  }

  async getArchives(params: any) {
    return this.repository.findArchives(params);
  }

  async getEquipmentHistory(params: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    pageSize: number;
  }) {
    const { type, startDate, endDate, page, pageSize } = params;
    const skip = (page - 1) * pageSize;
    
    const whereClause: any = {};
    if (type && type !== 'all') {
      whereClause.action_type = type;
    }
    if (startDate) {
      whereClause.operated_at = { ...whereClause.operated_at, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.operated_at = { ...whereClause.operated_at, lte: end };
    }

    const [records, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          eioi.id as equipment_id,
          eioi.equipment_name,
          eioi.model_no,
          eioi.category,
          '入库' as action,
          'inbound' as action_type,
          w.name as from_location,
          NULL as to_location,
          eio.applicant as operator,
          eio.created_at as operated_at,
          eio.order_no,
          eio.notes
        FROM equipment_inbound_orders eio
        LEFT JOIN equipment_inbound_items eioi ON eio.id = eioi.order_id
        LEFT JOIN warehouses w ON eio.warehouse_id = w.id
        WHERE eio.status = 'completed'
        ${startDate ? Prisma.sql`AND eio.created_at >= ${new Date(startDate)}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND eio.created_at <= ${new Date(endDate)}` : Prisma.empty}
        
        UNION ALL
        
        SELECT 
          eto.id as equipment_id,
          etoi.equipment_name,
          etoi.model_no,
          etoi.category,
          '调拨' as action,
          'transfer' as action_type,
          CONCAT(CASE WHEN eto.from_location_type = 'warehouse' THEN fw.name ELSE fp.name END) as from_location,
          CONCAT(CASE WHEN eto.to_location_type = 'warehouse' THEN tw.name ELSE tp.name END) as to_location,
          eto.applicant as operator,
          eto.created_at as operated_at,
          eto.order_no,
          eto.transfer_reason as notes
        FROM equipment_transfer_orders eto
        LEFT JOIN equipment_transfer_order_items etoi ON eto.id = etoi.order_id
        LEFT JOIN warehouses fw ON eto.from_warehouse_id = fw.id
        LEFT JOIN projects fp ON eto.from_project_id = fp.id
        LEFT JOIN warehouses tw ON eto.to_warehouse_id = tw.id
        LEFT JOIN projects tp ON eto.to_project_id = tp.id
        WHERE eto.status = 'completed'
        ${startDate ? Prisma.sql`AND eto.created_at >= ${new Date(startDate)}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND eto.created_at <= ${new Date(endDate)}` : Prisma.empty}
        
        UNION ALL
        
        SELECT 
          ess.id as equipment_id,
          ess.equipment_name,
          ei.model_no,
          ess.equipment_category as category,
          CASE WHEN ess.type = 'scrap' THEN '报废' ELSE '出售' END as action,
          CASE WHEN ess.type = 'scrap' THEN 'scrap' ELSE 'sale' END as action_type,
          w.name as from_location,
          NULL as to_location,
          ess.applicant as operator,
          ess.apply_date as operated_at,
          ess.order_no,
          ess.reason as notes
        FROM equipment_scrap_sales ess
        LEFT JOIN equipment_instances ei ON ess.equipment_id = ei.id
        LEFT JOIN warehouses w ON ess.original_location_id = w.id
        WHERE ess.status = 'approved'
        ${startDate ? Prisma.sql`AND ess.apply_date >= ${new Date(startDate)}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND ess.apply_date <= ${new Date(endDate)}` : Prisma.empty}
        
        ORDER BY operated_at DESC
        LIMIT ${pageSize} OFFSET ${skip}
      ` as any,
      prisma.$queryRaw`
        SELECT COUNT(*) as total FROM (
          SELECT 1 FROM equipment_inbound_orders WHERE status = 'completed'
          ${startDate ? Prisma.sql`AND created_at >= ${new Date(startDate)}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND created_at <= ${new Date(endDate)}` : Prisma.empty}
          
          UNION ALL
          
          SELECT 1 FROM equipment_transfer_orders WHERE status = 'completed'
          ${startDate ? Prisma.sql`AND created_at >= ${new Date(startDate)}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND created_at <= ${new Date(endDate)}` : Prisma.empty}
          
          UNION ALL
          
          SELECT 1 FROM equipment_scrap_sales WHERE status = 'approved'
          ${startDate ? Prisma.sql`AND apply_date >= ${new Date(startDate)}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND apply_date <= ${new Date(endDate)}` : Prisma.empty}
        ) as combined
      ` as any
    ]);

    return {
      data: records,
      total: Number(total[0]?.total || 0),
      page,
      pageSize
    };
  }
}
