import { Module, Global } from '@nestjs/common';
import { DingtalkAuthService } from './services/dingtalk-auth.service';
import { DingtalkUserService } from './services/dingtalk-user.service';
import { DingtalkDeptService } from './services/dingtalk-dept.service';
import { DingtalkMessageService } from './services/dingtalk-message.service';
import { DingtalkAttendanceService } from './services/dingtalk-attendance.service';
import { DingtalkTodoService } from './services/dingtalk-todo.service';
import { DingtalkService } from './dingtalk.service';
import { DingtalkController } from './dingtalk.controller';

@Global()
@Module({
  controllers: [DingtalkController],
  providers: [
    DingtalkAuthService,
    DingtalkUserService,
    DingtalkDeptService,
    DingtalkMessageService,
    DingtalkAttendanceService,
    DingtalkTodoService,
    DingtalkService,
  ],
  exports: [
    DingtalkAuthService,
    DingtalkUserService,
    DingtalkDeptService,
    DingtalkMessageService,
    DingtalkAttendanceService,
    DingtalkTodoService,
    DingtalkService,
  ],
})
export class DingtalkModule {}
