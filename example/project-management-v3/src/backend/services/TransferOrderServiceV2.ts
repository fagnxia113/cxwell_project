import { singleton } from 'tsyringe'
import { prisma } from '../database/prisma.js'
import { v4 as uuidv4 } from 'uuid'
import { transferOrderRepository, TransferOrderWithItems } from '../repository/TransferOrderRepository.js'
import { equipmentRepository } from '../repository/EquipmentRepository.js'
import { AuditService } from './AuditService.js'

@singleton()
export class TransferOrderServiceV2 {
    private repo = transferOrderRepository
    private audit = new AuditService()

    /**
     * 获取调拨单列表
     */
    async getTransferOrders(params: any) {
        return this.repo.findMany(params)
    }

    /**
     * 获取调拨单详情
     */
    async getTransferOrderById(id: string) {
        return this.repo.findById(id)
    }

    /**
     * 创建调拨单
     */
    async createTransferOrder(data: any, items: any[]) {
        const id = uuidv4()
        const order_no = `TO${Date.now()}`
        
        return prisma.$transaction(async (tx) => {
            const processedItems = []
            
            for (const item of items) {
                processedItems.push({
                    ...item,
                    id: uuidv4(),
                    order_id: id
                })
            }
            
            return this.repo.createWithItems({
                ...data,
                id,
                order_no,
                status: 'pending_from'
            }, processedItems, tx)
        })
    }

    /**
     * 确认出库（发货）
     */
    async confirmShipping(
        id: string,
        params: {
            shipping_no?: string
            shipped_by?: string
            shipped_at?: string
            shipping_attachment?: string
            item_images?: { item_id: string; images: string[] }[]
            package_images?: string[]
            shipping_notes?: string
        }
    ): Promise<TransferOrderWithItems> {
        return prisma.$transaction(async (tx) => {
            const existingOrder = await tx.equipment_transfer_orders.findUnique({ where: { id } })
            if (!existingOrder) {
                throw new Error('调拨单不存在')
            }
            if (existingOrder.status === 'shipping') {
                return existingOrder as any
            }
            
            await this.repo.confirmShipping(id, {
                shipping_no: params.shipping_no,
                shipped_by: params.shipped_by,
                shipped_at: params.shipped_at ? new Date(params.shipped_at) : new Date(),
                shipping_attachment: params.shipping_attachment,
                shipping_package_images: params.package_images,
                shipping_notes: params.shipping_notes,
                item_images: params.item_images
            }, tx)

            const items = await this.repo.findItems(id)
            for (const item of items) {
                if (!item.equipment_id) continue
                if (item.is_accessory) {
                    await tx.equipment_accessory_instances.update({
                        where: { id: item.equipment_id },
                        data: { location_status: 'transferring' as any, updated_at: new Date() }
                    })
                } else {
                    await tx.equipment_instances.update({
                        where: { id: item.equipment_id },
                        data: { location_status: 'transferring' as any, updated_at: new Date() }
                    })
                }
            }

            await this.audit.log({
                entityType: 'transfer_order',
                entityId: id,
                action: 'transfer_shipped',
                operatorId: params.shipped_by || 'system',
                operatorName: 'System',
                newValue: { order_no: existingOrder.order_no, details: '联运出库发货' }
            }, tx)

            const updated = await this.repo.findById(id)
            return updated!
        })
    }

    /**
     * 确认收货（入库）
     * 如果是部分收货，此处仅记录差异，不触发库存变更。
     * 全部收货则直接更新库存。
     */
    async confirmReceiving(
        id: string,
        params: {
            received_by: string
            received_at?: string
            receive_comment?: string
            receiving_package_images?: string[]
            received_items?: { item_id: string; received_quantity: number }[]
            item_images?: { item_id: string; images: string[] }[]
            isPartial?: boolean
        }
    ): Promise<boolean> {
        return prisma.$transaction(async (tx) => {
            const existingOrder = await tx.equipment_transfer_orders.findUnique({ where: { id } })
            if (!existingOrder) throw new Error('调拨单不存在')
            
            if (existingOrder.status === 'completed') return true

            const items = await this.repo.findItems(id)
            
            let isPartial = params.isPartial ?? false
            let totalReceived = 0
            if (params.received_items) {
                for (const item of items) {
                    const received = params.received_items.find(ri => ri.item_id === item.id)
                    if (received && received.received_quantity < item.quantity) {
                        isPartial = true
                    }
                    totalReceived += received?.received_quantity ?? item.quantity
                }
            }

            await this.repo.confirmReceiving(id, {
                received_by: params.received_by,
                received_at: params.received_at ? new Date(params.received_at) : new Date(),
                receive_comment: params.receive_comment,
                receiving_package_images: params.receiving_package_images,
                total_received_quantity: totalReceived,
                isPartial,
                item_received_details: params.received_items,
                item_images: params.item_images
            }, tx)

            // 如果全部收货，直接终结并同步库存
            if (!isPartial) {
                await this.finalizeInventoryUpdate(id, params.received_by, tx)
            }

            await this.audit.log({
                entityType: 'transfer_order',
                entityId: id,
                action: isPartial ? 'transfer_received_partial' : 'transfer_received',
                operatorId: params.received_by,
                operatorName: 'System',
                newValue: { 
                    order_no: existingOrder.order_no, 
                    details: isPartial ? '异常收货，等待调出方确认' : '确认收货完成，库存已更新' 
                }
            })

            return true
        })
    }

