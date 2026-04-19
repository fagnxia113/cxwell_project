import { singleton, inject } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import type { IWarehouseRepository, WarehouseQueryParams } from '../domain/IWarehouseRepository.js';
import { Warehouse } from '../domain/Warehouse.entity.js';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentUseCase } from '../../equipment/application/EquipmentUseCase.js';
import type { IEmployeeRepository } from '../../personnel/domain/IEmployeeRepository.js';

export interface CreateWarehouseDto {
  name: string;
  type?: 'main' | 'branch' | 'project';
  location?: string;
  address?: string;
  manager_id?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateWarehouseDto {
  name?: string;
  type?: 'main' | 'branch' | 'project';
  location?: string;
  address?: string;
  manager_id?: string;
  status?: 'active' | 'inactive';
}

@singleton()
export class WarehouseUseCase {
  constructor(
    @inject('IWarehouseRepository') private repository: IWarehouseRepository,
    @inject('IEmployeeRepository') private employeeRepository: IEmployeeRepository,
    @inject('EquipmentUseCase') private equipmentUseCase: EquipmentUseCase
  ) {}

  private async generateWarehouseNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const result = await this.repository.findAll({ page: 1, pageSize: 100 });
    const count = result.data.filter(w => w.warehouseNo.includes(`WH-${dateStr}`)).length;
    const seq = (count + 1).toString().padStart(3, '0');
    
    return `WH-${dateStr}-${seq}`;
  }

  async createWarehouse(data: CreateWarehouseDto) {
    const id = uuidv4();
    const warehouseNo = await this.generateWarehouseNo();

    const warehouse = new Warehouse({
      id,
      warehouseNo,
      name: data.name,
      type: data.type || 'main',
      location: data.location,
      address: data.address,
      managerId: data.manager_id,
      status: data.status || 'active'
    });

    await this.repository.create(warehouse);
    return warehouse;
  }

  async updateWarehouse(id: string, data: UpdateWarehouseDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('仓库不存在');
    }

    const updated = new Warehouse({
      ...existing.snapshot(),
      id,
      name: data.name ?? existing.name,
      type: data.type ?? existing.type,
      location: data.location ?? existing.location,
      address: data.address ?? existing.address,
      managerId: data.manager_id ?? existing.managerId,
      status: data.status ?? existing.status
    });

    await this.repository.update(updated);

    if (data.manager_id) {
      await this.equipmentUseCase.syncKeepersByLocation(id, data.manager_id);
    }

    return updated;
  }

  async deleteWarehouse(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('仓库不存在');
    }
    await this.repository.delete(id);
    return true;
  }

  async getWarehouseById(id: string) {
    return this.repository.findById(id);
  }

  async getWarehouses(params: WarehouseQueryParams) {
    const result = await this.repository.findAll(params);
    
    // 聚合经理姓名，保持与 UI 兼容
    const dataWithManager = await Promise.all(
      result.data.map(async (w) => {
        const snapshot = w.snapshot();
        const data = {
          ...snapshot,
          warehouse_no: snapshot.warehouseNo, // 兼容前端字段名
          manager_name: null as string | null
        };
        
        if (snapshot.managerId) {
          const employee = await this.employeeRepository.findById(snapshot.managerId);
          data.manager_name = employee?.name || null;
        }
        return data;
      })
    );

    return {
      data: dataWithManager,
      total: result.total,
      totalPages: Math.ceil(result.total / (params.pageSize || 10))
    };
  }

  /**
   * 获取仓库管理员的详细用户信息
   */
  async getWarehouseManager(id: string) {
    const warehouse = await this.repository.findById(id);
    if (!warehouse || !warehouse.managerId) return null;

    const employee = await this.employeeRepository.findById(warehouse.managerId);
    if (!employee || !employee.userId) return employee ? { id: employee.id, name: employee.name } : null;

    // 此处由于 User 模块尚未完全 DDD 化，暂时通过 prisma 直接查询或保持与老逻辑兼容
    const user = await prisma.users.findUnique({
      where: { id: employee.userId },
      select: { id: true, username: true, name: true, role: true }
    });

    return user || { id: employee.userId, name: employee.name };
  }

  async getActiveWarehouses() {
    return this.repository.findActive();
  }

  async getWarehouseEquipment(warehouseId: string, filters: { search?: string; page: number; pageSize: number }) {
    const { search, page, pageSize } = filters;
    
    return this.equipmentUseCase.getInstances({
      location_id: warehouseId,
      location_status: 'warehouse',
      search,
      page,
      pageSize
    });
  }
}
