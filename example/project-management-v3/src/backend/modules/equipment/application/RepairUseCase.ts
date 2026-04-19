import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRepairOrderDto {
  equipment_id: string;
  equipment_name?: string;
  model_no?: string;
  equipment_category: string;
  repair_quantity: number;
  fault_description: string;
  repair_type?: string;
  repair_unit?: string;
  estimated_cost?: number;
  location_id?: string;
  location_type?: string;
  location_manager_id?: string;
}

@singleton()
export class RepairUseCase {
  async createRepairOrder(data: CreateRepairOrderDto, userId: string, userName: string) {
    // 仅仅创建业务记录，暂不进行库存拆分。拆分将在“发货”确认时执行。
    const orderNo = `REP${Date.now()}`;
    const id = uuidv4();

    // 获取管理员姓名以便后续显示
    let fromManagerName = '';
    if (data.location_manager_id) {
       const employee = await prisma.employees.findUnique({
         where: { id: data.location_manager_id },
         select: { name: true }
       });
       if (employee) fromManagerName = employee.name;
    }

    const order = await prisma.equipment_repair_orders.create({
      data: {
        id,
        order_no: orderNo,
        equipment_id: data.equipment_id,
        equipment_name: data.equipment_name,
        equipment_category: data.equipment_category,
        repair_quantity: data.repair_quantity,
        fault_description: data.fault_description,
        repair_type: data.repair_type as any,
        repair_unit: data.repair_unit,
        estimated_cost: data.estimated_cost || 0,
        applicant: userName,
        applicant_id: userId,
        apply_date: new Date(),
        status: 'pending_ship', // 初始状态：待发货
        original_location_id: data.location_id,
        original_location_type: data.location_type,
        from_manager_id: data.location_manager_id,
        from_manager: fromManagerName
      }
    });

    return order;
  }

