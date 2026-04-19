import { Position } from './Position.entity.js';

export interface PositionQueryParams {
  department_id?: string;
  status?: string;
  category?: string;
}

export interface IPositionRepository {
  findById(id: string): Promise<Position | null>;
  findByCode(code: string): Promise<Position | null>;
  findAll(params?: PositionQueryParams): Promise<Position[]>;
  create(position: Position): Promise<Position>;
  update(id: string, position: Partial<Position>): Promise<Position>;
  delete(id: string): Promise<boolean>;
  findActive(): Promise<Position[]>;
  countEmployees(positionId: string): Promise<number>;
}
