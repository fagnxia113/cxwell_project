import { Controller, Get, Put, Delete, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @Request() req: any, 
    @Query('is_read') isRead?: string, 
    @Query('type') type?: string,
    @Query('limit') limit?: string
  ) {
    const userId = req.user.loginName;
    const options: any = {};
    if (isRead !== undefined) {
      options.isRead = isRead === 'true';
    }
    if (type) {
      options.type = type;
    }
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    const result = await this.notificationService.getNotifications(userId, options);
    return {
      success: true,
      data: result.items,
      total: result.total,
    };
  }

  @Get('unread-count')
  async unreadCount(@Request() req: any) {
    const userId = req.user.loginName;
    const count = await this.notificationService.getUnreadCount(userId);
    return {
      success: true,
      data: { count }
    };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.loginName;
    await this.notificationService.markAsRead(BigInt(id), userId);
    return { success: true };
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.loginName;
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.loginName;
    await this.notificationService.deleteNotification(BigInt(id), userId);
    return { success: true };
  }
}
