import { singleton, inject } from 'tsyringe';
import type { IAccessoryRepository, AccessoryQueryParams } from '../domain/IAccessoryRepository.js';
import type { IEquipmentRepository } from '../domain/IEquipmentRepository.js';
import { Accessory, EquipmentCategory, TrackingType, LocationStatus } from '../domain/Accessory.entity.js';
import { v4 as uuidv4 } from 'uuid';


export interface CreateAccessoryDto {
  accessory_name: string;
  model_no?: string;
  category: EquipmentCategory;
  tracking_type: TrackingType;
  quantity: number;
  serial_number?: string;
  manage_code?: string;
  unit?: string;
  location_id?: string;
  location_status?: LocationStatus;
  manufacturer?: string;
  technical_params?: string;
  keeper_id?: string;
  purchase_date?: string | Date;
  purchase_price?: number | string;
  supplier?: string;
  calibration_expiry?: string | Date;
  certificate_no?: string;
  certificate_issuer?: string;
  attachments?: string[];
  images?: string[];
  host_equipment_id?: string;
  usage_status?: 'idle' | 'in_use';
  source_type?: 'inbound_bundle' | 'inbound_separate';
}

@singleton()
export class AccessoryUseCase {
  constructor(
    @inject('IAccessoryRepository') private repository: IAccessoryRepository,
    @inject('IEquipmentRepository') private equipmentRepository: IEquipmentRepository
  ) {}
  async getAllAccessories(params: AccessoryQueryParams) {
    return this.repository.findAll(params);
  }

  async getUnboundAccessories(params: { category?: string; status?: string; keyword?: string }) {
    return this.repository.findUnbound(params);
  }

  async getAccessoryById(id: string) {
    return this.repository.findById(id);
  }

