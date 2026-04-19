import { singleton, inject, container } from 'tsyringe';
import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { prisma } from '../../../database/prisma.js';
import { logger } from '../../../utils/logger.js';
import type { EquipmentInboundUseCase } from '../application/EquipmentInboundUseCase.js';
import type { TransferUseCase } from '../application/TransferUseCase.js';
import type { RepairUseCase } from '../application/RepairUseCase.js';
import type { InstanceService } from '../../../services/InstanceService.js';
import type { EventPublisher } from '../../../core/events/EventPublisher.js';
import { EquipmentDomainEvents } from '../domain/EquipmentEvents.js';
import { EventPublisher as EventPublisherClass } from '../../../core/events/EventPublisher.js';
import type { ScrapSaleUseCase } from '../application/ScrapSaleUseCase.js';

/**
 * 仪器入库处理器 (Outbox 模式改造版)
 */
@singleton()
export class EquipmentInboundHandler implements IServiceTaskHandler {
  constructor(
    @inject('EquipmentInboundUseCase') private inboundUseCase: EquipmentInboundUseCase,
    @inject('InstanceService') private instanceService: InstanceService,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process } = context;
    logger.info(`执行设备入库服务 (Outbox): 流程实例 ${process.id}`);
    
    const instanceData = await this.instanceService.getInstance(process.id);
    if (!instanceData) {
      throw new Error(`流程实例 ${process.id} 不存在`);
    }

    const result: any[] = await this.inboundUseCase.createFromWorkflowInstance(instanceData);

    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.INBOUND_COMPLETED,
      aggregateType: 'EquipmentInbound',
      aggregateId: process.id,
      payload: {
        inboundOrderId: process.id,
        inboundOrderNo: process.title || process.id,
        equipmentIds: result.map((item: any) => item.id).filter(Boolean),
        warehouseId: instanceData?.variables?.formData?.warehouse_id || instanceData?.variables?.formData?.location_id,
        operatorId: process.initiator_id,
        operatorName: process.initiator_name,
        equipmentCount: result.length
      },
      metadata: {
        workflowInstanceId: process.id,
        workflowDefinitionId: process.definition_id
      }
    });

    await this.eventPublisher.publish(event);

    return { success: true, equipmentCount: result.length };
  }
}

@singleton()
export class TransferShippingHandler implements IServiceTaskHandler {
  constructor(
    @inject('TransferUseCase') private transferUseCase: TransferUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;

    if (!businessId) {
      throw new Error('业务ID为空，无法执行调拨发货服务');
    }

    const formData = context.formData || {};

    const existingOrder = await this.transferUseCase.getById(businessId);
    const alreadyShipped = existingOrder && existingOrder.shipped_at;
    
    const itemImages = (formData.items || []).map((item: any) => ({
      item_id: item.id || item.item_id,
      images: item.shipping_images || []
    })).filter((img: any) => img.images && img.images.length > 0);
    
    const itemQuantities = (formData.items || []).map((item: any) => ({
      item_id: item.id || item.item_id,
      quantity: Number(item.quantity || 1)
    })).filter((q: any) => q.quantity > 0);

    const result = await this.transferUseCase.confirmShipping(businessId, {
      shipped_at: formData.shipped_at || formData.shipping_date || formData.shipping_time || (alreadyShipped ? existingOrder.shipped_at : new Date().toISOString()),
      shipping_no: formData.shipping_no || formData.tracking_no || (alreadyShipped ? existingOrder.shipping_no : '') || '',
      shipping_attachment: formData.shipping_attachment || formData.shipping_notes || formData.shipping_remark || (alreadyShipped ? existingOrder.shipping_attachment : '') || '',
      package_images: (formData.shipping_package_images?.length > 0 ? formData.shipping_package_images : null)
        || (formData.package_images?.length > 0 ? formData.package_images : null)
        || (alreadyShipped && Array.isArray(existingOrder.shipping_package_images) && (existingOrder.shipping_package_images as any[]).length > 0 ? existingOrder.shipping_package_images : []),
      item_images: itemImages.length > 0 ? itemImages : undefined,
      item_quantities: itemQuantities,
      shipped_by: workflowInstance.initiator_id
    });

    if (!result) throw new Error('调拨单发货失败');

    const equipmentIds = result.items?.map((i: any) => i.equipment_id).filter(Boolean) as string[] || [];

    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.TRANSFER_SHIPPED,
      aggregateType: 'EquipmentTransfer',
      aggregateId: businessId,
      payload: {
        transferOrderId: result.id,
        transferOrderNo: result.order_no,
        equipmentIds,
        fromWarehouseId: result.from_warehouse_id || result.from_project_id,
        toWarehouseId: result.to_warehouse_id || result.to_project_id,
        operatorId: workflowInstance.initiator_id,
        shippedAt: new Date().toISOString()
      },
      metadata: {
        workflowInstanceId: workflowInstance.id
      }
    });

    await this.eventPublisher.publish(event);
    
    return { 
      success: true, 
      variables: {
        formData: {
          ...formData,
          shipping_no: result.shipping_no,
          shipped_at: result.shipped_at,
          items: result.items?.map((i: any) => ({
            ...i,
            id: i.id,
            equipment_id: i.equipment_id,
            equipment_name: i.equipment_name,
            quantity: i.quantity
          }))
        }
      }
    };
  }
}

