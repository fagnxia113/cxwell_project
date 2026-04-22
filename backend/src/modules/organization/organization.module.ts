import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController, PersonnelController, AttendanceController } from './organization.controller';
import { DingtalkModule } from '../dingtalk/dingtalk.module';

@Module({
  imports: [DingtalkModule],
  providers: [OrganizationService],
  controllers: [OrganizationController, PersonnelController, AttendanceController]
})
export class OrganizationModule {}