  async createAccessoryInstance(data: CreateAccessoryDto) {
    const { tracking_type } = data;

    const id = uuidv4();
    let manageCode = data.manage_code;
    if (!manageCode && data.category !== 'fake_load') {
      manageCode = `ACC${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }

    const finalTrackingType = data.category === 'fake_load' ? 'BATCH' : tracking_type;

    let resolvedKeeperId = data.keeper_id;
    let resolvedLocationStatus = data.location_status || 'warehouse';

    if (data.location_id) {
      const locDetails = await this.equipmentRepository.findLocationDetails(data.location_id);
      if (!resolvedKeeperId) resolvedKeeperId = locDetails.manager_id || undefined;
      resolvedLocationStatus = locDetails.type || 'warehouse';
    }

    const accessory = new Accessory({
      id,
      accessoryName: data.accessory_name,
      modelNo: data.model_no,
      category: data.category,
      trackingType: finalTrackingType,
      quantity: data.quantity,
      serialNumber: data.serial_number,
      manageCode,
      unit: data.unit || '台',
      locationId: data.location_id || '',
      locationStatus: resolvedLocationStatus,
      keeperId: resolvedKeeperId,
      purchaseDate: data.purchase_date,
      purchasePrice: typeof data.purchase_price === 'string' ? parseFloat(data.purchase_price) : data.purchase_price,
      supplier: data.supplier,
      hostEquipmentId: data.host_equipment_id,
      usageStatus: data.usage_status || (data.host_equipment_id ? 'in_use' : 'idle'),
      sourceType: data.source_type || 'inbound_separate'
    });

    await this.repository.save(accessory);
    return { id, manage_code: manageCode };
  }

  async updateAccessoryInstance(id: string, updates: any) {
    const existing = await this.getAccessoryById(id);
    if (!existing) {
      throw new Error('配件不存在');
    }

    await this.repository.update(id, updates);
    return true;
  }

  async deleteAccessoryInstance(id: string) {
    const existing = await this.getAccessoryById(id);
    if (!existing) {
      throw new Error('配件不存在');
    }

    await this.repository.softDelete(id);
    return true;
  }

  async bindAccessoryToEquipment(accessoryId: string, hostEquipmentId: string, quantity: number = 1) {
    const accessory = await this.getAccessoryById(accessoryId);
    if (!accessory) {
      throw new Error('配件不存在');
    }

    if (accessory.host_equipment_id) {
      throw new Error('配件已绑定到设备');
    }

    if (accessory.quantity < quantity) {
      throw new Error('配件数量不足');
    }

    if (accessory.quantity === quantity) {
      await this.repository.bindToEquipment(accessoryId, hostEquipmentId, quantity, 'in_use');
    } else {
      await this.repository.updateQuantityAndBind(accessoryId, quantity, hostEquipmentId, 'in_use');
      
      const newId = uuidv4();
      const accessoryEntity = new Accessory({
        id: newId,
        accessoryName: accessory.accessory_name,
        modelNo: accessory.model_no,
        category: accessory.category,
        trackingType: accessory.tracking_type,
        quantity: accessory.quantity - quantity,
        serialNumber: accessory.serial_number,
        manageCode: accessory.manage_code,
        unit: accessory.unit,
        locationId: accessory.location_id,
        locationStatus: accessory.location_status,
        keeperId: accessory.keeper_id,
        usageStatus: 'idle',
        sourceType: 'inbound_separate'
      });
      await this.repository.save(accessoryEntity);
    }

    return true;
  }

  async splitAndBindAccessory(accessoryId: string, hostEquipmentId: string, quantity: number) {
    await this.bindAccessoryToEquipment(accessoryId, hostEquipmentId, quantity);
    return { success: true };
  }

  async unbindAccessoryFromEquipment(accessoryId: string, hostEquipmentId: string, quantity: number = 1) {
    const accessory = await this.getAccessoryById(accessoryId);
    if (!accessory) {
      throw new Error('配件不存在');
    }

    if (!accessory.host_equipment_id) {
      throw new Error('配件未绑定到设备');
    }

    if (accessory.quantity === quantity) {
      await this.repository.update(accessoryId, { host_equipment_id: null, usage_status: 'idle' });
    } else if (accessory.quantity > quantity) {
      await this.repository.update(accessoryId, { quantity: accessory.quantity - quantity, host_equipment_id: null, usage_status: 'idle' });
      
      const newId = uuidv4();
      const newManageCode = `ACC${Date.now()}${Math.floor(Math.random() * 10000)}`;

      const accessoryEntity = new Accessory({
        id: newId,
        accessoryName: accessory.accessory_name,
        modelNo: accessory.model_no,
        category: accessory.category,
        trackingType: accessory.tracking_type,
        quantity: quantity,
        serialNumber: accessory.serial_number,
        manageCode: newManageCode,
        unit: accessory.unit,
        locationId: accessory.location_id,
        locationStatus: accessory.location_status,
        keeperId: accessory.keeper_id,
        hostEquipmentId: hostEquipmentId,
        usageStatus: 'in_use',
        sourceType: 'inbound_separate'
      });
      await this.repository.save(accessoryEntity);
    }

    return true;
  }

  async markAccessoryLost(
    accessoryId: string,
    operatorId: string,
    operatorName: string,
    reason: string,
    equipmentId?: string,
    transferOrderId?: string
  ) {
    const accessory = await this.getAccessoryById(accessoryId);
    if (!accessory) {
      throw new Error('配件不存在');
    }

    await this.repository.update(accessoryId, { usage_status: 'lost', health_status: 'lost' });

    return true;
  }

  async recoverAccessory(accessoryId: string, operatorId: string, operatorName: string, notes?: string) {
    const accessory = await this.getAccessoryById(accessoryId);
    if (!accessory) {
      throw new Error('配件不存在');
    }

    await this.repository.update(accessoryId, { usage_status: 'idle', health_status: 'normal' });

    return true;
  }

  async getLostRecords(accessoryId: string) {
    return this.repository.findLostRecords(accessoryId);
  }

  async getAccessoriesWithDetails(equipmentId: string) {
    return this.repository.findByHostEquipmentId(equipmentId);
  }

  async getImagesByAccessoryId(accessoryId: string) {
    return this.repository.findImagesByAccessoryId(accessoryId);
  }

  async deleteImage(imageId: string): Promise<boolean> {
    return this.repository.deleteImage(imageId);
  }

  async getAccessoryNames() {
    return this.repository.findAccessoryNames();
  }

  async getAccessoryModelsByName(name: string) {
    return this.repository.findModelsByName(name);
  }
}
