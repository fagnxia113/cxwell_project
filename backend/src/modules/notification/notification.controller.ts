import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list() {
    const data = await this.notificationService.getNotifications();
    return {
      success: true,
      data
    };
  }

  @Get('unread-count')
  async unreadCount() {
    const count = await this.notificationService.getUnreadCount();
    return {
      success: true,
      data: count
    };
  }
}
