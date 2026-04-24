import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PersonnelAttendanceController } from './personnel-attendance.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkModule } from '../dingtalk/dingtalk.module';

@Module({
  imports: [DingtalkModule],
  controllers: [AttendanceController, PersonnelAttendanceController],
  providers: [AttendanceService, PrismaService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
