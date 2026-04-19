import { singleton, inject } from 'tsyringe';
import { EventSubscriber, eventPublisher } from '../../../core/events/EventPublisher.js';
import { DomainEvent } from '../../../core/events/types.js';
import { EquipmentDomainEvents, type EquipmentInboundCompletedEvent, type EquipmentTransferReceivedEvent, type EquipmentStatusChangedEvent } from '../domain/EquipmentEvents.js';
import { logger } from '../../../utils/logger.js';
import type { NotificationService } from '../../../services/NotificationService.js';

@singleton()
export class EquipmentEventHandler {
  constructor(
    @inject('NotificationService') private notificationService: NotificationService,
    private eventSubscriber: EventSubscriber
  ) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.eventSubscriber.subscribe(EquipmentDomainEvents.INBOUND_COMPLETED, this.handleInboundCompleted.bind(this));
    this.eventSubscriber.subscribe(EquipmentDomainEvents.TRANSFER_RECEIVED, this.handleTransferReceived.bind(this));
    this.eventSubscriber.subscribe(EquipmentDomainEvents.STATUS_CHANGED, this.handleStatusChanged.bind(this));
  }

  private async handleInboundCompleted(event: DomainEvent): Promise<void> {
    const payload = event.payload as any;
    logger.info(`Handling inbound completed event: ${payload.inboundOrderNo}`);

    await this.notificationService.sendNotification({
      user_id: payload.operatorId,
      user_name: payload.operatorName || 'System',
      type: 'in_app',
      title: '设备入库完成',
      content: `入库单 ${payload.inboundOrderNo} 已完成入库，共 ${payload.equipmentCount} 台设备`,
      priority: 'normal',
      link: `/equipment/inbound/${payload.inboundOrderId}`
    });
  }

  private async handleTransferReceived(event: DomainEvent): Promise<void> {
    const payload = event.payload as any;
    logger.info(`Handling transfer received event: ${payload.transferOrderNo}`);

    await this.notificationService.sendNotification({
      user_id: payload.operatorId,
      user_name: payload.operatorName || 'System',
      type: 'in_app',
      title: '设备调拨接收完成',
      content: `调拨单 ${payload.transferOrderNo} 已确认接收，共 ${payload.equipmentCount} 台设备`,
      priority: 'normal',
      link: `/equipment/transfer/${payload.transferOrderId}`
    });
  }

  private async handleStatusChanged(event: DomainEvent): Promise<void> {
    const payload = event.payload as any;
    logger.info(`Handling equipment status changed: ${payload.equipmentId} from ${payload.oldStatus} to ${payload.newStatus}`);
  }
}
