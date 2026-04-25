import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DingtalkMessageService } from '../dingtalk/services/dingtalk-message.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Optional() private dingtalkMessageService?: DingtalkMessageService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
  }

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
    
    // 异步同步到钉钉
    this.syncToDingtalk([data.userId], data).catch(err => {
      this.logger.error(`Failed to sync single notification to DingTalk: ${err.message}`);
    });

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

    // 异步同步到钉钉
    this.syncToDingtalk(userIds, data).catch(err => {
      this.logger.error(`Failed to sync batch notifications to DingTalk: ${err.message}`);
    });
  }

  private async syncToDingtalk(loginNames: string[], data: { title: string; content?: string; actionUrl?: string }) {
    if (!this.dingtalkMessageService || !loginNames.length) return;

    // 获取这些用户的钉钉 ID
    const employees = await this.prisma.sysEmployee.findMany({
      where: {
        user: {
          loginName: { in: loginNames }
        },
        dingtalkUserId: { not: null }
      },
      select: {
        dingtalkUserId: true,
        user: { select: { loginName: true } }
      }
    });

    if (!employees.length) return;

    const fullUrl = data.actionUrl 
      ? (data.actionUrl.startsWith('http') ? data.actionUrl : `${this.frontendUrl}${data.actionUrl}`)
      : this.frontendUrl;

    for (const emp of employees) {
      if (emp.dingtalkUserId) {
        await this.dingtalkMessageService.sendOaNotification(emp.dingtalkUserId, {
          title: data.title,
          text: data.content || data.title,
          messageUrl: fullUrl,
        });
      }
    }
  }
}
