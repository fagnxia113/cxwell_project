import { singleton, inject } from 'tsyringe';
import { EventSubscriber } from '../../../core/events/EventPublisher.js';
import { DomainEvent } from '../../../core/events/types.js';
import {
  InboundOrderDomainEvents,
  InboundOrderApprovedEvent,
  InboundOrderExecutionCompletedEvent,
  InboundOrderExecutionFailedEvent,
  InboundOrderRejectedEvent
} from '../domain/InboundOrderEvent.js';
import { logger } from '../../../utils/logger.js';
import type { NotificationService } from '../../../services/NotificationService.js';
import { container } from 'tsyringe';
import { EquipmentInboundUseCase } from './EquipmentInboundUseCase.js';
import type { InboundOrderRow } from '../domain/IInboundOrderRepository.js';
import type { IInboundOrderRepository } from '../domain/IInboundOrderRepository.js';

@singleton()
export class InboundOrderEventHandler {
  private eventSubscriber: EventSubscriber;
  private notificationService: NotificationService;

  constructor(
    @inject('IInboundOrderRepository') private inboundOrderRepository: IInboundOrderRepository
  ) {
    this.eventSubscriber = container.resolve(EventSubscriber);
    this.notificationService = container.resolve('NotificationService') as NotificationService;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.eventSubscriber.subscribe(
      InboundOrderDomainEvents.ORDER_APPROVED,
      this.handleOrderApproved.bind(this)
    );
    this.eventSubscriber.subscribe(
      InboundOrderDomainEvents.ORDER_EXECUTION_COMPLETED,
      this.handleExecutionCompleted.bind(this)
    );
    this.eventSubscriber.subscribe(
      InboundOrderDomainEvents.ORDER_EXECUTION_FAILED,
      this.handleExecutionFailed.bind(this)
    );
    this.eventSubscriber.subscribe(
      InboundOrderDomainEvents.ORDER_REJECTED,
      this.handleOrderRejected.bind(this)
    );
  }

  private async handleOrderApproved(event: DomainEvent): Promise<void> {
    const payload = (event as InboundOrderApprovedEvent).payload;
    logger.info(`Handling order approved event: ${payload.orderNo}`);

    try {
      const inboundUseCase = container.resolve(EquipmentInboundUseCase);
      const instanceData = await this.buildInstanceData(payload.orderId);

      const results = await inboundUseCase.createFromWorkflowInstance(instanceData);

      const equipmentIds = results
        .filter((r: any) => r.equipment_name || r.equipmentName)
        .map((r: any) => r.id);
      const accessoryIds = results
        .filter((r: any) => r.accessory_name || r.accessoryName)
        .map((r: any) => r.id);

      await this.inboundOrderRepository.update(payload.orderId, { status: 'completed' });

      logger.info(`Order execution completed: ${payload.orderNo}, created ${equipmentIds.length} equipment, ${accessoryIds.length} accessories`);
    } catch (error) {
      logger.error(`Failed to execute inbound order: ${payload.orderNo}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  private async handleExecutionCompleted(event: DomainEvent): Promise<void> {
    const payload = (event as InboundOrderExecutionCompletedEvent).payload;
    logger.info(`Handling execution completed: ${payload.orderNo}`);

    await this.notificationService.sendNotification({
      user_id: payload.orderId,
      user_name: 'System',
      type: 'in_app',
      title: '设备入库执行完成',
      content: `入库单 ${payload.orderNo} 已完成，共入库 ${payload.totalEquipmentCount} 台设备，${payload.totalAccessoryCount} 个配件`,
      priority: 'normal',
      link: `/equipment/inbound/${payload.orderId}`
    });
  }

  private async handleExecutionFailed(event: DomainEvent): Promise<void> {
    const payload = (event as InboundOrderExecutionFailedEvent).payload;
    logger.error(`Handling execution failed: ${payload.orderNo}, error: ${payload.errorMessage}`);

    await this.notificationService.sendNotification({
      user_id: payload.orderId,
      user_name: 'System',
      type: 'in_app',
      title: '设备入库执行失败',
      content: `入库单 ${payload.orderNo} 执行失败：${payload.errorMessage}`,
      priority: 'high',
      link: `/equipment/inbound/${payload.orderId}`
    });
  }

  private async handleOrderRejected(event: DomainEvent): Promise<void> {
    const payload = (event as any).payload;
    logger.info(`Handling order rejected: ${payload.orderNo}`);

    await this.notificationService.sendNotification({
      user_id: payload.orderId,
      user_name: 'System',
      type: 'in_app',
      title: '设备入库单被驳回',
      content: `入库单 ${payload.orderNo} 已被驳回，原因：${payload.reason || '未说明'}`,
      priority: 'normal',
      link: `/equipment/inbound/${payload.orderId}`
    });
  }

  private async buildInstanceData(orderId: string): Promise<{ variables?: { formData?: Record<string, any> } }> {
    const order = await this.inboundOrderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Inbound order ${orderId} not found`);
    }

    return {
      variables: {
        formData: {
          ...order,
          items: order.equipment_inbound_items,
          applicant_id: order.applicant_id,
          warehouse_id: order.warehouse_id
        }
      }
    };
  }
}
