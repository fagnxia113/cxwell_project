import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import type { IInboundOrderRepository, InboundOrderRow, InboundOrderQueryParams } from '../domain/IInboundOrderRepository.js';

@singleton()
export class PrismaInboundOrderRepository implements IInboundOrderRepository {
  async findById(id: string): Promise<InboundOrderRow | null> {
    return prisma.equipment_inbound_orders.findUnique({
      where: { id },
      include: { equipment_inbound_items: true }
    });
  }

  async findAll(params: InboundOrderQueryParams): Promise<{ data: InboundOrderRow[]; total: number }> {
    const { page = 1, pageSize = 50, status, warehouse_id, equipment_id } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (warehouse_id) where.warehouse_id = warehouse_id;
    if (equipment_id) where.equipment_id = equipment_id;

    const [total, data] = await Promise.all([
      prisma.equipment_inbound_orders.count({ where }),
      prisma.equipment_inbound_orders.findMany({
        where,
        include: { equipment_inbound_items: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return { data, total };
  }

  async create(data: any): Promise<InboundOrderRow> {
    const { items, ...orderData } = data;
    return prisma.equipment_inbound_orders.create({
      data: {
        ...orderData,
        equipment_inbound_items: {
          create: items || []
        }
      },
      include: { equipment_inbound_items: true }
    });
  }

  async update(id: string, data: any): Promise<InboundOrderRow> {
    const { items, ...orderData } = data;
    
    // Simplistic update: if items are provided, replace them? or just update order?
    // For now, focus on order status/data updates
    return prisma.equipment_inbound_orders.update({
      where: { id },
      data: orderData,
      include: { equipment_inbound_items: true }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.equipment_inbound_orders.delete({
      where: { id }
    });
  }

  async getItems(orderId: string): Promise<any[]> {
    return prisma.equipment_inbound_items.findMany({
      where: { order_id: orderId }
    });
  }
}
