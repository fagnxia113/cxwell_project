import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('project/:projectId/config')
  async getConfig(@Param('projectId') projectId: string) {
    const data = await this.attendanceService.getProjectAttendanceConfig(BigInt(projectId));
    return { success: true, data };
  }

  @Put('project/:projectId/config')
  async updateConfig(@Param('projectId') projectId: string, @Body() body: any) {
    const data = await this.attendanceService.updateProjectAttendanceConfig(BigInt(projectId), {
      dingtalkGroupId: body.dingtalk_group_id,
      dingtalkGroupName: body.dingtalk_group_name,
      isEnabled: body.is_enabled,
    });
    return { success: true, data };
  }

  @Get('project/:projectId/records')
  async getRecords(
    @Param('projectId') projectId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const data = await this.attendanceService.getProjectAttendances(
      BigInt(projectId),
      startDate,
      endDate
    );
    return { success: true, data };
  }

  @Get('project/:projectId/man-days')
  async getManDays(
    @Param('projectId') projectId: string,
    @Query('year_month') yearMonth?: string,
  ) {
    const data = await this.attendanceService.getProjectManDays(
      BigInt(projectId),
      yearMonth
    );
    return { success: true, data };
  }

  @Post('project/:projectId/sync')
  async syncAttendance(@Param('projectId') projectId: string, @Body() body: any) {
    const records = (body.records || []).map((r: any) => ({
      employeeId: BigInt(r.employee_id),
      workDate: r.work_date,
      checkInTime: r.check_in_time ? new Date(r.check_in_time) : undefined,
      checkOutTime: r.check_out_time ? new Date(r.check_out_time) : undefined,
      locationName: r.location_name,
      checkType: r.check_type,
      dingtalkUserId: r.dingtalk_user_id,
    }));
    
    const data = await this.attendanceService.syncAttendanceFromDingtalk(BigInt(projectId), records);
    return { success: true, count: data.length };
  }
}
