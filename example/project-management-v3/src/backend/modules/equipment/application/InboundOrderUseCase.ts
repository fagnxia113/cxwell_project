import { singleton, inject } from 'tsyringe';
import type { IInboundOrderRepository, InboundOrderQueryParams } from '../domain/IInboundOrderRepository.js';
import { InboundOrder, IInboundOrderProps, DomainException } from '../domain/InboundOrder.entity.js';
import { eventPublisher } from '../../../core/events/EventPublisher.js';
import { InboundOrderDomainEvents, InboundOrderCreatedEvent } from '../domain/InboundOrderEvent.js';
import { v4 as uuidv4 } from 'uuid';

@singleton()
export class InboundOrderUseCase {
  constructor(
    @inject('IInboundOrderRepository') private repository: IInboundOrderRepository
  ) {}

  async createOrder(data: any, userId: string, userName: string): Promise<InboundOrder> {
    const orderNo = `IN-${Date.now()}`;

    const orderProps: IInboundOrderProps = {
      id: uuidv4(),
      orderNo,
      applicantId: userId,
      applicant: userName,
      applyDate: new Date(),
      warehouseId: data.warehouse_id || data.warehouseId,
      warehouseName: data.warehouse_name || data.warehouseName,
      inboundType: data.inbound_type || data.inboundType || 'purchase',
      inboundReason: data.inbound_reason || data.inboundReason,
      notes: data.notes,
      status: 'draft',
      items: this.extractItems(data)
    };

    const order = new InboundOrder(orderProps);

    await this.repository.create(order.toJSON());

    const createdEvent: InboundOrderCreatedEvent = {
      id: uuidv4(),
      eventType: InboundOrderDomainEvents.ORDER_CREATED,
      aggregateType: 'InboundOrder',
      aggregateId: order.id,
      payload: {
        orderId: order.id,
        orderNo: order.orderNo,
        applicantId: userId,
        applicantName: userName,
        warehouseId: order.warehouseId,
        itemCount: order.items.length,
        createdAt: new Date().toISOString()
      },
      occurredAt: new Date()
    };
    await eventPublisher.publish(createdEvent);

    return order;
  }

  async getList(params: InboundOrderQueryParams): Promise<{ data: any[]; total: number }> {
    return this.repository.findAll(params);
  }

  async getById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async updateOrder(id: string, data: any): Promise<any> {
    return this.repository.update(id, data);
  }

  async deleteOrder(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async submitOrder(id: string): Promise<any> {
    const orderData = await this.repository.findById(id);
    if (!orderData) throw new DomainException('入库单不存在');

    const order = new InboundOrder(this.mapToProps(orderData));
    order.submit(order.applicantId);

    const domainEvents = order.getDomainEvents();
    await this.repository.update(id, { status: order.status });
    for (const event of domainEvents) {
      await eventPublisher.publish(event);
    }
    order.clearDomainEvents();

    return this.repository.findById(id);
  }

  async approveOrder(id: string, userId: string, userName: string, remark?: string): Promise<any> {
    const orderData = await this.repository.findById(id);
    if (!orderData) throw new DomainException('入库单不存在');

    const order = new InboundOrder(this.mapToProps(orderData));
    order.approve(userId, userName, remark);

    const domainEvents = order.getDomainEvents();
    await this.repository.update(id, {
      status: order.status,
      approved_by: userId,
      approved_at: new Date(),
      notes: remark || orderData.notes
    });

    for (const event of domainEvents) {
      await eventPublisher.publish(event);
    }
    order.clearDomainEvents();

    return this.repository.findById(id);
  }

  async rejectOrder(id: string, userId: string, userName: string, remark?: string): Promise<any> {
    const orderData = await this.repository.findById(id);
    if (!orderData) throw new DomainException('入库单不存在');

    const order = new InboundOrder(this.mapToProps(orderData));
    order.reject(userId, userName, remark);

    const domainEvents = order.getDomainEvents();
    await this.repository.update(id, {
      status: order.status,
      approved_by: userId,
      approved_at: new Date(),
      notes: remark || orderData.notes
    });

    for (const event of domainEvents) {
      await eventPublisher.publish(event);
    }
    order.clearDomainEvents();

    return this.repository.findById(id);
  }

  async cancelOrder(id: string, reason?: string): Promise<any> {
    const orderData = await this.repository.findById(id);
    if (!orderData) throw new DomainException('入库单不存在');

    const order = new InboundOrder(this.mapToProps(orderData));
    order.cancel(order.applicantId, reason);

    const domainEvents = order.getDomainEvents();
    await this.repository.update(id, { status: order.status });

    for (const event of domainEvents) {
      await eventPublisher.publish(event);
    }
    order.clearDomainEvents();

    return this.repository.findById(id);
  }

  async getItems(orderId: string): Promise<any[]> {
    return this.repository.getItems(orderId);
  }

  async createEquipmentFromWorkflow(instanceId: string): Promise<any> {
    const { instanceService } = await import('../../../services/InstanceService.js');
    const instance = await instanceService.getInstance(instanceId);
    if (!instance) {
      throw new Error(`流程实例 ${instanceId} 不存在`);
    }

    const { EquipmentInboundUseCase } = await import('./EquipmentInboundUseCase.js');
    const inboundUseCase = new EquipmentInboundUseCase(
      {} as any
    );
    return inboundUseCase.createFromWorkflowInstance(instance);
  }

  private extractItems(data: any): any[] {
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    if (data.equipment_inbound_items && Array.isArray(data.equipment_inbound_items)) {
      return data.equipment_inbound_items;
    }
    return [];
  }

  private mapToProps(data: any): IInboundOrderProps {
    return {
      id: data.id,
      orderNo: data.order_no || data.orderNo,
      inboundType: data.inbound_type || data.inboundType,
      applicantId: data.applicant_id || data.applicantId,
      applicant: data.applicant || data.applicantName,
      applyDate: data.apply_date || data.applyDate,
      warehouseId: data.warehouse_id || data.warehouseId,
      warehouseName: data.warehouse_name || data.warehouseName,
      equipmentId: data.equipment_id,
      equipmentCode: data.equipment_code,
      equipmentName: data.equipment_name,
      newEquipmentName: data.new_equipment_name,
      newEquipmentModel: data.new_equipment_model,
      newEquipmentCategory: data.new_equipment_category,
      newEquipmentSerial: data.new_equipment_serial,
      newEquipmentManufacturer: data.new_equipment_manufacturer,
      newEquipmentPrice: data.new_equipment_price,
      newEquipmentPurchaseDate: data.new_equipment_purchase_date,
      newEquipmentCalibrationCycle: data.new_equipment_calibration_cycle,
      inboundReason: data.inbound_reason,
      notes: data.notes,
      status: data.status,
      approvalId: data.approval_id,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      items: data.equipment_inbound_items || data.items || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
