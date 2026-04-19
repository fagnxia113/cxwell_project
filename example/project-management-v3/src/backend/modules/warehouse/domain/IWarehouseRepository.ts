import { Warehouse } from './Warehouse.entity.js';

export interface WarehouseQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface IWarehouseRepository {
  create(warehouse: Warehouse): Promise<void>;
  update(warehouse: Warehouse): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Warehouse | null>;
  findByWarehouseNo(warehouseNo: string): Promise<Warehouse | null>;
  findAll(params: WarehouseQueryParams): Promise<{ data: Warehouse[]; total: number }>;
  findActive(): Promise<Warehouse[]>;
}

export const IWarehouseRepositoryToken = Symbol('IWarehouseRepository');