@singleton()
export class TransferReceivingHandler implements IServiceTaskHandler {
  constructor(
    @inject('TransferUseCase') private transferUseCase: TransferUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}
  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;
    if (!businessId) throw new Error('业务ID为空');

    const formData = context.formData || {};
    const currentOrder: any = await this.transferUseCase.getById(businessId);
    if (!currentOrder) throw new Error('调拨单不存在');

    const rawStatus = (formData.receive_status || formData.receiveStatus || (formData as any).status || '').toString().toLowerCase();

    if (currentOrder.status === 'completed' || currentOrder.status === 'partial_received') {
      logger.info(`[TransferReceivingHandler] 订单已收货 (status=${currentOrder.status})，跳过重复更新以防覆盖。`);
      return {
        success: true,
        variables: {
          receiveStatus: currentOrder.receive_status || 'normal',
          formData: {
            ...formData,
            ...currentOrder,
            receive_status: currentOrder.receive_status
          }
        }
      };
    }

    const finalStatus = (rawStatus === 'partial' || rawStatus === 'exception' || rawStatus === 'damaged' || rawStatus === 'missing')
      ? 'partial'
      : (rawStatus === 'normal' || rawStatus === 'all')
        ? 'normal'
        : (rawStatus === 'unreceived')
          ? 'unreceived'
          : (currentOrder.receive_status || 'normal');
    
    const finalComment = formData.receive_comment || formData.receiving_note || formData.receive_note || currentOrder.receive_comment || '';
    const finalPkgImages = formData.receiving_package_images || formData.receivingPackageImages || currentOrder.receiving_package_images || [];

    await this.transferUseCase.confirmReceiving(businessId, {
      received_at: formData.received_at || formData.receiving_time || formData.receive_at || currentOrder.received_at || new Date().toISOString(),
      received_by: workflowInstance.initiator_id,
      receive_status: finalStatus,
      receive_comment: finalComment,
      package_images: finalPkgImages,
      received_items: ((formData.items || []) as any[]).map(item => {
        const receivedQty = item.received_quantity ?? item.receivedQuantity;
        const existingItem = currentOrder.items?.find((i: any) => 
          String(i.id) === String(item.id) || 
          String(i.equipment_id) === String(item.id || item.equipment_id) ||
          (i.equipment_name === item.equipment_name && (!i.model_no || i.model_no === (item.model_no || item.model)))
        );
        
        const isExceptionReceipt = (rawStatus === 'partial' || rawStatus === 'exception' || rawStatus === 'damaged' || rawStatus === 'missing' || rawStatus === 'unreceived');
        const fallbackQty = isExceptionReceipt ? 0 : (item.quantity !== undefined ? Number(item.quantity) : 0);

        const finalQty = (receivedQty !== undefined && receivedQty !== null && String(receivedQty) !== '') 
          ? Number(receivedQty) 
          : (existingItem?.received_quantity !== undefined && existingItem?.received_quantity !== null ? Number(existingItem.received_quantity) : fallbackQty);
        
        const images = item.receiving_images || item.receivingImages || item.images || existingItem?.receiving_images || [];
        
        return {
          item_id: existingItem?.id || item.id || item.item_id || item.equipment_id,
          received_quantity: finalQty,
          receiving_images: images,
          equipment_name: item.equipment_name,
          model_no: item.model_no || item.model
        };
      })
    });

    const orderObj: any = await this.transferUseCase.getById(businessId);

