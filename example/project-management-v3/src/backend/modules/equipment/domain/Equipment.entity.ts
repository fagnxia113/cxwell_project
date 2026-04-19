import { v4 as uuidv4 } from 'uuid';

export type EquipmentCategory = 'instrument' | 'fake_load' | 'cable' | 'accessory';
export type TrackingType = 'SERIALIZED' | 'BATCH';
export type HealthStatus = 'normal' | 'slightly_damaged' | 'affected_use' | 'repairing' | 'scrapped';
export type UsageStatus = 'idle' | 'in_use' | 'lost' | 'scrapped';
export type LocationStatus = 'warehouse' | 'in_project' | 'repairing' | 'transferring';

export interface IEquipmentProps {
  id?: string;
  equipmentName: string;
  modelNo: string;
  brand?: string;
  manufacturer?: string;
  category: EquipmentCategory;
  trackingType: TrackingType;
  quantity: number;
  manageCode?: string;
  serialNumber?: string;
  unit: string;
  locationId: string;
  locationStatus: LocationStatus;
  healthStatus: HealthStatus;
  usageStatus: UsageStatus;
  keeperId?: string;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  supplier?: string;
  calibrationExpiry?: Date | string;
  certificateNo?: string;
  certificateIssuer?: string;
  technicalParams?: string;
  notes?: string;
  attachments?: any[];
  deletedAt?: Date | string | null;
  version?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  locationName?: string;
}

/**
 * 设备领域对象 (Domain Entity)
 * 封装设备的核心业务规则
 */
export class Equipment {
  private props: IEquipmentProps;

  constructor(props: IEquipmentProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      unit: props.unit || '台',
      healthStatus: props.healthStatus || 'normal',
      usageStatus: props.usageStatus || 'idle',
      locationStatus: props.locationStatus || 'warehouse',
      version: props.version || 1,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
    this.applyBusinessRules();
  }

  /**
   * 应用核心业务规则
   */
  private applyBusinessRules() {
    // 规则 1：假负载强制使用 BATCH 模式，且不生成管理编码
    if (this.props.category === 'fake_load') {
      this.props.trackingType = 'BATCH';
    }

    // 规则 2：管理编码生成逻辑 (如果是序列化且没有传编码)
    if (!this.props.manageCode && this.props.category !== 'fake_load' && this.props.trackingType === 'SERIALIZED') {
      this.props.manageCode = `EQ${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
  }

  /**
   * 变更状态逻辑
   */
  public updateStatus(status: {
    healthStatus?: HealthStatus;
    usageStatus?: UsageStatus;
    locationStatus?: LocationStatus;
  }) {
    if (status.healthStatus) this.props.healthStatus = status.healthStatus;
    if (status.usageStatus) this.props.usageStatus = status.usageStatus;
    if (status.locationStatus) this.props.locationStatus = status.locationStatus;
  }

  // Getters
  get id() { return this.props.id!; }
  get snapshot() { return { ...this.props }; }
  get manageCode() { return this.props.manageCode; }
  get version() { return this.props.version || 1; }

  /**
   * 转换为外部 DTO 或数据库模型
   */
  public toJSON() {
    return { 
      ...this.props,
      // 兼容前端使用的下划线命名
      equipment_name: this.props.equipmentName,
      model_no: this.props.modelNo,
      manage_code: this.props.manageCode,
      serial_number: this.props.serialNumber,
      location_id: this.props.locationId,
      location_status: this.props.locationStatus,
      health_status: this.props.healthStatus,
      usage_status: this.props.usageStatus,
      keeper_id: this.props.keeperId,
      purchase_date: this.props.purchaseDate,
      purchase_price: this.props.purchasePrice,
      supplier: this.props.supplier,
      calibration_expiry: this.props.calibrationExpiry,
      certificate_no: this.props.certificateNo,
      certificate_issuer: this.props.certificateIssuer,
      technical_params: this.props.technicalParams,
      tracking_type: this.props.trackingType,
      location_name: this.props.locationName,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt
    };
  }
}
