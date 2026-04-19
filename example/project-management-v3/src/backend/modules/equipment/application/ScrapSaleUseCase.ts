import { singleton, inject } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger.js';

export interface ScrapSaleItem {
  equipment_id: string;
  equipment_name: string;
  model_no?: string;
  category: string;
  quantity: number;
}

export interface CreateScrapSaleDto {
  location_type: 'warehouse' | 'project';
  location_id: string;
  type: 'scrap' | 'sale';
  items: ScrapSaleItem[];
  reason: string;
  buyer?: string;
  sale_price?: number;
  location_manager_id?: string;
  location_manager_name?: string;
}

@singleton()
export class ScrapSaleUseCase {
  /**
   * 创建报废/出售业务订单 (仅仅是申请记录)
   */
  async createOrder(data: CreateScrapSaleDto, userId: string, userName: string) {
    const orderNo = `${data.type === 'scrap' ? 'SCR' : 'SLE'}${Date.now()}`;
    const id = uuidv4();

    // 使用传入的管理员名称，如果没有传入则查询数据库
    let fromManagerName = data.location_manager_name || '';
    if (!fromManagerName && data.location_manager_id) {
       const employee = await prisma.employees.findUnique({
         where: { id: data.location_manager_id },
         select: { name: true }
       });
       if (employee) fromManagerName = employee.name;
    }

    // 由于目前 schema 中 equipment_scrap_sales 只支持单设备，
    // 我们将主设备 ID 设为 items 中的第一个，并将完整明细存储在 JSON 中。
    const firstItem = data.items[0];
    if (!firstItem) throw new Error('未选择任何设备');

    return await prisma.equipment_scrap_sales.create({
      data: {
        id,
        order_no: orderNo,
        type: data.type,
        status: 'pending' as any,
        original_location_id: data.location_id,
        original_location_type: data.location_type,
        equipment_id: firstItem.equipment_id,
        equipment_name: firstItem.equipment_name,
        equipment_category: this.mapCategory(firstItem.category),
        scrap_sale_quantity: firstItem.quantity,
        reason: data.reason,
        buyer: data.buyer || null,
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        from_manager_id: data.location_manager_id as any,
        from_manager: fromManagerName,
        applicant_id: userId,
        applicant: userName,
        apply_date: new Date(),
        items: data.items as any
      } as any
    });
  }

  /**
   * 执行正式归档逻辑 (库存拆分与状态更新)
   */
  async executeArchival(orderId: string, processorId: string) {
    const order = await prisma.equipment_scrap_sales.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('申请单不存在');
    if ((order as any).status === 'approved') {
      logger.info(`订单 ${orderId} 已审批归档过，跳过重复处理`);
      return order;
    }

    const items = (order as any).items as ScrapSaleItem[];
    const targetStatus = order.type === 'scrap' ? 'scrapped' : 'sold';

    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const isAggregate = item.category === 'accessory' || item.category === 'fake_load' || item.category === 'load';

        if (isAggregate) {
          // 汇总管理类：配件或假负载
          const table = item.category === 'accessory' ? tx.equipment_accessory_instances : tx.equipment_instances;
          const source = await (table as any).findUnique({ where: { id: item.equipment_id } });
          
          if (!source) {
            logger.warn(`找不到物料记录: ${item.equipment_id}, 忽略拆分`);
            continue;
          }

          const totalQty = Number(source.quantity || 0);
          const processQty = Number(item.quantity || 1);

          if (totalQty > processQty) {
            // 部分处理：拆分出新记录并标记为报废/出售
            const newId = uuidv4();
            const { id: _, created_at, updated_at, ...copyData } = source;
            await (table as any).create({
              data: {
                ...copyData,
                id: newId,
                quantity: processQty,
                usage_status: targetStatus as any,
                manage_code: source.manage_code ? `${source.manage_code}-${order.type.toUpperCase()}` : null,
                created_at: new Date(),
                updated_at: new Date()
              }
            });

            // 扣减原库存
            await (table as any).update({
              where: { id: source.id },
              data: { 
                quantity: { decrement: processQty },
                updated_at: new Date()
              }
            });
          } else {
            // 全额处理：直接更新状态
            await (table as any).update({
              where: { id: source.id },
              data: { 
                usage_status: targetStatus as any,
                updated_at: new Date()
              }
            });
          }
        } else {
          // 序列号管理类：仪器等
          await tx.equipment_instances.update({
            where: { id: item.equipment_id },
            data: { 
              usage_status: targetStatus as any,
              updated_at: new Date()
            }
          });
          
          // 如果是主机，要把挂载的从库配件也一起标记？
          // 通常报废主机，挂配件如果不单独处理，一般也随主机报废。
          // 或者让用户在列表中单独勾选。
        }
      }

      // 更新申请单状态
      return await tx.equipment_scrap_sales.update({
        where: { id: orderId },
        data: {
          status: 'approved',
          processed_by: processorId,
          processed_at: new Date()
        }
      });
    });
  }

  private mapCategory(cat: string): any {
    const map: Record<string, any> = {
      'instrument': 'instrument',
      'fake_load': 'fake_load',
      'cable': 'cable',
      'accessory': 'accessory'
    };
    return map[cat] || 'instrument';
  }

  async getOrderDetail(id: string) {
    return prisma.equipment_scrap_sales.findUnique({
      where: { id }
    });
  }

  async getScrapList(params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    type?: 'scrap' | 'sale';
    dataScope?: any;
  }) {
    const { page = 1, pageSize = 20, startDate, endDate, type, dataScope } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { status: 'approved' };
    if (type) where.type = type;

    if (dataScope) {
      if (dataScope.scope === 'self') {
        where.applicant_id = dataScope.userId;
      } else if (dataScope.scope === 'project') {
        if (!dataScope.projectIds || dataScope.projectIds.length === 0) {
          where.id = 'none';
        } else {
          where.original_location_id = { in: dataScope.projectIds };
        }
      }
    }
    if (startDate || endDate) {
      where.apply_date = {};
      if (startDate) where.apply_date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.apply_date.lte = end;
      }
    }

    const [records, total] = await Promise.all([
      prisma.equipment_scrap_sales.findMany({
        where,
        orderBy: { apply_date: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.equipment_scrap_sales.count({ where })
    ]);

    return {
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}
