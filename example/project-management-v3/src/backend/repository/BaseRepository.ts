import { prisma } from '../database/prisma.js';

/**
 * 基础仓储接口
 * 规范化所有领域的数据库访问
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(params?: any): Promise<{ data: T[]; total: number }>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}

/**
 * Prisma 基础实现类
 * 用于减少重复代码并统一 Prisma 访问模式
 */
export abstract class BasePrismaRepository<T, ID = string> implements IRepository<T, ID> {
  protected prisma = prisma;
  protected abstract model: any;

  async findById(id: ID): Promise<T | null> {
    return await this.model.findUnique({ where: { id } });
  }

  async findAll(params?: any): Promise<{ data: T[]; total: number }> {
    const { where, skip, take, orderBy } = params || {};
    const [data, total] = await Promise.all([
      this.model.findMany({ where, skip, take, orderBy }),
      this.model.count({ where })
    ]);
    return { data: data as T[], total };
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create({ data });
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    return await this.model.update({ where: { id }, data });
  }

  async delete(id: ID): Promise<void> {
    await this.model.delete({ where: { id } });
  }
}
