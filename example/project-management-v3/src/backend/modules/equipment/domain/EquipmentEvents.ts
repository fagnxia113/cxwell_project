import { DomainEvent } from '../../../core/events/types.js';

export const EquipmentDomainEvents = {
  INBOUND_CREATED: 'equipment.inbound.created',
  INBOUND_COMPLETED: 'equipment.inbound.completed',
  TRANSFER_SHIPPED: 'equipment.transfer.shipped',
  TRANSFER_RECEIVED: 'equipment.transfer.received',
  REPAIR_SHIPPED: 'equipment.repair.shipped',
  REPAIR_RECEIVED: 'equipment.repair.received',
  SCRAP_APPROVED: 'equipment.scrap.approved',
  SCRAP_SALE_COMPLETED: 'equipment.scrap_sale.completed',
  STATUS_CHANGED: 'equipment.status.changed',
} as const;

export type EquipmentEventType = typeof EquipmentDomainEvents[keyof typeof EquipmentDomainEvents];

export interface EquipmentInboundCreatedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.INBOUND_CREATED;
  payload: {
    inboundOrderId: string;
    inboundOrderNo: string;
    equipmentIds: string[];
    warehouseId: string;
    operatorId: string;
  };
}

export interface EquipmentInboundCompletedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.INBOUND_COMPLETED;
  payload: {
    inboundOrderId: string;
    inboundOrderNo: string;
    equipmentIds: string[];
    warehouseId: string;
    operatorId: string;
    completedAt: string;
  };
}

export interface EquipmentTransferShippedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.TRANSFER_SHIPPED;
  payload: {
    transferOrderId: string;
    transferOrderNo: string;
    equipmentIds: string[];
    fromWarehouseId: string;
    toWarehouseId: string;
    operatorId: string;
    shippedAt: string;
  };
}

export interface EquipmentTransferReceivedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.TRANSFER_RECEIVED;
  payload: {
    transferOrderId: string;
    transferOrderNo: string;
    equipmentIds: string[];
    warehouseId: string;
    operatorId: string;
    receivedAt: string;
  };
}

export interface EquipmentRepairShippedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.REPAIR_SHIPPED;
  payload: {
    repairOrderId: string;
    repairOrderNo: string;
    equipmentIds: string[];
    repairVendorId?: string;
    operatorId: string;
    shippedAt: string;
  };
}

export interface EquipmentRepairReceivedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.REPAIR_RECEIVED;
  payload: {
    repairOrderId: string;
    repairOrderNo: string;
    equipmentIds: string[];
    operatorId: string;
    receivedAt: string;
  };
}

export interface EquipmentStatusChangedEvent extends DomainEvent {
  eventType: typeof EquipmentDomainEvents.STATUS_CHANGED;
  payload: {
    equipmentId: string;
    oldStatus: string;
    newStatus: string;
    operatorId: string;
    reason?: string;
  };
}
