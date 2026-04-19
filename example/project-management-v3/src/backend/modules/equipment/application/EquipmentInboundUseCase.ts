import { singleton, inject } from 'tsyringe';
import type { IEquipmentRepository } from '../domain/IEquipmentRepository.js';
import { Equipment, EquipmentCategory, TrackingType, LocationStatus } from '../domain/Equipment.entity.js';
import { Accessory } from '../domain/Accessory.entity.js';
import {
  EquipmentInboundDTO,
  AccessoryInboundDTO,
  WorkflowFormDataMapper
} from '../domain/EquipmentInboundDTO.js';

@singleton()
export class EquipmentInboundUseCase {
  constructor(
    @inject('IEquipmentRepository') private repository: IEquipmentRepository
  ) {}

  async executeInbound(dto: EquipmentInboundDTO | Record<string, any>): Promise<Record<string, any>> {
    let plainData: Record<string, any>;

    if (dto && typeof dto === 'object' && 'toPlainObject' in dto && typeof (dto as any).toPlainObject === 'function') {
      plainData = (dto as EquipmentInboundDTO).toPlainObject();
    } else {
      plainData = this.mapToPlainObject(dto as Record<string, any>);
    }

    if (plainData.manage_code) {
      const isUnique = await this.repository.checkManageCodeUnique(plainData.manage_code);
      if (!isUnique) {
        throw new Error(`管理编码 "${plainData.manage_code}" 已存在，请使用其他编码`);
      }
    }

    let resolvedKeeperId = plainData.keeper_id;
    let resolvedLocationStatus = plainData.location_status;
    if (!resolvedKeeperId || !resolvedLocationStatus) {
      const locDetails = await this.repository.findLocationDetails(plainData.location_id);
      if (!resolvedKeeperId) resolvedKeeperId = locDetails.manager_id || undefined;
      if (!resolvedLocationStatus) resolvedLocationStatus = locDetails.type || 'warehouse';
    }

    const equipment = new Equipment({
      equipmentName: plainData.equipment_name,
      modelNo: plainData.model_no,
      category: plainData.category,
      trackingType: plainData.tracking_type,
      quantity: plainData.quantity,
      serialNumber: plainData.serial_number,
      manageCode: plainData.manage_code,
      unit: plainData.unit || '台',
      locationId: plainData.location_id,
      locationStatus: (resolvedLocationStatus || 'warehouse') as LocationStatus,
      keeperId: resolvedKeeperId,
      healthStatus: 'normal',
      usageStatus: 'idle',
      brand: plainData.brand || plainData.manufacturer,
      manufacturer: plainData.manufacturer,
      supplier: plainData.supplier,
      purchaseDate: plainData.purchase_date,
      purchasePrice: typeof plainData.purchase_price === 'string' 
        ? parseFloat(plainData.purchase_price) 
        : plainData.purchase_price,
      calibrationExpiry: plainData.calibration_expiry,
      certificateNo: plainData.certificate_no,
      certificateIssuer: plainData.certificate_issuer,
      technicalParams: plainData.technical_params,
      notes: plainData.notes,
      attachments: plainData.attachments
    } as any);

    await this.repository.save(equipment);

    if (plainData.images && plainData.images.length > 0) {
      const mappedImages = this.extractImageUrls(plainData.images);
      if (mappedImages.length > 0) {
        await this.repository.saveImages(equipment.id, mappedImages);
      }
    }

    return equipment.toJSON();
  }

  async executeAccessoryInbound(dto: AccessoryInboundDTO | Record<string, any>): Promise<Record<string, any>> {
    const plainData = this.mapAccessoryToPlainObject(dto);

    let resolvedKeeperId = plainData.keeperId;
    let resolvedLocationStatus = plainData.locationStatus;
    if (!resolvedKeeperId || !resolvedLocationStatus) {
      const locDetails = await this.repository.findLocationDetails(plainData.locationId);
      if (!resolvedKeeperId) resolvedKeeperId = locDetails.manager_id || undefined;
      if (!resolvedLocationStatus) resolvedLocationStatus = locDetails.type || 'warehouse';
    }

    const accessory = new Accessory({
      accessoryName: plainData.accessoryName,
      modelNo: plainData.modelNo,
      category: plainData.category,
      trackingType: plainData.trackingType,
      quantity: plainData.quantity,
      serialNumber: plainData.serialNumber,
      manageCode: plainData.manageCode,
      unit: plainData.unit || '台',
      locationId: plainData.locationId,
      locationStatus: (resolvedLocationStatus || 'warehouse') as LocationStatus,
      keeperId: resolvedKeeperId,
      purchaseDate: plainData.purchaseDate,
      purchasePrice: plainData.purchasePrice,
      supplier: plainData.supplier,
      hostEquipmentId: plainData.hostEquipmentId,
      usageStatus: plainData.usageStatus || (plainData.hostEquipmentId ? 'in_use' : 'idle'),
      sourceType: plainData.sourceType,
      notes: plainData.notes || '',
      attachments: plainData.attachments || []
    });

    await this.repository.saveAccessory(accessory);

    if (plainData.images && plainData.images.length > 0) {
      const mappedImages = this.extractImageUrls(plainData.images);
      if (mappedImages.length > 0) {
        await this.repository.saveImages(accessory.id, mappedImages, 'accessory');
      }
    }

    return accessory.toJSON();
  }

