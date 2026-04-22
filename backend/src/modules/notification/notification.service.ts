import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, options: { isRead?: boolean; type?: string; limit?: number; offset?: number } = {}) {
    const { isRead, type, limit = 20, offset = 0 } = options;
    
    const where: any = {
      userId,
      delFlag: '0',
    };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (type) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.sysNotification.findMany({
        where,
        orderBy: { createTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.sysNotification.count({ where }),
    ]);

    return { items, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.sysNotification.count({
      where: { userId, isRead: false, delFlag: '0' }
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    content?: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    relatedId?: string;
  }) {
    const notification = await this.prisma.sysNotification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content || null,
        type: data.type || 'workflow',
        priority: data.priority || 'normal',
        actionUrl: data.actionUrl || null,
        relatedId: data.relatedId || null,
      }
    });
    this.logger.log(`Notification created for user ${data.userId}: ${data.title}`);
    return notification;
  }

  async markAsRead(id: bigint, userId: string) {
    await this.prisma.sysNotification.updateMany({
      where: { id, userId, delFlag: '0' },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.sysNotification.updateMany({
      where: { userId, isRead: false, delFlag: '0' },
      data: { isRead: true }
    });
  }

  async deleteNotification(id: bigint, userId: string) {
    await this.prisma.sysNotification.updateMany({
      where: { id, userId, delFlag: '0' },
      data: { delFlag: '1' }
    });
  }

  async batchCreateNotifications(userIds: string[], data: {
    title: string;
    content?: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    relatedId?: string;
  }) {
    const now = new Date();
    const records = userIds.map(userId => ({
      userId,
      title: data.title,
      content: data.content || null,
      type: data.type || 'workflow',
      priority: data.priority || 'normal',
      actionUrl: data.actionUrl || null,
      relatedId: data.relatedId || null,
      createTime: now,
      updateTime: now,
      delFlag: '0',
      isRead: false,
    }));

    await this.prisma.sysNotification.createMany({ data: records });
    this.logger.log(`Batch created ${userIds.length} notifications: ${data.title}`);
  }
}
