import { singleton, inject } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger.js';
import type { IEquipmentRepository } from '../domain/IEquipmentRepository.js';

export interface TransferOrderItemDto {
  equipment_id?: string;
  equipment_name: string;
  model_no?: string;
  brand?: string;
  category: string;
  unit?: string;
  manage_code?: string;
  serial_number?: string;
  quantity: number;
  notes?: string;
  accessories?: any[];
  accessory_desc?: string;
  is_accessory?: boolean;
}

export interface CreateTransferOrderDto {
  from_location_type?: string;
  fromLocationType?: string;
  from_warehouse_id?: string;
  from_project_id?: string;
  to_location_type?: string;
  toLocationType?: string;
  to_warehouse_id?: string;
  to_project_id?: string;
  transfer_reason?: string;
  transferReason?: string;
  estimated_arrival_date?: string | null;
  estimatedArrivalDate?: string | null;
  estimated_ship_date?: string;
  items: TransferOrderItemDto[];
  fromManagerId?: string;
  toManagerId?: string;
  fromLocationId?: string;
  toLocationId?: string;
}

export interface TransferQueryParams {
  status?: string;
  from_warehouse_id?: string;
  from_project_id?: string;
  to_warehouse_id?: string;
  to_project_id?: string;
  applicant_id?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@singleton()
export class TransferUseCase {
  constructor(
    @inject('IEquipmentRepository') private equipmentRepo: IEquipmentRepository
  ) {}

