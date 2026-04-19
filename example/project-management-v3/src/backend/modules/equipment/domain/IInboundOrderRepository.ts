import { Prisma } from '@prisma/client';

export type InboundOrderRow = Prisma.equipment_inbound_ordersGetPayload<{
  include: { equipment_inbound_items: true }
}>;

export interface InboundOrderQueryParams {
  status?: string;
  warehouse_id?: string;
  equipment_id?: string;
  page?: number;
  pageSize?: number;
}

export interface IInboundOrderRepository {
  findById(id: string): Promise<InboundOrderRow | null>;
  findAll(params: InboundOrderQueryParams): Promise<{ data: InboundOrderRow[]; total: number }>;
  create(data: any): Promise<InboundOrderRow>;
  update(id: string, data: any): Promise<InboundOrderRow>;
  delete(id: string): Promise<void>;
  getItems(orderId: string): Promise<any[]>;
}

export const IInboundOrderRepositoryToken = Symbol('IInboundOrderRepository');