    return {
      success: true,
      variables: {
        receiveStatus: (rawStatus === 'exception' || rawStatus === 'damaged' || rawStatus === 'missing') ? 'partial' : (rawStatus === 'unreceived' ? 'unreceived' : (rawStatus || finalStatus)),
        isException: (rawStatus === 'exception' || rawStatus === 'damaged' || rawStatus === 'missing' || finalStatus === 'partial' || finalStatus === 'unreceived'),

        formData: {
          ...formData,
          ...orderObj,
          receive_status: (rawStatus === 'exception' || rawStatus === 'damaged' || rawStatus === 'missing') ? 'partial' : (rawStatus === 'unreceived' ? 'unreceived' : (rawStatus || finalStatus)),
          receive_result: rawStatus || finalStatus,
          total_received_quantity: orderObj?.total_received_quantity,
          items: orderObj?.items?.map((i: any) => ({
            ...i,
            id: i.id,
            equipment_id: i.equipment_id,
            quantity: i.quantity,
            received_quantity: i.received_quantity
          })) || (formData.items || [])
        }
      }
    };
  }
}

@singleton()
export class TransferUnreceivedCompleteHandler implements IServiceTaskHandler {
  constructor(
    @inject('TransferUseCase') private transferUseCase: TransferUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;

    if (!businessId) {
      throw new Error('业务ID为空');
    }

    const currentOrder: any = await this.transferUseCase.getById(businessId);
    if (!currentOrder || currentOrder.status !== 'partial_received') {
      return { success: true };
    }

    await this.transferUseCase.finalizePartialReceiving(businessId);

    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.TRANSFER_RECEIVED || 'EQUIPMENT_TRANSFER_PARTIAL_COMPLETED',
      aggregateType: 'EquipmentTransfer',
      aggregateId: businessId,
      payload: {
        transferOrderId: businessId,
        transferOrderNo: currentOrder.order_no,
        operatorId: workflowInstance.initiator_id,
        receivedAt: new Date().toISOString()
      },
      metadata: {
        workflowInstanceId: workflowInstance.id
      }
    });

    await this.eventPublisher.publish(event);

    return { success: true };
  }
}

/**
 * 维修发货处理器 (支持批量)
 */
@singleton()
export class RepairShippingHandler implements IServiceTaskHandler {
  constructor(
    @inject('RepairUseCase') private repairUseCase: RepairUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance, formData } = context;
    const businessId = workflowInstance.business_id;
    if (!businessId) throw new Error('业务ID为空');

    const operatorId = workflowInstance.initiator_id || 'system';
    
    const shippingData = {
      shipping_no: formData?.shipping_no || formData?.tracking_no || `SHP-REP-${Date.now()}`,
      shipped_at: formData?.shipped_at || formData?.shipping_date || new Date().toISOString(),
      shipping_remark: formData?.shipping_remark || formData?.remarks || formData?.notes || '',
      package_images: formData?.shipping_package_images || formData?.package_images || [],
      item_images: ((formData?.equipmentData || formData?.items || []) as any[]).map((item: any) => ({
        item_id: item.equipmentId || item.id || item.equipment_id,
        equipment_name: item.equipmentName || item.equipment_name || item.name,
        images: item.shipping_images || []
      })).filter((i: any) => i.images.length > 0)
    };

    // 支持批量处理
    const repairOrderIds = (context.variables?.repairOrderIds || [businessId]) as string[];
    const results: any[] = [];
    
    for (const id of repairOrderIds) {
      try {
        const res = await this.repairUseCase.shipRepairOrder(id, operatorId, shippingData);
        results.push(res);
      } catch (e: any) {
        logger.error(`[RepairShippingHandler] 发货单 ${id} 处理失败:`, e);
      }
    }
    
    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.REPAIR_SHIPPED,
      aggregateType: 'EquipmentRepair',
      aggregateId: businessId,
      payload: {
        repairOrderIds,
        repairOrderCount: results.length,
        equipmentIds: results.map(r => r.equipment_id).filter(Boolean),
        operatorId: operatorId,
        shippedAt: new Date().toISOString()
      },
      metadata: {
        workflowInstanceId: workflowInstance.id
      }
    });

    await this.eventPublisher.publish(event);
    
    return { success: true, processedCount: results.length };
  }
}

/**
 * 维修收货处理器 (支持批量)
 */
@singleton()
export class RepairReceivingHandler implements IServiceTaskHandler {
  constructor(
    @inject('RepairUseCase') private repairUseCase: RepairUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;
    if (!businessId) throw new Error('业务ID为空');

    const operatorId = workflowInstance.initiator_id || 'system';

    // 支持批量处理
    const repairOrderIds = (context.variables?.repairOrderIds || [businessId]) as string[];
    const results: any[] = [];

    for (const id of repairOrderIds) {
      try {
        const res = await this.repairUseCase.receiveRepairOrder(id, operatorId);
        results.push(res);
      } catch (e: any) {
        logger.error(`[RepairReceivingHandler] 收货单 ${id} 处理失败:`, e);
      }
    }

    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.REPAIR_RECEIVED,
      aggregateType: 'EquipmentRepair',
      aggregateId: businessId,
      payload: {
        repairOrderIds,
        repairOrderCount: results.length,
        equipmentIds: results.map(r => r.equipment_id).filter(Boolean),
        operatorId: operatorId,
        receivedAt: new Date().toISOString()
      },
      metadata: {
        workflowInstanceId: workflowInstance.id
      }
    });

    await this.eventPublisher.publish(event);
    
    return { success: true, processedCount: results.length };
  }
}

