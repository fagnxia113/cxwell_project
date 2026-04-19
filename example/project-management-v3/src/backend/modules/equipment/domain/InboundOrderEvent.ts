import { DomainEvent } from '../../../core/events/types.js';

export const InboundOrderDomainEvents = {
  ORDER_CREATED: 'inbound_order.created',
  ORDER_SUBMITTED: 'inbound_order.submitted',
  ORDER_APPROVED: 'inbound_order.approved',
  ORDER_REJECTED: 'inbound_order.rejected',
  ORDER_CANCELLED: 'inbound_order.cancelled',
  ORDER_EXECUTION_STARTED: 'inbound_order.execution_started',
  ORDER_EXECUTION_COMPLETED: 'inbound_order.execution_completed',
  ORDER_EXECUTION_FAILED: 'inbound_order.execution_failed',
} as const;

export type InboundOrderEventType = typeof InboundOrderDomainEvents[keyof typeof InboundOrderDomainEvents];

export interface InboundOrderCreatedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_CREATED;
  payload: {
    orderId: string;
    orderNo: string;
    applicantId: string;
    applicantName: string;
    warehouseId: string;
    itemCount: number;
    createdAt: string;
  };
}

export interface InboundOrderSubmittedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_SUBMITTED;
  payload: {
    orderId: string;
    orderNo: string;
    submittedBy: string;
    submittedAt: string;
  };
}

export interface InboundOrderApprovedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_APPROVED;
  payload: {
    orderId: string;
    orderNo: string;
    approvedBy: string;
    approvedByName?: string;
    approvedAt: string;
    remark?: string;
    items: Array<{
      equipmentName: string;
      category: string;
      quantity: number;
    }>;
  };
}

export interface InboundOrderRejectedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_REJECTED;
  payload: {
    orderId: string;
    orderNo: string;
    rejectedBy: string;
    rejectedByName?: string;
    rejectedAt: string;
    reason?: string;
  };
}

export interface InboundOrderCancelledEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_CANCELLED;
  payload: {
    orderId: string;
    orderNo: string;
    cancelledBy: string;
    cancelledAt: string;
    reason?: string;
  };
}

export interface InboundOrderExecutionStartedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_EXECUTION_STARTED;
  payload: {
    orderId: string;
    orderNo: string;
    startedBy: string;
    startedAt: string;
    equipmentItems: Array<{
      name: string;
      category: string;
      quantity: number;
    }>;
    accessoryItems: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

export interface InboundOrderExecutionCompletedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_EXECUTION_COMPLETED;
  payload: {
    orderId: string;
    orderNo: string;
    completedAt: string;
    createdEquipmentIds: string[];
    createdAccessoryIds: string[];
    totalEquipmentCount: number;
    totalAccessoryCount: number;
  };
}

export interface InboundOrderExecutionFailedEvent extends DomainEvent {
  eventType: typeof InboundOrderDomainEvents.ORDER_EXECUTION_FAILED;
  payload: {
    orderId: string;
    orderNo: string;
    failedAt: string;
    errorMessage: string;
    failedItemIndex?: number;
  };
}
