import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { Position } from '../domain/Position.entity.js';
import type { IPositionRepository, PositionQueryParams } from '../domain/IPositionRepository.js';

@singleton()
export class PrismaPositionRepository implements IPositionRepository {
  private mapToEntity(row: any): Position {
    return new Position({
      id: row.id,
      code: row.code,
      name: row.name,
      departmentId: row.department_id,
      departmentName: row.department_name || row.departments?.name || null,
      level: row.level,
      category: row.category,
      description: row.description,
      requirements: row.requirements,
      status: row.status,
      sortOrder: row.sort_order
    });
  }

  async findById(id: string): Promise<Position | null> {
    const row = await prisma.positions.findUnique({ where: { id }, include: { departments: true } });
    return row ? this.mapToEntity(row) : null;
  }

  async findByCode(code: string): Promise<Position | null> {
    const row = await prisma.positions.findUnique({ where: { code } });
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(params?: PositionQueryParams): Promise<Position[]> {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.department_id) where.department_id = params.department_id;
    if (params?.category) where.category = params.category;

    const rows = await prisma.positions.findMany({
      where,
      include: { departments: true },
      orderBy: { sort_order: 'asc' }
    });
    return rows.map(row => this.mapToEntity(row));
  }

  async create(position: Position): Promise<Position> {
    const row = await prisma.positions.create({
      data: {
        id: position.id,
        code: position.code,
        name: position.name,
        department_id: position.departmentId || null,
        department_name: position.departmentName || null,
        level: position.level || 1,
        category: position.category || null,
        description: position.description || null,
        requirements: position.requirements || null,
        status: (position.status as any) || 'active',
        sort_order: position.sortOrder || 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    return this.mapToEntity(row);
  }

  async update(id: string, position: Partial<Position>): Promise<Position> {
    const data: any = {
      updated_at: new Date()
    };
    const p = position as any;
    if (p.code !== undefined) data.code = p.code;
    if (p.name !== undefined) data.name = p.name;
    if (p.departmentId !== undefined || p.department_id !== undefined) data.department_id = p.departmentId || p.department_id;
    if (p.departmentName !== undefined || p.department_name !== undefined) data.department_name = p.departmentName || p.department_name;
    if (p.level !== undefined) data.level = p.level;
    if (p.category !== undefined) data.category = p.category;
    if (p.description !== undefined) data.description = p.description;
    if (p.requirements !== undefined) data.requirements = p.requirements;
    if (p.status !== undefined) data.status = p.status;
    if (p.sortOrder !== undefined || p.sort_order !== undefined) data.sort_order = p.sortOrder ?? p.sort_order;

    const row = await prisma.positions.update({
      where: { id },
      data
    });
    return this.mapToEntity(row);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.positions.delete({ where: { id } });
    return true;
  }

  async findActive(): Promise<Position[]> {
    return this.findAll({ status: 'active' });
  }

  async countEmployees(positionId: string): Promise<number> {
    // Note: in employees table, position is a string (name), not an ID in many places. 
    // Checking schema again...
    // model employees { ... position String @db.VarChar(100) ... }
    // This is inconsistent. I'll search by name if ID is not directly linked.
    const pos = await this.findById(positionId);
    if (!pos) return 0;
    return prisma.employees.count({
      where: { position: pos.name }
    });
  }
}