/**
 * 设备报废/出售归档处理器
 */
@singleton()
export class EquipmentScrapSaleHandler implements IServiceTaskHandler {
  constructor(
    @inject('ScrapSaleUseCase') private scrapSaleUseCase: ScrapSaleUseCase,
    @inject('EventPublisher') private eventPublisher: EventPublisher
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;
    if (!businessId) throw new Error('业务ID为空，无法执行报废归档服务');

    const processorId = workflowInstance.initiator_id || 'system';

    const result = await this.scrapSaleUseCase.executeArchival(businessId, processorId);

    const event = EventPublisherClass.createEvent({
      eventType: EquipmentDomainEvents.SCRAP_SALE_COMPLETED as any,
      aggregateType: 'EquipmentScrapSale',
      aggregateId: businessId,
      payload: {
        scrapSaleOrderId: result.id,
        orderNo: result.order_no,
        type: result.type,
        processorId: processorId,
        processedAt: new Date().toISOString()
      },
      metadata: {
        workflowInstanceId: workflowInstance.id
      }
    });

    await this.eventPublisher.publish(event);

    return { 
      success: true, 
      orderNo: result.order_no,
      type: result.type
    };
  }
}

/**
 * 调拨异常回滚处理器
 */
@singleton()
export class TransferRollbackHandler implements IServiceTaskHandler {
  constructor(
    @inject('TransferUseCase') private transferUseCase: TransferUseCase
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { process: workflowInstance } = context;
    const businessId = workflowInstance.business_id;
    if (!businessId) throw new Error('业务ID为空');

    const operatorId = workflowInstance.initiator_id || 'system';
    logger.info(`[TransferRollbackHandler] 正在回滚调拨单: ${businessId}`, { operatorId });

    // 假设业务逻辑是：如果进入回滚，则取消订单并重置库存状态
    await this.transferUseCase.cancelOrder(businessId);
    
    return { success: true };
  }
}

let _equipmentInboundHandler: EquipmentInboundHandler;
let _transferShippingHandler: TransferShippingHandler;
let _transferReceivingHandler: TransferReceivingHandler;
let _transferUnreceivedCompleteHandler: TransferUnreceivedCompleteHandler;
let _repairShippingHandler: RepairShippingHandler;
let _repairReceivingHandler: RepairReceivingHandler;
let _equipmentScrapSaleHandler: EquipmentScrapSaleHandler;
let _transferRollbackHandler: TransferRollbackHandler;

export function getEquipmentHandlers() {
  if (!_equipmentInboundHandler) _equipmentInboundHandler = container.resolve(EquipmentInboundHandler);
  if (!_transferShippingHandler) _transferShippingHandler = container.resolve(TransferShippingHandler);
  if (!_transferReceivingHandler) _transferReceivingHandler = container.resolve(TransferReceivingHandler);
  if (!_transferUnreceivedCompleteHandler) _transferUnreceivedCompleteHandler = container.resolve(TransferUnreceivedCompleteHandler);
  if (!_repairShippingHandler) _repairShippingHandler = container.resolve(RepairShippingHandler);
  if (!_repairReceivingHandler) _repairReceivingHandler = container.resolve(RepairReceivingHandler);
  if (!_equipmentScrapSaleHandler) _equipmentScrapSaleHandler = container.resolve(EquipmentScrapSaleHandler);
  if (!_transferRollbackHandler) _transferRollbackHandler = container.resolve(TransferRollbackHandler);

  return {
    equipmentInboundHandler: _equipmentInboundHandler,
    transferShippingHandler: _transferShippingHandler,
    transferReceivingHandler: _transferReceivingHandler,
    transferUnreceivedCompleteHandler: _transferUnreceivedCompleteHandler,
    repairShippingHandler: _repairShippingHandler,
    repairReceivingHandler: _repairReceivingHandler,
    equipmentScrapSaleHandler: _equipmentScrapSaleHandler,
    transferRollbackHandler: _transferRollbackHandler
  };
}
