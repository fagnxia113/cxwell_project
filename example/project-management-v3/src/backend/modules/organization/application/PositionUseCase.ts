import { singleton, inject } from 'tsyringe';
import { Position } from '../domain/Position.entity.js';
import type { IPositionRepository, PositionQueryParams } from '../domain/IPositionRepository.js';
import { v4 as uuidv4 } from 'uuid';

@singleton()
export class PositionUseCase {
  constructor(
    @inject('IPositionRepository') private repository: IPositionRepository
  ) {}

  async createPosition(data: any): Promise<Position> {
    const position = new Position({
      ...data,
      id: uuidv4(),
      code: data.code || `POS-${Date.now()}`
    });
    return this.repository.create(position);
  }

  async getPositionById(id: string): Promise<Position | null> {
    return this.repository.findById(id);
  }

  async getPositions(params?: PositionQueryParams): Promise<Position[]> {
    return this.repository.findAll(params);
  }

  async getActivePositions(): Promise<Position[]> {
    return this.repository.findActive();
  }

  async updatePosition(id: string, data: Partial<Position>): Promise<Position> {
    return this.repository.update(id, data);
  }

  async deletePosition(id: string): Promise<boolean> {
    const employeeCount = await this.repository.countEmployees(id);
    if (employeeCount > 0) {
      throw new Error('该岗位下存在员工，无法删除');
    }

    return this.repository.delete(id);
  }

  async getPositionCategories(): Promise<string[]> {
    const positions = await this.repository.findAll();
    const categories = new Set<string>();
    positions.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }
}