  private generateOrderNo(): string {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DB${dateStr}${random}`;
  }

  private async resolveLocationInfo(locationType: string, warehouseId?: string, projectId?: string) {
    if (locationType === 'warehouse' && warehouseId) {
      const warehouse = await prisma.warehouses.findUnique({
        where: { id: warehouseId },
        select: { name: true, manager_id: true }
      });
      if (!warehouse) return { locationName: null, managerId: null, managerName: null };

      let managerName: string | null = null;
      if (warehouse.manager_id) {
        const manager = await prisma.employees.findUnique({
          where: { id: warehouse.manager_id },
          select: { name: true }
        });
        managerName = manager?.name ?? null;
      }
      return { locationName: warehouse.name, managerId: warehouse.manager_id, managerName };
    }

    if ((locationType === 'project') && projectId) {
      const proj = await prisma.projects.findUnique({
        where: { id: projectId },
        select: { name: true, manager_id: true }
      });
      if (!proj) return { locationName: null, managerId: null, managerName: null };

      let managerName: string | null = null;
      if (proj.manager_id) {
        const manager = await prisma.employees.findUnique({
          where: { id: proj.manager_id },
          select: { name: true }
        });
        managerName = manager?.name ?? null;
      }
      return { locationName: proj.name, managerId: proj.manager_id, managerName };
    }

    return { locationName: null, managerId: null, managerName: null };
  }

  async createOrder(dto: CreateTransferOrderDto, userId: string, userName: string) {
    const id = uuidv4();
    const orderNo = this.generateOrderNo();

    const fromLocationType = dto.from_location_type || dto.fromLocationType || 'warehouse';
    const toLocationType = dto.to_location_type || dto.toLocationType || 'warehouse';
    const fromLocationId = dto.from_warehouse_id || dto.from_project_id || dto.fromLocationId;
    const toLocationId = dto.to_warehouse_id || dto.to_project_id || dto.toLocationId;

    const accessoryItems = dto.items.filter(item => item.is_accessory && item.equipment_id);
    if (accessoryItems.length > 0) {
      const accessoryIds = accessoryItems.map(item => item.equipment_id!);
      const boundAccessories = await prisma.equipment_accessory_instances.findMany({
        where: {
          id: { in: accessoryIds },
          host_equipment_id: { not: null }
        },
        select: { id: true, accessory_name: true }
      });
      
      if (boundAccessories.length > 0) {
        const boundNames = boundAccessories.map(a => a.accessory_name).join('、');
        throw new Error(`以下配件已绑定到设备，不能单独调拨：${boundNames}。请随主机一起调拨或先解除绑定。`);
      }
    }

    const [fromInfo, toInfo] = await Promise.all([
      this.resolveLocationInfo(fromLocationType, fromLocationType === 'warehouse' ? fromLocationId : undefined, fromLocationType === 'project' ? fromLocationId : undefined),
      this.resolveLocationInfo(toLocationType, toLocationType === 'warehouse' ? toLocationId : undefined, toLocationType === 'project' ? toLocationId : undefined)
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.equipment_transfer_orders.create({
        data: {
          id,
          order_no: orderNo,
          transfer_scene: 'A',
          applicant_id: userId,
          applicant: userName,
          apply_date: new Date(),
          from_location_type: fromLocationType as any,
          from_warehouse_id: fromLocationId,
          from_warehouse_name: fromInfo.locationName,
          from_project_id: fromLocationId,
          from_project_name: fromLocationType === 'project' ? fromInfo.locationName : null,
          from_manager_id: fromInfo.managerId,
          from_manager: fromInfo.managerName,
          to_location_type: toLocationType as any,
          to_warehouse_id: toLocationId,
          to_warehouse_name: toInfo.locationName,
          to_project_id: toLocationId,
          to_project_name: toLocationType === 'project' ? toInfo.locationName : null,
          to_manager_id: toInfo.managerId,
          to_manager: toInfo.managerName,
          transfer_reason: dto.transfer_reason || dto.transferReason || '',
          estimated_arrival_date: dto.estimated_arrival_date ? new Date(dto.estimated_arrival_date) : (dto.estimatedArrivalDate ? new Date(dto.estimatedArrivalDate) : null),
          status: 'pending_from',
          total_items: dto.items.length,
          total_quantity: dto.items.reduce((s, i) => s + i.quantity, 0)
        }
      });

      for (const item of dto.items) {
        let normalizedCategory: any = 'instrument';
        const cat = (item.category || '').toLowerCase();
        if (cat.includes('instrument') || cat.includes('仪器')) normalizedCategory = 'instrument';
        else if (cat.includes('fake_load') || cat.includes('load') || cat.includes('负载')) normalizedCategory = 'fake_load';
        else if (cat.includes('accessory') || cat.includes('配件')) normalizedCategory = 'accessory';
        else normalizedCategory = 'instrument';

        await tx.equipment_transfer_order_items.create({
          data: {
            id: uuidv4(),
            order_id: id,
            equipment_id: item.equipment_id || null,
            equipment_name: item.equipment_name,
            model_no: item.model_no || null,
            brand: item.brand || null,
            category: normalizedCategory,
            unit: item.unit || '台',
            manage_code: item.manage_code || null,
            serial_number: item.serial_number || null,
            quantity: item.quantity,
            is_accessory: (item.is_accessory || normalizedCategory === 'accessory') ? true : false
          }
        });
      }
    });

    return this.getById(id);
  }

  async getList(params: TransferQueryParams) {
    const { status, from_warehouse_id, from_project_id, to_warehouse_id, to_project_id, applicant_id, search, page = 1, pageSize = 20 } = params;
    const where: any = {};
    if (status) where.status = status;
    if (from_warehouse_id) where.from_warehouse_id = from_warehouse_id;
    if (from_project_id) where.from_project_id = from_project_id;
    if (to_warehouse_id) where.to_warehouse_id = to_warehouse_id;
    if (to_project_id) where.to_project_id = to_project_id;
    if (applicant_id) where.applicant_id = applicant_id;
    if (search) {
      where.OR = [
        { order_no: { contains: search } },
        { applicant: { contains: search } }
      ];
    }
    const [total, orders] = await Promise.all([
      prisma.equipment_transfer_orders.count({ where }),
      prisma.equipment_transfer_orders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    return { data: orders, total };
  }

  async getById(id: string) {
    const order = await prisma.equipment_transfer_orders.findUnique({ where: { id } });
    if (!order) return null;
    const items = await prisma.equipment_transfer_order_items.findMany({ where: { order_id: id } });
    return { ...order, items };
  }

  async confirmShipping(id: string, params: {
    shipped_at?: string;
    shipping_no?: string;
    shipped_by?: string;
    shipping_attachment?: string;
    package_images?: string[];
    item_images?: { item_id: string; images: string[] }[];
    item_quantities?: { item_id: string; quantity: number }[];
  }) {
    const order = await this.getById(id);
    if (!order) throw new Error('调拨单不存在');

    logger.info('[TransferUseCase.confirmShipping] 开始发货', { orderId: id });

    await prisma.$transaction(async (tx) => {
      let finalTotalShippedQty = 0;

      for (const item of order.items || []) {
        const itemImg = params.item_images?.find(pi => pi.item_id === item.id);
        const currentShippingImages = itemImg?.images || (item as any).shipping_images || [];
        const qtyOverride = params.item_quantities?.find(q => q.item_id === item.id);
        const finalFulfillmentQty = qtyOverride ? Number(qtyOverride.quantity) : Number(item.quantity);

        if (!item.equipment_id) {
          if (currentShippingImages.length > 0) {
            await tx.equipment_transfer_order_items.update({
              where: { id: item.id },
              data: { shipping_images: currentShippingImages as any, quantity: finalFulfillmentQty }
            });
          }
          finalTotalShippedQty += finalFulfillmentQty;
          continue;
        }

        const isAccessoryItem = item.is_accessory || (item.category as string) === 'accessory';
        let source: any = isAccessoryItem
          ? await tx.equipment_accessory_instances.findUnique({ where: { id: item.equipment_id } })
          : await tx.equipment_instances.findUnique({ where: { id: item.equipment_id } });

        if (!source) {
          logger.warn(`[confirmShipping] 记录缺失: ${item.equipment_id}`);
          continue;
        }

        const currentAvailable = Number(source.quantity || 1);
        const isBatchEquipment = !isAccessoryItem && !source.manage_code;
        let finalId = item.equipment_id;

        if (isBatchEquipment && finalFulfillmentQty > 0) {
          // 非仪器类设备（假负载/线缆/BATCH设备）：始终创建调拨专用记录
          // 即使全额调拨，也要创建新的 transferring 记录用于追踪
          const transferId = `TR-${uuidv4().slice(-12)}`;
          const { id: _, created_at, updated_at, ...dataToCopy } = source;
          await tx.equipment_instances.create({
            data: {
              ...dataToCopy,
              id: transferId,
              quantity: finalFulfillmentQty,
              location_status: 'transferring',
              manage_code: null,
              created_at: new Date(),
              updated_at: new Date()
            } as any
          });

          if (finalFulfillmentQty < currentAvailable) {
            await tx.equipment_instances.update({
              where: { id: item.equipment_id },
              data: { quantity: { decrement: finalFulfillmentQty }, updated_at: new Date() }
            });
          } else {
            await tx.equipment_instances.delete({
              where: { id: item.equipment_id }
            });
          }

          await this.copyEquipmentImages(item.equipment_id, transferId, tx);

          const boundAccs = await tx.equipment_accessory_instances.findMany({
            where: { host_equipment_id: item.equipment_id }
          });
          for (const acc of boundAccs) {
            await tx.equipment_accessory_instances.update({
              where: { id: acc.id },
              data: { host_equipment_id: transferId, location_status: 'transferring', updated_at: new Date() }
            });
          }

          finalId = transferId;
        } else if (finalFulfillmentQty < currentAvailable && finalFulfillmentQty > 0) {
          // 仪器类设备部分调拨：创建新记录
          const newId = uuidv4();
          const { id: _, created_at, updated_at, ...dataToCopy } = source;
          const newData = { ...dataToCopy, id: newId, quantity: finalFulfillmentQty, location_status: 'transferring', updated_at: new Date() };

          if (isAccessoryItem) {
            await tx.equipment_accessory_instances.create({ data: newData });
            await tx.equipment_accessory_instances.update({ where: { id: item.equipment_id }, data: { quantity: { decrement: finalFulfillmentQty }, updated_at: new Date() } });
          } else {
            await tx.equipment_instances.create({ data: newData });
            await tx.equipment_instances.update({ where: { id: item.equipment_id }, data: { quantity: { decrement: finalFulfillmentQty }, updated_at: new Date() } });
            const boundAccs = await tx.equipment_accessory_instances.findMany({ where: { host_equipment_id: item.equipment_id } });
            for (const acc of boundAccs) {
              await tx.equipment_accessory_instances.update({ where: { id: acc.id }, data: { host_equipment_id: newId, location_status: 'transferring', updated_at: new Date() } });
            }
          }
          await this.copyEquipmentImages(item.equipment_id, newId, tx);
          finalId = newId;
        } else {
          // 仪器类设备全额调拨：直接更新状态
          if (isAccessoryItem) {
            await tx.equipment_accessory_instances.update({
              where: { id: item.equipment_id },
              data: { location_status: 'transferring', updated_at: new Date() }
            });
          } else {
            await tx.equipment_instances.update({
              where: { id: item.equipment_id },
              data: { location_status: 'transferring', updated_at: new Date() }
            });
            await tx.equipment_accessory_instances.updateMany({
              where: { host_equipment_id: item.equipment_id },
              data: { location_status: 'transferring', updated_at: new Date() }
            });
          }
        }

        await tx.equipment_transfer_order_items.update({
          where: { id: item.id },
          data: { 
            equipment_id: finalId, 
            quantity: finalFulfillmentQty, 
            shipping_images: currentShippingImages as any,
            status: 'transferred'
          }
        });
        finalTotalShippedQty += finalFulfillmentQty;
      }

      // 构建更新数据：仅当新值非空时才覆盖，保护已有的发货数据不被空值覆盖
      const updateData: any = {
        status: 'receiving',
        total_quantity: finalTotalShippedQty,
        shipped_at: params.shipped_at ? new Date(params.shipped_at) : (order.shipped_at || new Date()),
        updated_at: new Date()
      };
      // 仅当有非空值时才更新字符串字段，避免空字符串或 undefined 覆盖已有数据
      if (params.shipping_no) updateData.shipping_no = params.shipping_no;
      if (params.shipped_by) updateData.shipped_by = params.shipped_by;
      if (params.shipping_attachment) updateData.shipping_attachment = params.shipping_attachment;
      if (params.package_images && params.package_images.length > 0) {
        updateData.shipping_package_images = params.package_images as any;
      }

      await tx.equipment_transfer_orders.update({
        where: { id },
        data: updateData
      });
    });

    return this.getById(id);
  }

  async confirmReceiving(id: string, params: {
    received_by?: string;
    received_at?: string;
    receive_status?: string;
    receive_comment?: string;
    received_items?: { item_id: string; received_quantity: number; receiving_images?: string[] }[];
    package_images?: string[];
  }) {
    const order = await this.getById(id);
    if (!order) throw new Error('调拨单不存在');

    logger.info('[TransferUseCase.confirmReceiving] 开始收货处理', {
      orderId: id,
      receive_status: params.receive_status,
      received_items_count: params.received_items?.length,
      received_items: params.received_items?.map(ri => ({
        item_id: ri.item_id,
        received_quantity: ri.received_quantity
      }))
    });

    const toLocId = (order.to_location_type === 'warehouse' ? order.to_warehouse_id : order.to_project_id) as string;
    const toStatus = order.to_location_type === 'warehouse' ? 'warehouse' : 'in_project';
    const fromLocId = (order.from_location_type === 'warehouse' ? order.from_warehouse_id : order.from_project_id) as string;
    const fromStatus = order.from_location_type === 'warehouse' ? 'warehouse' : 'in_project';

    const [toLoc, fromLoc] = await Promise.all([
      this.equipmentRepo.findLocationDetails(toLocId),
      this.equipmentRepo.findLocationDetails(fromLocId)
    ]);

    await prisma.$transaction(async (tx) => {
      let allReceivedInFull = true;
      for (const item of order.items || []) {
        const receivedInfo = params.received_items?.find(ri => ri.item_id === item.id);
        const receivedQty = receivedInfo ? Number(receivedInfo.received_quantity) : Number(item.quantity);
        logger.info(`[confirmReceiving] item: ${item.id}, 调拨数量: ${item.quantity}, 收货数量: ${receivedQty}`);
        if (receivedQty < Number(item.quantity)) allReceivedInFull = false;

        await tx.equipment_transfer_order_items.update({
          where: { id: item.id },
          data: {
            received_quantity: receivedQty,
            receiving_images: (receivedInfo?.receiving_images || []) as any
          }
        });
      }

      const isPartial = params.receive_status === 'partial' || !allReceivedInFull;
      const finalStatus = isPartial ? 'partial_received' : 'completed';

      if (!isPartial) {
        logger.info(`[confirmReceiving] 全额收货，开始移动设备到新位置: ${toLocId}`);
        for (const item of order.items || []) {
          if (!item.equipment_id) continue;
          const isAcc = item.is_accessory || item.category === 'accessory';
          logger.info(`[confirmReceiving] 移动设备: ${item.equipment_id}, 类型: ${isAcc ? '配件' : '设备'}`);
          if (isAcc) {
            await this.moveAndMergeAccessory(tx, item.equipment_id, { location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, updated_at: new Date() });
          } else {
            await this.moveAndMergeEquipment(tx, item.equipment_id, { location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, updated_at: new Date() });
            await tx.equipment_accessory_instances.updateMany({
              where: { host_equipment_id: item.equipment_id },
              data: { location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, updated_at: new Date() }
            });
          }
        }
      } else {
        logger.info(`[confirmReceiving] 部分收货，只记录收货状态，库存处理推迟到发货人复核后`);
        // 部分收货时，推迟设备移动逻辑
      }

      await tx.equipment_transfer_orders.update({
        where: { id },
        data: {
          status: finalStatus,
          received_at: params.received_at ? new Date(params.received_at) : new Date(),
          receive_status: (isPartial ? 'partial' : 'normal') as any,
          receive_comment: params.receive_comment || null,
          receiving_package_images: (params.package_images || []) as any,
          updated_at: new Date()
        }
      });
    });
    return true;
  }

  async finalizePartialReceiving(id: string) {
    const order = await this.getById(id);
    if (!order) throw new Error('调拨单不存在');

    logger.info(`[finalizePartialReceiving] 开始处理部分收货后库存转移`, { orderId: id });

    const toLocId = (order.to_location_type === 'warehouse' ? order.to_warehouse_id : order.to_project_id) as string;
    const toStatus = order.to_location_type === 'warehouse' ? 'warehouse' : 'in_project';
    const fromLocId = (order.from_location_type === 'warehouse' ? order.from_warehouse_id : order.from_project_id) as string;
    const fromStatus = order.from_location_type === 'warehouse' ? 'warehouse' : 'in_project';

    const [toLoc, fromLoc] = await Promise.all([
      this.equipmentRepo.findLocationDetails(toLocId),
      this.equipmentRepo.findLocationDetails(fromLocId)
    ]);

    await prisma.$transaction(async (tx) => {
      for (const item of order.items || []) {
        if (!item.equipment_id) continue;
        const expected = Number(item.quantity);
        const received = Number(item.received_quantity) || 0;
        const isAcc = item.is_accessory || item.category === 'accessory';

        logger.info(`[finalizePartialReceiving] 处理设备: ${item.equipment_id}, 期望: ${expected}, 收到: ${received}`);

        if (received <= 0) {
          const rollbackTarget = {
            location_id: fromLocId,
            location_status: fromStatus as any,
            keeper_id: fromLoc.manager_id,
            usage_status: 'idle' as any,
            updated_at: new Date()
          };
          if (isAcc) {
            await tx.equipment_accessory_instances.update({ where: { id: item.equipment_id }, data: rollbackTarget });
          } else {
            await tx.equipment_instances.update({ where: { id: item.equipment_id }, data: rollbackTarget });
            await tx.equipment_accessory_instances.updateMany({
              where: { host_equipment_id: item.equipment_id },
              data: { location_id: fromLocId, location_status: fromStatus, keeper_id: fromLoc.manager_id, usage_status: 'idle', updated_at: new Date() }
            });
          }
        } else if (received >= expected) {
          const target = {
            location_id: toLocId,
            location_status: toStatus as any,
            keeper_id: toLoc.manager_id,
            usage_status: 'in_use' as any,
            updated_at: new Date()
          };
          if (isAcc) {
            await this.moveAndMergeAccessory(tx, item.equipment_id, target);
          } else {
            await this.moveAndMergeEquipment(tx, item.equipment_id, target);
            await tx.equipment_accessory_instances.updateMany({
              where: { host_equipment_id: item.equipment_id },
              data: { location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, updated_at: new Date() }
            });
          }
        } else {
          // split logic
          if (isAcc) {
            const source = await tx.equipment_accessory_instances.findUnique({ where: { id: item.equipment_id } });
            if (source) {
              const { id: _, created_at, updated_at, ...copyData } = source;
              const newRecordId = uuidv4();
              await tx.equipment_accessory_instances.create({
                data: { ...copyData, id: newRecordId, quantity: received, location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, usage_status: 'in_use', updated_at: new Date() } as any
              });
              const remaining = expected - received;
              if (remaining > 0) {
                await tx.equipment_accessory_instances.update({
                  where: { id: item.equipment_id },
                  data: { quantity: remaining, location_id: fromLocId, location_status: fromStatus, keeper_id: fromLoc.manager_id, usage_status: 'idle', updated_at: new Date() }
                });
              } else {
                await tx.equipment_accessory_instances.delete({ where: { id: item.equipment_id } });
              }
              await tx.equipment_transfer_order_items.update({ where: { id: item.id }, data: { equipment_id: newRecordId } });
            }
          } else {
            const source = await tx.equipment_instances.findUnique({ where: { id: item.equipment_id } });
            if (source) {
              const { id: _, created_at, updated_at, ...copyData } = source;
              const newRecordId = uuidv4();
              await tx.equipment_instances.create({
                data: { ...copyData, id: newRecordId, quantity: received, location_id: toLocId, location_status: toStatus, keeper_id: toLoc.manager_id, usage_status: 'in_use', created_at: new Date(), updated_at: new Date() } as any
              });
              await this.copyEquipmentImages(item.equipment_id, newRecordId, tx);
              await tx.equipment_accessory_instances.updateMany({
                where: { host_equipment_id: item.equipment_id },
                data: { host_equipment_id: newRecordId, location_id: toLocId, location_status: toStatus, updated_at: new Date() }
              });
              const remaining = expected - received;
              if (remaining > 0) {
                await tx.equipment_instances.update({
                  where: { id: item.equipment_id },
                  data: { quantity: remaining, location_id: fromLocId, location_status: fromStatus, keeper_id: fromLoc.manager_id, usage_status: 'idle', updated_at: new Date() }
                });
              } else {
                await tx.equipment_instances.delete({ where: { id: item.equipment_id } });
              }
              await tx.equipment_transfer_order_items.update({ where: { id: item.id }, data: { equipment_id: newRecordId } });
            }
          }
        }
      }

      await tx.equipment_transfer_orders.update({
        where: { id },
        data: {
          status: 'completed',
          updated_at: new Date()
        }
      });
    });

    return true;
  }

  private async moveAndMergeEquipment(tx: any, id: string, target: any) {
    const source = await tx.equipment_instances.findUnique({ where: { id } });
    if (!source) {
      return id;
    }
    const isTransferRecord = id.startsWith('TR-');
    // 如果是管理编码设备，或者是没有管理编码但 ID 不是 TR- 的设备且目前不可合并，则直接更新
    if (source.manage_code || (isTransferRecord && source.manage_code)) {
      await tx.equipment_instances.update({ where: { id }, data: target });
      return id;
    }
    const where: any = {
      equipment_name: source.equipment_name,
      model_no: source.model_no,
      brand: source.brand,
      manage_code: null,
      location_id: target.location_id,
      location_status: target.location_status,
      deleted_at: null
    };
    const existing = await tx.equipment_instances.findFirst({ where });
    if (existing && existing.id !== id) {
      await tx.equipment_instances.update({ where: { id: existing.id }, data: { quantity: { increment: Number(source.quantity || 0) }, updated_at: new Date() } });
      await this.copyEquipmentImages(id, existing.id, tx);
      await tx.equipment_accessory_instances.updateMany({ where: { host_equipment_id: id }, data: { host_equipment_id: existing.id } });
      await tx.equipment_instances.delete({ where: { id } });
      return existing.id;
    }
    await tx.equipment_instances.update({ where: { id }, data: target });
    return id;
  }

  private async moveAndMergeAccessory(tx: any, id: string, target: any) {
    const source = await tx.equipment_accessory_instances.findUnique({ where: { id } });
    if (!source) return id;

    const where: any = {
      accessory_name: source.accessory_name,
      model_no: source.model_no || null,
      brand: source.brand || null,
      manage_code: source.manage_code,
      location_id: target.location_id,
      location_status: target.location_status,
      host_equipment_id: source.host_equipment_id || null,
      health_status: source.health_status || null,
      purchase_date: source.purchase_date || null,
      supplier: source.supplier || null,
      purchase_price: source.purchase_price || null,
      deleted_at: null
    };
    const existing = await tx.equipment_accessory_instances.findFirst({ where });

    if (existing && existing.id !== id) {
      await tx.equipment_accessory_instances.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity || 0) + (source.quantity || 0), updated_at: new Date() }
      });
      await this.copyEquipmentImages(id, existing.id, tx);
      await tx.equipment_accessory_instances.delete({ where: { id } });
      return existing.id;
    }

    await tx.equipment_accessory_instances.update({ where: { id }, data: target });
    return id;
  }

  private async mergeOrCreateAccessory(tx: any, data: any): Promise<string> {
    const { id, created_at, updated_at, quantity, ...searchData } = data;

    if (searchData.manage_code) {
      const existing = await tx.equipment_accessory_instances.findFirst({
        where: { manage_code: searchData.manage_code, deleted_at: null }
      });
      if (existing) {
        await tx.equipment_accessory_instances.update({
          where: { id: existing.id },
          data: { quantity: (existing.quantity || 0) + (quantity || 0), updated_at: new Date() }
        });
        return existing.id;
      }
      const newId = id || uuidv4();
      await tx.equipment_accessory_instances.create({ data: { ...searchData, id: newId, quantity: quantity || 0 } });
      return newId;
    }

    const where: any = {
      accessory_name: searchData.accessory_name,
      model_no: searchData.model_no || null,
      brand: searchData.brand || null,
      category: searchData.category || null,
      health_status: searchData.health_status || null,
      location_id: searchData.location_id || null,
      location_status: searchData.location_status || null,
      host_equipment_id: searchData.host_equipment_id || null,
      keeper_id: searchData.keeper_id || null,
      purchase_date: searchData.purchase_date || null,
      supplier: searchData.supplier || null,
      purchase_price: searchData.purchase_price || null,
      tracking_type: searchData.tracking_type || null,
      deleted_at: null
    };

    const existing = await tx.equipment_accessory_instances.findFirst({ where });
    if (existing) {
      await tx.equipment_accessory_instances.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity || 0) + (quantity || 0), updated_at: new Date() }
      });
      if (id) await this.copyEquipmentImages(id, existing.id, tx);
      return existing.id;
    }
    const newId = id || uuidv4();
    await tx.equipment_accessory_instances.create({ data: { ...searchData, id: newId, quantity: quantity || 0 } });
    return newId;
  }

  private async copyEquipmentImages(sourceId: string, targetId: string, tx: any) {
    try {
      const images = await tx.equipment_images.findMany({ where: { equipment_id: sourceId } });
      for (const img of images) {
        const { id, created_at, updated_at, ...copyData } = img;
        await tx.equipment_images.create({ data: { ...copyData, id: uuidv4(), equipment_id: targetId } });
      }
    } catch (e: any) {
      logger.error('Failed to copy images', e);
    }
  }

  async submitOrder(id: string) {
    await prisma.equipment_transfer_orders.update({ where: { id }, data: { status: 'pending_from' } });
    return true;
  }

  async approveOrder(id: string, userId: string, userName: string, approved: boolean, remark?: string) {
    const order = await this.getById(id);
    if (!order) return false;
    const status = approved ? (order.status === 'pending_from' ? 'pending_to' : 'shipping') : 'rejected';
    await prisma.equipment_transfer_orders.update({
      where: { id },
      data: {
        status,
        from_approved_at: order.status === 'pending_from' ? new Date() : undefined,
        from_approved_by: order.status === 'pending_from' ? userId : undefined,
        to_approved_at: order.status === 'pending_to' ? new Date() : undefined,
        to_approved_by: order.status === 'pending_to' ? userId : undefined,
        updated_at: new Date()
      }
    });
    return true;
  }

  async returnToShipping(id: string, userId: string, comment?: string) {
    await prisma.equipment_transfer_orders.update({ where: { id }, data: { status: 'shipping', return_comment: comment, updated_at: new Date() } });
    return true;
  }

  async cancelOrder(id: string) {
    await prisma.equipment_transfer_orders.update({ where: { id }, data: { status: 'cancelled' } });
    return true;
  }
}
