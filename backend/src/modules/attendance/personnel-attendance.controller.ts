import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkAttendanceService } from '../dingtalk/services/dingtalk-attendance.service';

@Controller('personnel/attendance')
export class PersonnelAttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
    private readonly dingtalkAttendanceService: DingtalkAttendanceService,
  ) {}

  @Get('board')
  async getAttendanceBoard(@Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const employees = await this.prisma.sysEmployee.findMany({
      where: { status: '0' },
      select: { employeeId: true, name: true },
    });

    const todayAttendances = await this.prisma.projectAttendance.findMany({
      where: {
        workDate: new Date(targetDate),
      },
      include: {
        employee: {
          select: { name: true },
        },
        project: {
          select: { projectName: true },
        },
      },
    });

    const attendanceMap = new Map<string, any>();
    for (const att of todayAttendances) {
      const empId = att.employeeId.toString();
      if (!attendanceMap.has(empId)) {
        attendanceMap.set(empId, {
          employeeId: empId,
          name: att.employee.name,
          projectName: att.project?.projectName || '',
          hasClockedIn: true,
          checkInTime: att.checkInTime?.toISOString(),
          checkOutTime: att.checkOutTime?.toISOString(),
          locationName: att.locationName,
          status: 'normal' as const,
        });
      }
    }

    const result = employees.map(emp => {
      const empId = emp.employeeId.toString();
      if (attendanceMap.has(empId)) {
        return attendanceMap.get(empId);
      }
      return {
        employeeId: empId,
        name: emp.name,
        projectName: '',
        hasClockedIn: false,
        status: 'absent' as const,
      };
    });

    return result;
  }

  @Get('summary')
  async getAttendanceSummary(@Query('year_month') yearMonth?: string) {
    const [year, month] = yearMonth ? yearMonth.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const employees = await this.prisma.sysEmployee.findMany({
      where: { status: '0' },
      select: { employeeId: true, name: true },
    });

    const attendances = await this.prisma.projectAttendance.findMany({
      where: {
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: { name: true },
        },
        project: {
          select: { projectName: true },
        },
      },
    });

    const summaryMap = new Map<string, { employeeId: string; name: string; workedDays: number; dates: string[]; projects: string[] }>();

    for (const att of attendances) {
      const empId = att.employeeId.toString();
      if (!summaryMap.has(empId)) {
        summaryMap.set(empId, {
          employeeId: empId,
          name: att.employee.name,
          workedDays: 0,
          dates: [],
          projects: [],
        });
      }
      const record = summaryMap.get(empId)!;
      const dateStr = att.workDate.toISOString().split('T')[0];
      if (!record.dates.includes(dateStr)) {
        record.dates.push(dateStr);
        record.workedDays++;
      }
      if (att.project?.projectName && !record.projects.includes(att.project.projectName)) {
        record.projects.push(att.project.projectName);
      }
    }

    const totalDaysInMonth = endDate.getDate();
    const result = employees.map(emp => {
      const empId = emp.employeeId.toString();
      if (summaryMap.has(empId)) {
        const data = summaryMap.get(empId)!;
        return {
          ...data,
          expectedDays: totalDaysInMonth,
          absentDays: totalDaysInMonth - data.workedDays,
          attendanceRate: Math.round((data.workedDays / totalDaysInMonth) * 100),
        };
      }
      return {
        employeeId: empId,
        name: emp.name,
        workedDays: 0,
        dates: [],
        projects: [],
        expectedDays: totalDaysInMonth,
        absentDays: totalDaysInMonth,
        attendanceRate: 0,
      };
    });

    return {
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      totalDays: totalDaysInMonth,
      employees: result,
    };
  }

  @Get('calendar')
  async getAttendanceCalendar(@Query('year_month') yearMonth?: string) {
    const [year, month] = yearMonth ? yearMonth.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const employees = await this.prisma.sysEmployee.findMany({
      where: { status: '0' },
      select: { employeeId: true, name: true },
    });

    const attendances = await this.prisma.projectAttendance.findMany({
      where: {
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: { name: true },
        },
        project: {
          select: { projectName: true },
        },
      },
    });

    const calendarMap = new Map<string, Map<string, any>>();

    for (const emp of employees) {
      calendarMap.set(emp.employeeId.toString(), new Map());
    }

    for (const att of attendances) {
      const empId = att.employeeId.toString();
      if (calendarMap.has(empId)) {
        const dateStr = att.workDate.toISOString().split('T')[0];
        calendarMap.get(empId)!.set(dateStr, {
          hasClockedIn: true,
          checkInTime: att.checkInTime?.toISOString(),
          checkOutTime: att.checkOutTime?.toISOString(),
          locationName: att.locationName,
          projectName: att.project?.projectName || '',
          status: 'normal' as const,
        });
      }
    }

    const result = employees.map(emp => ({
      employeeId: emp.employeeId.toString(),
      name: emp.name,
      calendar: Object.fromEntries(calendarMap.get(emp.employeeId.toString()) || new Map()),
    }));

    return {
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      days: Array.from({ length: endDate.getDate() }, (_, i) => i + 1),
      employees: result,
    };
  }

  @Post('sync/dingtalk')
  async syncFromDingtalk() {
    try {
      console.log('[Sync] Starting DingTalk attendance sync...');
      
      // 获取所有需要同步考勤的项目及其考勤组配置
      const projectsWithConfig = await this.prisma.projectAttendanceConfig.findMany({
        where: { isEnabled: true },
        include: { project: true },
      });

      console.log('[Sync] Found projects with attendance config:', projectsWithConfig.length);
      
      if (projectsWithConfig.length === 0) {
        console.log('[Sync] No projects with attendance config found');
        return { success: false, message: '没有已配置考勤组的项目' };
      }

      let totalSynced = 0;
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 7);
      const workDateFrom = `${fromDate.getFullYear()}${String(fromDate.getMonth() + 1).padStart(2, '0')}${fromDate.getDate()}000000`;
      const workDateTo = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${today.getDate()}235959`;

      console.log('[Sync] Querying DingTalk for date range:', workDateFrom, '-', workDateTo);

      // 遍历每个配置的考勤组
      for (const config of projectsWithConfig) {
        console.log('[Sync] Processing project:', config.project?.projectName, '(ID:', config.projectId, ')', 'dingtalkGroupId:', config.dingtalkGroupId);

        // 获取该项目下的所有员工（使用钉钉用户ID）
        const members = await this.prisma.projectMember.findMany({
          where: { projectId: config.projectId },
          include: { employee: true },
        });

        console.log('[Sync] Found members:', members.length);

        const userIds: string[] = members
          .map(m => m.employee.dingtalkUserId)
          .filter((id): id is string => !!id);

        console.log('[Sync] Members with dingtalkUserId:', userIds.length, userIds);

        if (userIds.length === 0) {
          console.log('[Sync] No members with dingtalkUserId, skipping project:', config.project?.projectName);
          continue;
        }

        // 调用钉钉考勤接口
        console.log('[Sync] Calling DingTalk API for users:', userIds);
        const result = await this.dingtalkAttendanceService.getAttendanceList(
          userIds,
          workDateFrom,
          workDateTo
        );

        console.log('[Sync] DingTalk API result:', {
          success: result.success,
          dataLength: result.data?.length,
          error: result.error,
        });

        if (result.success && result.data && result.data.length > 0) {
          console.log('[Sync] Processing', result.data.length, 'records');
          
          // 按员工+日期聚合记录
          const recordMap = new Map<string, any[]>();
          for (const record of result.data) {
            const userId = record.userId || record.userId;
            const workDateStr = record.workDate || record.checkDate;
            const key = `${userId}-${workDateStr}`;
            if (!recordMap.has(key)) {
              recordMap.set(key, []);
            }
            recordMap.get(key)!.push(record);
          }
          
          console.log('[Sync] Aggregated records:', recordMap.size, 'days');
          
          // 处理每个员工每天的记录
          for (const [key, records] of recordMap) {
            const [userId, workDateStr] = key.split('-');
            const member = members.find(m => m.employee.dingtalkUserId === userId);
            if (!member) {
              console.log('[Sync] Member not found for userId:', userId);
              continue;
            }

            console.log('[Sync] Processing member:', member.employee.name, 'date:', workDateStr);

            // 区分上班和下班打卡
            let checkInTime: Date | null = null;
            let checkOutTime: Date | null = null;
            let locationName: string | null = null;
            let checkType: string | null = null;

            for (const record of records) {
              console.log('[Sync] Record details:', {
                userId: record.userId || record.userId,
                checkTime: record.userCheckTime || record.baseCheckTime || record.checkTime,
                type: record.checkType || record.timeResult,
                location: record.locationName,
              });
              
              const time = record.userCheckTime || record.baseCheckTime || record.checkTime;
              const type = record.checkType || record.timeResult;
              
              if (type === 'OnDuty' || type === '上班') {
                checkInTime = new Date(time);
              } else if (type === 'OffDuty' || type === '下班') {
                checkOutTime = new Date(time);
              } else if (!checkInTime) {
                // 默认第一个记录作为上班打卡
                checkInTime = new Date(time);
              } else if (!checkOutTime) {
                // 第二个记录作为下班打卡
                checkOutTime = new Date(time);
              }
              
              if (!locationName) {
                locationName = record.locationName || null;
              }
              if (!checkType) {
                checkType = record.checkType || record.timeResult || null;
              }
            }

            const parseWorkDate = (dateStr: string | number | undefined | null): Date | null => {
              if (!dateStr && dateStr !== 0) return null;
              if (typeof dateStr === 'number') {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return null;
                const cstOffset = 8 * 60 * 60 * 1000;
                const cstDate = new Date(d.getTime() + cstOffset);
                return new Date(cstDate.getFullYear(), cstDate.getMonth(), cstDate.getDate());
              }
              const str = String(dateStr);
              if (/^\d{13}$/.test(str)) {
                const d = new Date(parseInt(str, 10));
                if (isNaN(d.getTime())) return null;
                const cstOffset = 8 * 60 * 60 * 1000;
                const cstDate = new Date(d.getTime() + cstOffset);
                return new Date(cstDate.getFullYear(), cstDate.getMonth(), cstDate.getDate());
              }
              if (/^\d{8}$/.test(str)) {
                const y = str.substring(0, 4);
                const m = str.substring(4, 6);
                const d = str.substring(6, 8);
                return new Date(`${y}-${m}-${d}`);
              }
              const d = new Date(str);
              return isNaN(d.getTime()) ? null : d;
            };

            const workDate = parseWorkDate(workDateStr);
            if (!workDate) {
              console.log('[Sync] Invalid workDate:', workDateStr, 'skipping');
              continue;
            }

            try {
              await this.prisma.projectAttendance.upsert({
                where: {
                  projectId_employeeId_workDate: {
                    projectId: config.projectId,
                    employeeId: member.employeeId,
                    workDate,
                  },
                },
                update: {
                  checkInTime,
                  checkOutTime,
                  locationName,
                  checkType,
                },
                create: {
                  projectId: config.projectId,
                  employeeId: member.employeeId,
                  workDate,
                  checkInTime,
                  checkOutTime,
                  locationName,
                  checkType,
                  sourceType: 'dingtalk',
                  dingtalkUserId: userId,
                },
              });
              console.log('[Sync] Successfully upserted record');
            } catch (dbError) {
              console.error('[Sync] Database error:', dbError);
            }
          }
          totalSynced += recordMap.size;
          console.log('[Sync] Synced', recordMap.size, 'days for project', config.project?.projectName);
        } else {
          console.log('[Sync] No records to sync or request failed. Error:', result.error);
        }
      }

      console.log('[Sync] Total synced:', totalSynced);
      return { success: true, count: totalSynced };
    } catch (error) {
      console.error('[Sync] DingTalk sync error:', error);
      return { success: false, message: '同步失败: ' + (error instanceof Error ? error.message : String(error)) };
    }
  }

  @Post('remind')
  async remindAll() {
    return { success: true, count: 0 };
  }
}