    /**
     * 最终确认收货分拆（由调出方确认后触发）
     */
    async finalizeInventorySplit(id: string, operatorId: string): Promise<boolean> {
        return prisma.$transaction(async (tx) => {
            return this.finalizeInventoryUpdate(id, operatorId, tx)
        })
    }

    /**
     * 内部方法：执行库存变更逻辑
     */
    private async finalizeInventoryUpdate(id: string, operatorId: string, tx: any): Promise<boolean> {
        const existingOrder = await tx.equipment_transfer_orders.findUnique({ where: { id } })
        if (!existingOrder) throw new Error('调拨单不存在')

        const items = await this.repo.findItems(id)
        const targetLocationId = (existingOrder.to_location_type === 'warehouse' ? existingOrder.to_warehouse_id : existingOrder.to_project_id) as string
        const targetStatus = existingOrder.to_location_type === 'warehouse' ? 'warehouse' : 'in_project'
        const originalLocationId = (existingOrder.from_location_type === 'warehouse' ? existingOrder.from_warehouse_id : existingOrder.from_project_id) as string
        const originalStatus = existingOrder.from_location_type === 'warehouse' ? 'warehouse' : 'in_project'

        for (const item of items) {
            if (!item.equipment_id) continue

            const receivedQty = item.received_quantity ?? item.quantity
            const unreceivedQty = item.quantity - receivedQty

            if (receivedQty > 0) {
                // 处理已收到的部分
                if (item.is_accessory) {
                    if (unreceivedQty > 0) {
                        const source = await tx.equipment_accessory_instances.findUnique({ where: { id: item.equipment_id } })
                        if (source) {
                            const rollbackId = uuidv4()
                            const { id: oldId, ...dataToCopy } = source
                            await tx.equipment_accessory_instances.create({
                                data: {
                                    ...dataToCopy,
                                    id: rollbackId,
                                    quantity: unreceivedQty,
                                    location_id: originalLocationId,
                                    location_status: originalStatus as any,
                                    usage_status: 'idle' as any,
                                    updated_at: new Date()
                                }
                            })
                            await this.copyEquipmentImages(item.equipment_id, rollbackId, tx)
                        }
                        
                        await tx.equipment_accessory_instances.update({
                            where: { id: item.equipment_id },
                            data: {
                                quantity: receivedQty,
                                location_id: targetLocationId,
                                location_status: targetStatus as any,
                                keeper_id: operatorId ?? undefined,
                                updated_at: new Date()
                            }
                        })
                    } else {
                        await tx.equipment_accessory_instances.update({
                            where: { id: item.equipment_id },
                            data: {
                                location_id: targetLocationId,
                                location_status: targetStatus as any,
                                keeper_id: operatorId ?? undefined,
                                updated_at: new Date()
                            }
                        })
                    }
                } else {
                    if (unreceivedQty > 0) {
                        const source = await tx.equipment_instances.findUnique({ where: { id: item.equipment_id } })
                        if (source) {
                            const rollbackId = uuidv4()
                            const { id: oldId, ...dataToCopy } = source
                            await tx.equipment_instances.create({
                                data: {
                                    ...(dataToCopy as any),
                                    id: rollbackId,
                                    quantity: unreceivedQty,
                                    location_id: originalLocationId,
                                    location_status: originalStatus as any,
                                    keeper_id: existingOrder.from_manager_id || undefined,
                                    health_status: 'normal',
                                    usage_status: 'idle',
                                    created_at: new Date(),
                                    updated_at: new Date()
                                }
                            })
                            await this.copyEquipmentImages(item.equipment_id, rollbackId, tx)
                        }
                        await tx.equipment_instances.update({
                            where: { id: item.equipment_id },
                            data: {
                                quantity: receivedQty,
                                location_id: targetLocationId,
                                location_status: targetStatus as any,
                                keeper_id: operatorId ?? undefined,
                                updated_at: new Date()
                            }
                        })
                    } else {
                        await equipmentRepository.transferEquipment(item.equipment_id, {
                            location_id: targetLocationId,
                            location_status: targetStatus,
                            keeper_id: operatorId ?? undefined
                        }, tx)
                    }
                }
            } else {
                // 完全没收到
                if (item.is_accessory) {
                    await tx.equipment_accessory_instances.update({
                        where: { id: item.equipment_id },
                        data: {
                            location_id: originalLocationId,
                            location_status: originalStatus as any,
                            usage_status: 'idle' as any,
                            updated_at: new Date()
                        }
                    })
                } else {
                    await tx.equipment_instances.update({
                        where: { id: item.equipment_id },
                        data: {
                            location_id: originalLocationId,
                            location_status: originalStatus as any,
                            usage_status: 'idle' as any,
                            updated_at: new Date()
                        }
                    })
                }
            }
        }
        return true
    }

    /**
     * 同步/克隆设备关联的台账照片
     */
    private async copyEquipmentImages(sourceId: string, targetId: string, tx: any) {
        const originalImages = await tx.equipment_images.findMany({
            where: { equipment_id: sourceId }
        })

        if (originalImages.length > 0) {
            for (const img of originalImages) {
                const { id: oldId, ...dataToCopy } = img
                await tx.equipment_images.create({
                    data: {
                        ...dataToCopy,
                        id: uuidv4(),
                        equipment_id: targetId,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                })
            }
        }
    }
}

export const transferOrderServiceV2 = new TransferOrderServiceV2();
