import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Accessory } from '../domain/Accessory.entity.js';
import { IAccessoryRepository, AccessoryQueryParams } from '../domain/IAccessoryRepository.js';
import { Decimal } from '@prisma/client/runtime/library';

@singleton()
export class PrismaAccessoryRepository implements IAccessoryRepository {
  async findAll(params: AccessoryQueryParams): Promise<{ total: number; data: any[] }> {
    const { category, status, location_status, bound, keyword, location_id, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const where: any = { deleted_at: null };

    if (category) where.category = category;
    if (status) where.status = status;
    if (location_status) where.location_status = location_status;
    if (location_id) where.location_id = location_id;

    if (bound === true) {
      where.host_equipment_id = { not: null };
    } else if (bound === false) {
      where.host_equipment_id = null;
    }

    if (keyword) {
      where.OR = [
        { accessory_name: { contains: keyword } },
        { model_no: { contains: keyword } },
        { manage_code: { contains: keyword } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.equipment_accessory_instances.count({ where }),
      prisma.equipment_accessory_instances.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: pageSize
      })
    ]);

    const instanceIds = data.map(i => i.id);
    const imagesResult = await prisma.equipment_images.findMany({
      where: {
        equipment_id: { in: instanceIds },
        image_type: { in: ['main', 'accessory'] }
      }
    });

    const imagesMap: Record<string, string> = {};
    for (const img of imagesResult) {
      if (img.equipment_id && !imagesMap[img.equipment_id]) {
        imagesMap[img.equipment_id] = img.image_url;
      }
    }

    // Fallback for missing instance images
    const needsFallback = data.filter(item => !imagesMap[item.id]);
    if (needsFallback.length > 0) {
      const fallbackResults = await prisma.equipment_images.findMany({
        where: {
          OR: needsFallback.map(item => ({
            equipment_name: item.accessory_name,
            model_no: item.model_no || null,
            image_type: { in: ['main', 'accessory'] }
          }))
        },
        orderBy: { created_at: 'desc' }
      });
      for (const item of needsFallback) {
        const match = fallbackResults.find(f => f.equipment_name === item.accessory_name && f.model_no === item.model_no);
        if (match) imagesMap[item.id] = match.image_url;
      }
    }

    const warehouseIds = [...new Set(data.filter(item => item.location_status === 'warehouse').map(a => a.location_id).filter(Boolean))] as string[];
    const projectIds = [...new Set(data.filter(item => ['in_project', 'project', 'project_on'].includes(item.location_status || '')).map(a => a.location_id).filter(Boolean))] as string[];
    const keeperIds = [...new Set(data.map(a => a.keeper_id).filter(Boolean))] as string[];
    const hostEquipmentIds = [...new Set(data.map(a => a.host_equipment_id).filter(Boolean))] as string[];
    
    const [warehouses, projects] = await Promise.all([
      warehouseIds.length > 0 ? prisma.warehouses.findMany({
        where: { id: { in: warehouseIds } },
        select: { id: true, name: true, manager_id: true }
      }) : Promise.resolve([]),
      projectIds.length > 0 ? prisma.projects.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, manager_id: true }
      }) : Promise.resolve([])
    ]);

    const warehouseMap = new Map(warehouses.map((w: any) => [w.id, w]));
    const projectMap = new Map(projects.map((p: any) => [p.id, p]));

    // 收集所有可能的保管人ID（包括设备自带的keeper_id和位置表的manager_id）
    const allKeeperIds = new Set(keeperIds);
    warehouses.forEach(w => w.manager_id && allKeeperIds.add(w.manager_id));
    projects.forEach(p => p.manager_id && allKeeperIds.add(p.manager_id));

    const [employees, equipments] = await Promise.all([
      allKeeperIds.size > 0 ? prisma.employees.findMany({
        where: { id: { in: Array.from(allKeeperIds) } },
        select: { id: true, name: true }
      }) : Promise.resolve([]),
      hostEquipmentIds.length > 0 ? prisma.equipment_instances.findMany({
        where: { id: { in: hostEquipmentIds } },
        select: { id: true, equipment_name: true }
      }) : Promise.resolve([])
    ]);
    const employeeMap = new Map(employees.map((e: any) => [e.id, e.name]));
    const equipmentMap = new Map(equipments.map((e: any) => [e.id, e.equipment_name]));

    const dataWithDetails = data.map(item => {
      let locationName = null;
      let dynamicKeeperId = item.keeper_id;

      if (item.location_id) {
        if (item.location_status === 'warehouse') {
          const w = warehouseMap.get(item.location_id);
          locationName = w?.name || null;
          // 优先使用仓库表的管理员作为保管人
          if (w?.manager_id) dynamicKeeperId = w.manager_id;
        } else if (['in_project', 'project', 'project_on'].includes(item.location_status || '')) {
          const p = projectMap.get(item.location_id);
          locationName = p?.name || null;
          // 优先使用项目表的经理作为保管人
          if (p?.manager_id) dynamicKeeperId = p.manager_id;
        }
      }
      
      return {
        ...item,
        location_name: locationName,
        keeper_id: dynamicKeeperId,
        keeper_name: dynamicKeeperId ? employeeMap.get(dynamicKeeperId) || null : null,
        host_equipment_name: item.host_equipment_id ? equipmentMap.get(item.host_equipment_id) || null : null,
        purchase_price: item.purchase_price ? parseFloat(item.purchase_price.toString()) : null,
        purchase_date: item.purchase_date ? item.purchase_date.toISOString().split('T')[0] : null,
        main_image: imagesMap[item.id] || null
      };
    });

    // 汇总逻辑：对未绑定到宿主设备的配件，按同名称、同型号、同位置、同状态、同采购日期、同采购价格进行分组合并数量
    const mergedData: any[] = [];
    const mergeMap = new Map<string, any>();

    for (const item of dataWithDetails) {
      // 绑定到宿主设备的配件不做合并，保持独立显示
      if (item.host_equipment_id) {
        mergedData.push(item);
        continue;
      }

      // 构建分组键：名称 + 型号 + 位置ID + 位置状态 + 采购日期 + 采购价格
      const key = [
        item.accessory_name || '',
        item.model_no || '',
        item.location_id || '',
        item.location_status || '',
        item.purchase_date || '',
        item.purchase_price ?? ''
      ].join('|');

      if (mergeMap.has(key)) {
        const existing = mergeMap.get(key)!;
        existing.quantity = Number(existing.quantity || 0) + Number(item.quantity || 0);
        // 追加子记录的 id 用于后续操作
        if (!existing._merged_ids) existing._merged_ids = [existing.id];
        existing._merged_ids.push(item.id);
      } else {
        mergeMap.set(key, { ...item, _merged_ids: [item.id] });
      }
    }

    // 将合并后的记录加入结果
    for (const merged of mergeMap.values()) {
      mergedData.push(merged);
    }

    return { total, data: mergedData };
  }

  async findUnbound(params: { category?: string; status?: string; keyword?: string; location_id?: string }): Promise<any[]> {
    const { category, status, keyword, location_id } = params;
    const where: any = { host_equipment_id: null, deleted_at: null };

    if (category) where.category = category;
    if (status) where.health_status = status;
    if (location_id) where.location_id = location_id;
    if (keyword) {
      where.OR = [
        { accessory_name: { contains: keyword } },
        { model_no: { contains: keyword } },
        { manage_code: { contains: keyword } }
      ];
    }

    const data = await prisma.equipment_accessory_instances.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    if (data.length === 0) return [];
    
    // Attach images
    const instanceIds = data.map(i => i.id);
    const imagesResult = await prisma.equipment_images.findMany({
      where: {
        equipment_id: { in: instanceIds },
        image_type: { in: ['main', 'accessory'] }
      }
    });

    const imagesMap: Record<string, string> = {};
    for (const img of imagesResult) {
      if (img.equipment_id && !imagesMap[img.equipment_id]) {
        imagesMap[img.equipment_id] = img.image_url;
      }
    }

    // Secondary fallback: find images by name/model for those that still have no image
    const needsFallback = data.filter(item => !imagesMap[item.id]);
    if (needsFallback.length > 0) {
      const fallbackResults = await prisma.equipment_images.findMany({
        where: {
          OR: needsFallback.map(item => ({
            equipment_name: item.accessory_name,
            model_no: item.model_no || null,
            image_type: { in: ['main', 'accessory'] }
          })),
          equipment_id: null // Usually model-level images might not have an ID, or just any past ID
        },
        orderBy: { created_at: 'desc' }
      });

      // If no specific "model" images found, just take any image matching name and model
      const broadFallback = await prisma.equipment_images.findMany({
        where: {
          OR: needsFallback.map(item => ({
            equipment_name: item.accessory_name,
            model_no: item.model_no || null,
            image_type: { in: ['main', 'accessory'] }
          }))
        },
        orderBy: { created_at: 'desc' }
      });

      const combinedFallback = [...fallbackResults, ...broadFallback];
      for (const item of needsFallback) {
        const match = combinedFallback.find(f => f.equipment_name === item.accessory_name && f.model_no === item.model_no);
        if (match) imagesMap[item.id] = match.image_url;
      }
    }

    return data.map(item => ({
      ...item,
      main_image: imagesMap[item.id] || null
    }));
  }

  async findById(id: string): Promise<any | null> {
    const item = await prisma.equipment_accessory_instances.findFirst({
      where: { id, deleted_at: null }
    });
    
    if (!item) return null;
    
    let locationName = null;
    let hostEquipmentName = null;
    let keeperName = null;
    
    if (item.location_id) {
      if (item.location_status === 'warehouse') {
        const warehouse = await prisma.warehouses.findFirst({
          where: { id: item.location_id },
          select: { name: true }
        });
        locationName = warehouse?.name || null;
      } else if (['in_project', 'project', 'project_on'].includes(item.location_status || '')) {
        const project = await prisma.projects.findFirst({
          where: { id: item.location_id },
          select: { name: true }
        });
        locationName = project?.name || null;
      }
    }
    
    if (item.host_equipment_id) {
      const equipment = await prisma.equipment_instances.findFirst({
        where: { id: item.host_equipment_id },
        select: { equipment_name: true }
      });
      hostEquipmentName = equipment?.equipment_name || null;
    }
    
    if (item.keeper_id) {
      const employee = await prisma.employees.findFirst({
        where: { id: item.keeper_id },
        select: { name: true }
      });
      keeperName = employee?.name || null;
    }
    
    const images = await prisma.equipment_images.findMany({
      where: { 
        equipment_id: id,
        image_type: 'accessory'
      },
      select: { image_url: true, image_name: true }
    });
    
    return {
      ...item,
      location_name: locationName,
      host_equipment_name: hostEquipmentName,
      keeper_name: keeperName,
      accessory_images: images.map((img: any) => img.image_url),
      purchase_price: item.purchase_price ? parseFloat(item.purchase_price.toString()) : null,
      purchase_date: item.purchase_date ? item.purchase_date.toISOString().split('T')[0] : null
    };
  }

  async save(accessory: Accessory): Promise<void> {
    const data = accessory.toJSON();
    await prisma.equipment_accessory_instances.upsert({
      where: { id: data.id },
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
        supplier: data.supplier,
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
        supplier: data.supplier,
        host_equipment_id: data.hostEquipmentId,
        usage_status: data.usageStatus as any,
        source_type: data.sourceType as any,
        version: 1
      }
    });
  }

  async update(id: string, updates: any): Promise<void> {
    const data: any = {};
    if (updates.accessory_name !== undefined) data.accessory_name = updates.accessory_name;
    if (updates.model_no !== undefined) data.model_no = updates.model_no;
    if (updates.quantity !== undefined) data.quantity = updates.quantity;
    if (updates.location_id !== undefined) data.location_id = updates.location_id;
    if (updates.location_status !== undefined) data.location_status = updates.location_status;
    if (updates.keeper_id !== undefined) data.keeper_id = updates.keeper_id;
    if (updates.supplier !== undefined) data.supplier = updates.supplier;
    if (updates.host_equipment_id !== undefined) data.host_equipment_id = updates.host_equipment_id;
    if (updates.usage_status !== undefined) data.usage_status = updates.usage_status;

    await prisma.equipment_accessory_instances.update({
      where: { id },
      data: { ...data, updated_at: new Date() }
    });
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.equipment_accessory_instances.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }

  async bindToEquipment(accessoryId: string, hostEquipmentId: string, quantity: number, usageStatus: string): Promise<void> {
    await prisma.equipment_accessory_instances.update({
      where: { id: accessoryId },
      data: {
        host_equipment_id: hostEquipmentId,
        usage_status: usageStatus as any,
        quantity: quantity,
        updated_at: new Date()
      }
    });
  }

  async updateQuantityAndBind(accessoryId: string, quantity: number, hostEquipmentId: string, usageStatus: string): Promise<void> {
    await prisma.equipment_accessory_instances.update({
      where: { id: accessoryId },
      data: {
        quantity: quantity,
        host_equipment_id: hostEquipmentId,
        usage_status: usageStatus as any,
        updated_at: new Date()
      }
    });
  }

  async findLostRecords(accessoryId: string): Promise<any[]> {
    return prisma.equipment_accessory_instances.findMany({
      where: { id: accessoryId, usage_status: 'lost' as any }
    });
  }

  async findByHostEquipmentId(equipmentId: string): Promise<any[]> {
    return prisma.equipment_accessory_instances.findMany({
      where: { host_equipment_id: equipmentId, deleted_at: null }
    });
  }

  async findImagesByAccessoryId(accessoryId: string): Promise<any[]> {
    return prisma.equipment_images.findMany({
      where: {
        equipment_id: accessoryId,
        image_type: { in: ['main', 'accessory'] }
      },
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

  async findAccessoryNames(): Promise<string[]> {
    const [instanceNames, dictionaryNames] = await Promise.all([
      prisma.equipment_accessory_instances.findMany({
        where: { deleted_at: null },
        select: { accessory_name: true },
        distinct: ['accessory_name']
      }),
      prisma.equipment_accessories.findMany({
        select: { accessory_name: true },
        distinct: ['accessory_name']
      })
    ]);
    
    const combined = new Set([
      ...instanceNames.map(i => i.accessory_name),
      ...dictionaryNames.map(i => i.accessory_name)
    ]);
    
    return Array.from(combined).filter(Boolean).sort() as string[];
  }

  async findModelsByName(name: string): Promise<string[]> {
    const [instanceModels, dictionaryModels] = await Promise.all([
      prisma.equipment_accessory_instances.findMany({
        where: { accessory_name: name, deleted_at: null },
        select: { model_no: true },
        distinct: ['model_no']
      }),
      prisma.equipment_accessories.findMany({
        where: { accessory_name: name },
        select: { accessory_model: true },
        distinct: ['accessory_model']
      })
    ]);

    const combined = new Set([
      ...instanceModels.map(i => i.model_no),
      ...dictionaryModels.map(i => i.accessory_model)
    ]);

    return Array.from(combined).filter(Boolean).sort() as string[];
  }
}
