import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async getNotifications() {
    // 基础 Mock 数据，后续可接入数据库
    return [];
  }

  async getUnreadCount() {
    return 0;
  }
}