  async executeBatchInbound(
    dtos: EquipmentInboundDTO[],
    locationId: string,
    defaultKeeperId?: string,
    locationStatus: LocationStatus = 'warehouse'
  ): Promise<Record<string, any>[]> {
    const results: Record<string, any>[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < dtos.length; i++) {
      const dto = dtos[i];
      try {
        const result = await this.executeInbound(dto);
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message });
      }
    }

    if (errors.length > 0) {
      throw new BatchInboundException(
        `批量入库部分失败，共 ${errors.length}/${dtos.length} 项失败`,
        errors
      );
    }

    return results;
  }

  async createFromWorkflowInstance(instanceData: {
    variables?: { formData?: Record<string, any> };
  }): Promise<Record<string, any>[]> {
    const formData = instanceData.variables?.formData || {};
    const items = Array.isArray(formData.items) ? formData.items : [formData];
    const locationId = formData.warehouse_id || formData.location_id || '';

    const locDetails = await this.repository.findLocationDetails(locationId);
    const resolvedKeeperId = locDetails.manager_id || formData.applicant_id;
    const resolvedLocationStatus = (locDetails.type || 'warehouse') as LocationStatus;

    const results: Record<string, any>[] = [];

    for (const item of items) {
      if (!item.equipment_name && !item.category) continue;

      const itemLocation = item.location_id || locationId;

      if (item.category === 'accessory') {
        const accessoryDto = WorkflowFormDataMapper.toAccessoryInboundDTO(
          formData,
          item,
          itemLocation,
          resolvedKeeperId,
          resolvedLocationStatus
        );
        const accessory = await this.executeAccessoryInbound(accessoryDto);
        results.push(accessory);
      } else {
        const equipmentDto = WorkflowFormDataMapper.toEquipmentInboundDTO(
          formData,
          item,
          itemLocation,
          resolvedKeeperId,
          resolvedLocationStatus
        );
        const equipment = await this.executeInbound(equipmentDto);
        results.push(equipment);

        if (Array.isArray(item.accessory_list)) {
          for (const acc of item.accessory_list) {
            if (!acc.accessory_name) continue;

            const accessoryDto = WorkflowFormDataMapper.toAccessoryInboundDTO(
              formData,
              {
                ...acc,
                category: item.category,
                serial_numbers: acc.serial_numbers || acc.serial_number || item.serial_numbers || item.serial_number,
                keeper_id: acc.keeper_id || item.keeper_id,
                purchase_date: acc.purchase_date || item.purchase_date,
                supplier: acc.supplier || item.supplier,
                attachments: acc.accessory_attachments || acc.attachments || item.attachments
              },
              itemLocation,
              resolvedKeeperId,
              resolvedLocationStatus,
              equipment.id as string,
              'inbound_bundle'
            );
            await this.executeAccessoryInbound(accessoryDto);
          }
        }
      }
    }

    return results;
  }

  private extractImageUrls(images: (string | Record<string, any>)[]): string[] {
    const urls: string[] = [];
    for (const img of images) {
      if (typeof img === 'string') {
        urls.push(img);
      } else if (img && typeof img === 'object') {
        const url = img.url || img.response?.url;
        if (url) urls.push(url);
      }
    }
    return urls;
  }

  private mapToPlainObject(data: Record<string, any>): Record<string, any> {
    return {
      equipment_name: data.equipment_name,
      model_no: data.model_no,
      category: data.category,
      tracking_type: data.tracking_type,
      quantity: data.quantity,
      unit: data.unit,
      serial_number: data.serial_number,
      manage_code: data.manage_code,
      location_id: data.location_id,
      keeper_id: data.keeper_id,
      location_status: data.location_status,
      manufacturer: data.manufacturer,
      brand: data.brand,
      supplier: data.supplier,
      purchase_date: data.purchase_date,
      purchase_price: data.purchase_price,
      calibration_expiry: data.calibration_expiry,
      certificate_no: data.certificate_no,
      certificate_issuer: data.certificate_issuer,
      technical_params: data.technical_params,
      notes: data.notes,
      attachments: data.attachments,
      images: data.images
    };
  }

  private mapAccessoryToPlainObject(data: Record<string, any>): {
    accessoryName: string;
    modelNo?: string;
    category: EquipmentCategory;
    trackingType: TrackingType;
    quantity: number;
    serialNumber?: string;
    manageCode?: string;
    unit?: string;
    locationId: string;
    locationStatus?: LocationStatus;
    keeperId?: string;
    purchaseDate?: string | Date;
    purchasePrice?: number;
    supplier?: string;
    hostEquipmentId?: string;
    usageStatus?: 'idle' | 'in_use';
    sourceType: 'inbound_bundle' | 'inbound_separate';
    notes?: string;
    attachments?: string[];
    images?: string[];
  } {
    return {
      accessoryName: data.accessory_name || data.accessoryName || '',
      modelNo: data.model_no || data.modelNo,
      category: (data.category || 'instrument') as EquipmentCategory,
      trackingType: (data.tracking_type || data.trackingType || 'BATCH') as TrackingType,
      quantity: data.quantity || 1,
      serialNumber: data.serial_number || data.serialNumber,
      manageCode: data.manage_code || data.manageCode,
      unit: data.unit,
      locationId: data.location_id || data.locationId,
      locationStatus: (data.location_status || data.locationStatus) as LocationStatus || undefined,
      keeperId: data.keeper_id || data.keeperId,
      purchaseDate: data.purchase_date || data.purchaseDate,
      purchasePrice: data.purchase_price || data.purchasePrice,
      supplier: data.supplier,
      hostEquipmentId: data.host_equipment_id || data.hostEquipmentId,
      usageStatus: (data.usage_status || data.usageStatus) as 'idle' | 'in_use' || undefined,
      sourceType: (data.source_type || data.sourceType || 'inbound_separate') as 'inbound_bundle' | 'inbound_separate',
      notes: data.notes,
      attachments: data.attachments,
      images: data.images
    };
  }
}

export class BatchInboundException extends Error {
  constructor(message: string, public readonly errors: Array<{ index: number; error: string }>) {
    super(message);
    this.name = 'BatchInboundException';
  }
}