  /**
   * 执行发货：真正的库存拆分发生在这里
   */
  async shipRepairOrder(
    id: string, 
    shippedBy: string, 
    shippingData: {
      shipping_no?: string;
      shipped_at?: string;
      shipping_remark?: string;
      item_images?: { item_id: string; images: string[] }[];
      package_images?: string[];
    }
  ) {
    const order = await prisma.equipment_repair_orders.findUnique({
      where: { id }
    });

    if (!order || order.status !== 'pending_ship') {
      throw new Error('订单不存在或状态不正确');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. 处理库存记录更新与拆分
      let repairEquipmentId = order.equipment_id;
      const isAccessory = order.equipment_category === 'accessory';
      const isFakeLoad = order.equipment_category === 'fake_load' || order.equipment_category === 'load';

      if (isAccessory) {
        // 配件处理
        const source = await tx.equipment_accessory_instances.findUnique({ where: { id: order.equipment_id } });
        if (!source) throw new Error('配件记录不存在');

        const totalQty = Number(source.quantity || 0);
        const repairQty = Number(order.repair_quantity || 1);

        if (totalQty > repairQty) {
          // 部分维修：拆分
          const newId = uuidv4();
          const { id: _, created_at, updated_at, ...copyData } = source;
          await tx.equipment_accessory_instances.create({
            data: {
              ...copyData as any,
              id: newId,
              quantity: repairQty,
              location_status: 'repairing' as any,
              usage_status: 'in_use' as any,
              manage_code: source.manage_code ? `${source.manage_code}-R` : null,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          // 扣减原记录
          await tx.equipment_accessory_instances.update({
            where: { id: source.id },
            data: { quantity: { decrement: repairQty }, updated_at: new Date() }
          });
          repairEquipmentId = newId;
          // 复制原有的证照图片到新拆分出的“维修中”记录
          await this.copyEquipmentImages(source.id, newId, tx);
        } else {
          // 全额维修：仅更新状态
          await tx.equipment_accessory_instances.update({
            where: { id: source.id },
            data: { location_status: 'repairing' as any, usage_status: 'in_use' as any, updated_at: new Date() }
          });
        }
      } else if (isFakeLoad) {
        // 假负载处理 (支持数量 > 1 的主机记录)
        const source = await tx.equipment_instances.findUnique({ where: { id: order.equipment_id } });
        if (!source) throw new Error('设备记录不存在');

        const totalQty = Number(source.quantity || 1);
        const repairQty = Number(order.repair_quantity || 1);

        if (totalQty > repairQty) {
          // 部分维修：拆分
          const newId = uuidv4();
          const { id: _, created_at, updated_at, ...copyData } = source;
          await tx.equipment_instances.create({
            data: {
              ...copyData as any,
              id: newId,
              quantity: repairQty,
              location_status: 'repairing' as any,
              usage_status: 'in_use' as any,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          // 扣减原记录
          await tx.equipment_instances.update({
            where: { id: source.id },
            data: { quantity: { decrement: repairQty }, updated_at: new Date() }
          });
          repairEquipmentId = newId;
          // 复制原有的证照图片到新拆分出的“维修中”记录
          await this.copyEquipmentImages(source.id, newId, tx);
        } else {
          // 全额维修：更新状态
          await tx.equipment_instances.update({
            where: { id: source.id },
            data: { location_status: 'repairing' as any, usage_status: 'in_use' as any, updated_at: new Date() }
          });
        }
      } else {
        // 仪器类：始终认为是 1:1，只更新状态
        await tx.equipment_instances.update({
          where: { id: order.equipment_id },
          data: { location_status: 'repairing' as any, usage_status: 'in_use' as any, updated_at: new Date() }
        });
      }

      // 2. 更新订单状态和发货存证
      const updatedOrder = await tx.equipment_repair_orders.update({
        where: { id },
        data: {
          status: 'repairing',
          shipped_at: shippingData.shipped_at ? new Date(shippingData.shipped_at) : new Date(),
          shipped_by: shippedBy,
          shipping_no: shippingData.shipping_no || `SHP-REP-${Date.now()}`,
          shipping_remark: shippingData.shipping_remark || '',
          shipping_images: {
            item_images: shippingData.item_images || [],
            package_images: shippingData.package_images || []
          } as any,
          equipment_id: repairEquipmentId,
          updated_at: new Date()
        }
      });

      return updatedOrder;
    });
  }

  /**
   * 执行收货：维修完成后的归退逻辑
   */
  async receiveRepairOrder(id: string, receivedBy: string) {
    const order = await prisma.equipment_repair_orders.findUnique({
        where: { id }
    });

    if (!order || order.status !== 'repairing') {
        throw new Error('订单状态不正确，无法收货');
    }

    return await prisma.$transaction(async (tx) => {
        // 1. 获取目标位置的最新负责人 (自动同步逻辑)
        const targetLocationType = order.original_location_type || 'warehouse';
        const targetLocationId = order.original_location_id;
        const targetLocationStatus = targetLocationType === 'project' ? 'in_project' : 'warehouse';
        
        // 动态查询该位置当前的负责人
        let targetKeeperId: string | null = null;
        if (targetLocationId) {
          if (targetLocationType === 'project') {
            const project = await tx.projects.findUnique({
              where: { id: targetLocationId },
              select: { manager_id: true }
            });
            targetKeeperId = project?.manager_id || null;
          } else {
            const warehouse = await tx.warehouses.findUnique({
              where: { id: targetLocationId },
              select: { manager_id: true }
            });
            targetKeeperId = warehouse?.manager_id || null;
          }
        }

        // 如果动态查询没拿到，才降级使用订单快照
        if (!targetKeeperId) {
          targetKeeperId = order.from_manager_id || null;
        }

        if (order.equipment_category === 'accessory') {
            await this.moveAndMergeAccessory(tx, order.equipment_id, { 
                location_id: order.original_location_id, 
                location_status: targetLocationStatus as any, 
                usage_status: 'idle' as any,
                keeper_id: targetKeeperId,
                updated_at: new Date() 
            });
        } else {
            // 仪器类/假负载
            await this.moveAndMergeEquipment(tx, order.equipment_id, { 
                location_id: order.original_location_id, 
                location_status: targetLocationStatus as any, 
                usage_status: 'idle' as any,
                keeper_id: targetKeeperId,
                updated_at: new Date() 
            });
                                
            // 如果是主机，同步更新下属配件（解除维修状态，跟随主机归队）
            await tx.equipment_accessory_instances.updateMany({
                where: { host_equipment_id: order.equipment_id },
                data: { 
                    location_id: order.original_location_id, 
                    location_status: targetLocationStatus as any, 
                    usage_status: 'in_use' as any, // 绑定的配件通常是 in_use
                    keeper_id: targetKeeperId,
                    updated_at: new Date() 
                }
            });
        }

        // 2. 完成订单
        const completedOrder = await tx.equipment_repair_orders.update({
            where: { id },
            data: {
                status: 'completed',
                repair_completed_at: new Date()
            }
        });

        return completedOrder;
    });
  }

  async getById(id: string) {
    return prisma.equipment_repair_orders.findUnique({
      where: { id }
    });
  }

  async getList(params: { status?: string; page: number; pageSize: number }) {
    const where: any = {};
    if (params.status) where.status = params.status;

    const [total, data] = await Promise.all([
      prisma.equipment_repair_orders.count({ where }),
      prisma.equipment_repair_orders.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { created_at: 'desc' }
      })
    ]);

    return { total, data };
  }

  // --- 合并辅助方法 (与 TransferUseCase 保持严谨一致) ---

  private async moveAndMergeEquipment(tx: any, id: string, target: any) {
    const source = await tx.equipment_instances.findUnique({ where: { id } });
    if (!source) return id;

    // 如果有管理编码，或者是仪器类设备，则不进行数量层面的合并（唯一性）
    if (source.manage_code) {
      await tx.equipment_instances.update({ where: { id }, data: target });
      return id;
    }

    // 寻找完全匹配的现有闲置记录（假负载/线缆等批量设备）
    const where: any = {
      equipment_name: source.equipment_name,
      model_no: source.model_no || null,
      brand: source.brand || null,
      manage_code: null,
      location_id: target.location_id,
      location_status: target.location_status,
      usage_status: target.usage_status,
      deleted_at: null
    };

    const existing = await tx.equipment_instances.findFirst({ where });
    if (existing && existing.id !== id) {
      // 合并数量
      await tx.equipment_instances.update({
        where: { id: existing.id },
        data: { quantity: { increment: Number(source.quantity || 1) }, updated_at: new Date() }
      });
      // 迁移图片
      await this.copyEquipmentImages(id, existing.id, tx);
      // 迁移下属配件
      await tx.equipment_accessory_instances.updateMany({
        where: { host_equipment_id: id },
        data: { host_equipment_id: existing.id }
      });
      // 删除归队后的临时记录
      await tx.equipment_instances.delete({ where: { id } });
      return existing.id;
    }

    await tx.equipment_instances.update({ where: { id }, data: target });
    return id;
  }

  private async moveAndMergeAccessory(tx: any, id: string, target: any) {
    const source = await tx.equipment_accessory_instances.findUnique({ where: { id } });
    if (!source) return id;

    // 寻找同型号、同参数、同来源的现有闲置记录
    const where: any = {
      accessory_name: source.accessory_name,
      model_no: source.model_no || null,
      brand: source.brand || null,
      manage_code: source.manage_code || null,
      category: source.category || null,
      health_status: source.health_status || null,
      purchase_date: source.purchase_date || null,
      supplier: source.supplier || null,
      purchase_price: source.purchase_price || null,
      location_id: target.location_id,
      location_status: target.location_status,
      usage_status: target.usage_status,
      host_equipment_id: source.host_equipment_id || null,
      deleted_at: null
    };

    const existing = await tx.equipment_accessory_instances.findFirst({ where });

    if (existing && existing.id !== id) {
      await tx.equipment_accessory_instances.update({
        where: { id: existing.id },
        data: { quantity: { increment: Number(source.quantity || 1) }, updated_at: new Date() }
      });
      await this.copyEquipmentImages(id, existing.id, tx);
      await tx.equipment_accessory_instances.delete({ where: { id } });
      return existing.id;
    }

    await tx.equipment_accessory_instances.update({ where: { id }, data: target });
    return id;
  }

  private async copyEquipmentImages(sourceId: string, targetId: string, tx: any) {
    try {
      const images = await tx.equipment_images.findMany({ where: { equipment_id: sourceId } });
      for (const img of images) {
        const { id, created_at, updated_at, ...copyData } = img;
        await tx.equipment_images.create({
          data: { ...copyData, id: uuidv4(), equipment_id: targetId }
        });
      }
    } catch (e) {
      console.error('[RepairUseCase] 复制图片失败:', e);
    }
  }
}
