import { Accessory } from './Accessory.entity.js';
import { EquipmentCategory, TrackingType, LocationStatus } from './Equipment.entity.js';

export interface AccessoryQueryParams {
  category?: string;
  status?: string;
  location_status?: string;
  bound?: boolean;
  keyword?: string;
  location_id?: string;
  page?: number;
  pageSize?: number;
}

export interface IAccessoryRepository {
  findAll(params: AccessoryQueryParams): Promise<{ total: number; data: any[] }>;
  findUnbound(params: { category?: string; status?: string; keyword?: string }): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  save(accessory: Accessory): Promise<void>;
  update(id: string, updates: any): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  bindToEquipment(accessoryId: string, hostEquipmentId: string, quantity: number, usageStatus: string): Promise<void>;
  updateQuantityAndBind(accessoryId: string, quantity: number, hostEquipmentId: string, usageStatus: string): Promise<void>;
  findLostRecords(accessoryId: string): Promise<any[]>;
  findByHostEquipmentId(equipmentId: string): Promise<any[]>;
  findImagesByAccessoryId(accessoryId: string): Promise<any[]>;
  deleteImage(imageId: string): Promise<boolean>;
  findAccessoryNames(): Promise<string[]>;
  findModelsByName(name: string): Promise<string[]>;
}

export const IAccessoryRepositoryToken = 'IAccessoryRepository';
