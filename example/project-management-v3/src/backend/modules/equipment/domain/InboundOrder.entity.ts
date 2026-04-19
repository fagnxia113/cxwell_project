import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../../../core/events/types.js';
import {
  InboundOrderDomainEvents,
  InboundOrderApprovedEvent,
  InboundOrderRejectedEvent,
  InboundOrderCancelledEvent,
  InboundOrderSubmittedEvent,
  InboundOrderCreatedEvent
} from './InboundOrderEvent.js';

export type InboundOrderStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface InboundOrderItemData {
  id?: string;
  orderId?: string;
  equipmentName?: string;
  serialNumber?: string;
  modelName?: string;
  modelNo?: string;
  manufacturer?: string;
  technicalParams?: string;
  itemNotes?: string;
  brand?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  purchasePrice?: number;
  supplier?: string;
  serialNumbers?: string;
  certificateNo?: string;
  certificateIssuer?: string;
  certificateExpiryDate?: Date | string;
  accessoryDesc?: string;
  isIndependentCode?: boolean;
  accessoryList?: AccessoryItemData[];
}

export interface AccessoryItemData {
  accessoryName?: string;
  accessoryModel?: string;
  accessoryQuantity?: number;
  accessoryUnit?: string;
  serialNumber?: string;
  serialNumbers?: string;
  manageCode?: string;
  itemCode?: string;
  keeperId?: string;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  accessoryNotes?: string;
  notes?: string;
  attachments?: string[];
  accessoryAttachments?: string[];
  images?: string[];
  accessoryImages?: string[];
  isIndependentCode?: boolean;
}

export interface IInboundOrderProps {
  id?: string;
  orderNo?: string;
  inboundType?: 'purchase' | 'return';
  applicantId: string;
  applicant: string;
  applyDate?: Date;
  warehouseId: string;
  warehouseName?: string;
  equipmentId?: string;
  equipmentCode?: string;
  equipmentName?: string;
  newEquipmentName?: string;
  newEquipmentModel?: string;
  newEquipmentCategory?: string;
  newEquipmentSerial?: string;
  newEquipmentManufacturer?: string;
  newEquipmentPrice?: number;
  newEquipmentPurchaseDate?: Date;
  newEquipmentCalibrationCycle?: number;
  inboundReason?: string;
  notes?: string;
  status?: InboundOrderStatus;
  approvalId?: string;
  approvedAt?: Date;
  approvedBy?: string;
  items?: InboundOrderItemData[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class InboundOrder {
  private props: IInboundOrderProps;
  private domainEvents: DomainEvent[] = [];

  constructor(props: IInboundOrderProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      orderNo: props.orderNo || `IN-${Date.now()}`,
      applyDate: props.applyDate || new Date(),
      status: props.status || 'draft',
      inboundType: props.inboundType || 'purchase',
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  get id(): string { return this.props.id!; }
  get orderNo(): string { return this.props.orderNo!; }
  get status(): InboundOrderStatus { return this.props.status!; }
  get applicantId(): string { return this.props.applicantId; }
  get warehouseId(): string { return this.props.warehouseId; }
  get items(): InboundOrderItemData[] { return this.props.items || []; }

  getSnapshot(): IInboundOrderProps {
    return { ...this.props };
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  submit(submittedById: string): void {
    if (this.props.status !== 'draft' && this.props.status !== 'pending') {
      throw new DomainException('只有草稿或待审批状态的入库单可以提交');
    }

    this.props.status = 'pending';
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      id: uuidv4(),
      eventType: InboundOrderDomainEvents.ORDER_SUBMITTED,
      aggregateType: 'InboundOrder',
      aggregateId: this.props.id!,
      payload: {
        orderId: this.props.id!,
        orderNo: this.props.orderNo!,
        submittedBy: submittedById,
        submittedAt: new Date().toISOString()
      },
      occurredAt: new Date()
    } as InboundOrderSubmittedEvent);
  }

  approve(approverId: string, approverName?: string, remark?: string): void {
    if (this.props.status !== 'pending') {
      throw new DomainException('只有待审批状态的入库单可以审批');
    }

    this.props.status = 'approved';
    this.props.approvedBy = approverId;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      id: uuidv4(),
      eventType: InboundOrderDomainEvents.ORDER_APPROVED,
      aggregateType: 'InboundOrder',
      aggregateId: this.props.id!,
      payload: {
        orderId: this.props.id!,
        orderNo: this.props.orderNo!,
        approvedBy: approverId,
        approvedByName: approverName,
        approvedAt: new Date().toISOString(),
        remark,
        items: (this.props.items || []).map(item => ({
          equipmentName: item.equipmentName || '',
          category: item.category || '',
          quantity: item.quantity || 1
        }))
      },
      occurredAt: new Date()
    } as InboundOrderApprovedEvent);
  }

  reject(rejecterId: string, rejecterName?: string, reason?: string): void {
    if (this.props.status !== 'pending') {
      throw new DomainException('只有待审批状态的入库单可以驳回');
    }

    this.props.status = 'rejected';
    this.props.approvedBy = rejecterId;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      id: uuidv4(),
      eventType: InboundOrderDomainEvents.ORDER_REJECTED,
      aggregateType: 'InboundOrder',
      aggregateId: this.props.id!,
      payload: {
        orderId: this.props.id!,
        orderNo: this.props.orderNo!,
        rejectedBy: rejecterId,
        rejectedByName: rejecterName,
        rejectedAt: new Date().toISOString(),
        reason
      },
      occurredAt: new Date()
    } as InboundOrderRejectedEvent);
  }

  cancel(cancellerId: string, reason?: string): void {
    if (this.props.status === 'completed') {
      throw new DomainException('已完成的入库单无法取消');
    }

    this.props.status = 'cancelled';
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      id: uuidv4(),
      eventType: InboundOrderDomainEvents.ORDER_CANCELLED,
      aggregateType: 'InboundOrder',
      aggregateId: this.props.id!,
      payload: {
        orderId: this.props.id!,
        orderNo: this.props.orderNo!,
        cancelledBy: cancellerId,
        cancelledAt: new Date().toISOString(),
        reason
      },
      occurredAt: new Date()
    } as InboundOrderCancelledEvent);
  }

  complete(): void {
    if (this.props.status !== 'approved') {
      throw new DomainException('只有已审批通过的入库单可以完成');
    }

    this.props.status = 'completed';
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      order_no: this.props.orderNo,
      inbound_type: this.props.inboundType,
      applicant_id: this.props.applicantId,
      applicant: this.props.applicant,
      apply_date: this.props.applyDate,
      warehouse_id: this.props.warehouseId,
      warehouse_name: this.props.warehouseName,
      equipment_id: this.props.equipmentId,
      equipment_code: this.props.equipmentCode,
      equipment_name: this.props.equipmentName,
      new_equipment_name: this.props.newEquipmentName,
      new_equipment_model: this.props.newEquipmentModel,
      new_equipment_category: this.props.newEquipmentCategory,
      new_equipment_serial: this.props.newEquipmentSerial,
      new_equipment_manufacturer: this.props.newEquipmentManufacturer,
      new_equipment_price: this.props.newEquipmentPrice,
      new_equipment_purchase_date: this.props.newEquipmentPurchaseDate,
      new_equipment_calibration_cycle: this.props.newEquipmentCalibrationCycle,
      inbound_reason: this.props.inboundReason,
      notes: this.props.notes,
      status: this.props.status,
      approval_id: this.props.approvalId,
      approved_at: this.props.approvedAt,
      approved_by: this.props.approvedBy,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
      equipment_inbound_items: this.props.items
    };
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}

export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}
