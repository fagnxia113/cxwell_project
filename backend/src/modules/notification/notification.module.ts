import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { DingtalkModule } from '../dingtalk/dingtalk.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DingtalkModule, ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
