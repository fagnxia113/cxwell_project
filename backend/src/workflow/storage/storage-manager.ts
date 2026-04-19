import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageAdapter } from './storage-adapter.interface';
import { PrismaAdapter } from './prisma-adapter';

/**
 * 存储管理器
 * 用于管理不同的存储适配器
 */
@Injectable()
export class StorageManager {
  private adapter: StorageAdapter;

  constructor(private prisma: PrismaService) {
    // 默认使用 Prisma 适配器
    this.adapter = new PrismaAdapter(prisma);
  }

  /**
   * 获取存储适配器
   */
  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  /**
   * 设置存储适配器
   */
  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
  }

  /**
   * 重置为默认的 Prisma 适配器
   */
  resetToPrismaAdapter(): void {
    this.adapter = new PrismaAdapter(this.prisma);
  }
}