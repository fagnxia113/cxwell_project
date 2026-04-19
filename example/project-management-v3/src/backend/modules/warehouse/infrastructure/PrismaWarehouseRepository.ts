import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Warehouse } from '../domain/Warehouse.entity.js';
import type { IWarehouseRepository, WarehouseQueryParams } from '../domain/IWarehouseRepository.js';

@singleton()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  async create(warehouse: Warehouse): Promise<void> {
    const data = warehouse.toJSON();
    await prisma.warehouses.create({
      data: {
        id: data.id,
        warehouse_no: data.warehouseNo,
        name: data.name,
        type: data.type as any,
        location: data.location || '',
        address: data.address,
        manager_id: data.managerId,
        status: (data.status || 'active') as any,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  async update(warehouse: Warehouse): Promise<void> {
    const data = warehouse.toJSON();
    await prisma.warehouses.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type as any,
        location: data.location,
        address: data.address,
        manager_id: data.managerId,
        status: (data.status || 'active') as any,
        updated_at: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.warehouses.update({
      where: { id },
      data: { deleted_at: new Date() } as any
    });
  }

  async findById(id: string): Promise<Warehouse | null> {
    const row = await prisma.warehouses.findFirst({
      where: { id, deleted_at: null } as any
    });
    if (!row) return null;
    return this.mapToEntity(row);
  }

  async findByWarehouseNo(warehouseNo: string): Promise<Warehouse | null> {
    const row = await prisma.warehouses.findFirst({
      where: { warehouse_no: warehouseNo, deleted_at: null } as any
    });
    if (!row) return null;
    return this.mapToEntity(row);
  }

  async findAll(params: WarehouseQueryParams): Promise<{ data: Warehouse[]; total: number }> {
    const { page = 1, pageSize = 10, search, status, type } = params;
    
    const where: any = {
      deleted_at: null
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { warehouse_no: { contains: search } },
        { location: { contains: search } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.warehouses.count({ where }),
      prisma.warehouses.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      data: rows.map(row => this.mapToEntity(row)),
      total
    };
  }

  async findActive(): Promise<Warehouse[]> {
    const rows = await prisma.warehouses.findMany({
      where: { status: 'active' as any, deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: any): Warehouse {
    return new Warehouse({
      id: row.id,
      warehouseNo: row.warehouse_no,
      name: row.name,
      type: row.type,
      location: row.location,
      address: row.address,
      managerId: row.manager_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    });
  }
}
