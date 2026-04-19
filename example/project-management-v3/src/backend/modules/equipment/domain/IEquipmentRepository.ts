import { Equipment } from './Equipment.entity.js';
import { Accessory } from './Accessory.entity.js';

export interface EquipmentQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  location_id?: string;
  locationId?: string;
  trackingType?: 'SERIALIZED' | 'BATCH';
  search?: string;
  location_status?: string;
  health_status?: string;
  usage_status?: string;
  equipment_source?: string;
  merge?: boolean;
  dataScope?: any;
}

export interface EquipmentStatistics {
  total: number;
  serialized: number;
  batch: number;
  inUse: number;
  idle: number;
}

export interface StockDistribution {
  equipmentName: string;
  modelNo: string;
  locationId: string;
  locationName?: string;
  quantity: number;
}

/**
 * 设备仓库接口 (Repository Interface)
 * 定义了数据访问的协议，但不涉及具体实现（Prisma/SQL）
 */
export interface IEquipmentRepository {
  save(equipment: Equipment): Promise<void>;
  saveAccessory(accessory: Accessory): Promise<void>;
  update(equipment: Equipment): Promise<void>;
  checkManageCodeUnique(manageCode: string, excludeId?: string): Promise<boolean>;
  findById(id: string): Promise<Equipment | null>;
  findLocationDetails(locationId: string): Promise<{ manager_id: string | null; type: 'warehouse' | 'in_project' | null }>;
  findAll(params: EquipmentQueryParams): Promise<{ data: any[]; total: number }>;
  findAggregated(params: EquipmentQueryParams): Promise<{ data: any[]; total: number; totalPages: number }>;
  findStatistics(): Promise<EquipmentStatistics>;
  findStockDistribution(equipmentName: string, modelNo: string): Promise<StockDistribution[]>;
  findEquipmentNames(category?: string): Promise<string[]>;
  findModelsByName(equipmentName: string): Promise<any[]>;
  findModelsByCategory(category: string): Promise<any[]>;
  findAllModels(): Promise<any[]>;
  updateStatus(id: string, status: { health_status?: string; usage_status?: string; location_status?: string; location_id?: string; keeper_id?: string }): Promise<any>;
  transferEquipment(id: string, targetLocationId: string, targetStatus: string, keeperId?: string): Promise<void>;
  syncKeepersByLocation(locationId: string, keeperId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  saveImages(equipmentId: string, images: string[], imageType?: string): Promise<void>;
  findBatchInventory(modelId: string, locationId: string): Promise<any | null>;
  updateBatchInventory(id: string, quantity: number): Promise<void>;
  findImagesByEquipmentId(equipmentId: string): Promise<any[]>;
  getBatchInventory(): Promise<any[]>;
}

export const IEquipmentRepositoryToken = Symbol('IEquipmentRepository');
