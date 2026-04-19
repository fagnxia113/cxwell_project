import { v4 as uuidv4 } from 'uuid';
import { EquipmentCategory, TrackingType, LocationStatus, HealthStatus, UsageStatus } from './Equipment.entity.js';
export type { EquipmentCategory, TrackingType, LocationStatus, HealthStatus, UsageStatus };

export interface IAccessoryProps {
  id?: string;
  accessoryName: string;
  modelNo?: string;
  category: EquipmentCategory;
  trackingType: TrackingType;
  quantity: number;
  manageCode?: string;
  serialNumber?: string;
  unit: string;
  locationId: string;
  locationStatus: LocationStatus;
  keeperId?: string;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  supplier?: string;
  hostEquipmentId?: string;
  usageStatus: 'idle' | 'in_use';
  sourceType: 'inbound_bundle' | 'inbound_separate';
  notes?: string;
  attachments?: any[];
  deletedAt?: Date | string | null;
}

/**
 * 配件领域对象 (Domain Entity)
 */
export class Accessory {
  private props: IAccessoryProps;

  constructor(props: IAccessoryProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      unit: props.unit || '台',
      usageStatus: props.usageStatus || (props.hostEquipmentId ? 'in_use' : 'idle'),
      sourceType: props.sourceType || 'inbound_separate',
    };
    this.applyBusinessRules();
  }

  private applyBusinessRules() {
    if (this.props.hostEquipmentId) {
      this.props.usageStatus = 'in_use';
    }

    if (!this.props.manageCode && this.props.trackingType === 'SERIALIZED') {
      this.props.manageCode = `AC${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
  }

  get id() { return this.props.id!; }
  get snapshot() { return { ...this.props }; }

  public toJSON() {
    return { ...this.props };
  }
}
