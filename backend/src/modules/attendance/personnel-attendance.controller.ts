import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkAttendanceService } from '../dingtalk/services/dingtalk-attendance.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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

    const bjDate = dayjs.tz(targetDate, 'Asia/Shanghai');
    const utcDate = new Date(Date.UTC(bjDate.year(), bjDate.month(), bjDate.date()));

    const todayAttendances = await this.prisma.projectAttendance.findMany({
      where: {
        workDate: utcDate,
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

    return { success: true, data: result };
  }

  @Get('summary')
  async getAttendanceSummary(@Query('year_month') yearMonth?: string) {
    const bjStart = dayjs.tz(yearMonth ? `${yearMonth}-01` : undefined, 'Asia/Shanghai').startOf('month');
    const bjEnd = bjStart.endOf('month');

    const startDate = new Date(Date.UTC(bjStart.year(), bjStart.month(), bjStart.date()));
    const endDate = new Date(Date.UTC(bjEnd.year(), bjEnd.month(), bjEnd.date()));

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

    console.log(`[AttendanceSummary] Found ${attendances.length} records for ${yearMonth}`);

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

    console.log(`[AttendanceSummary] Returning ${result.length} employees`);
    return {
      success: true,
      data: {
        yearMonth: `${bjStart.year()}-${String(bjStart.month() + 1).padStart(2, '0')}`,
        totalDays: totalDaysInMonth,
        employees: result,
      },
    };
  }

  @Get('calendar')
  async getAttendanceCalendar(@Query('year_month') yearMonth?: string) {
    const bjStart = dayjs.tz(yearMonth ? `${yearMonth}-01` : undefined, 'Asia/Shanghai').startOf('month');
    const bjEnd = bjStart.endOf('month');

    const startDate = new Date(Date.UTC(bjStart.year(), bjStart.month(), bjStart.date()));
    const endDate = new Date(Date.UTC(bjEnd.year(), bjEnd.month(), bjEnd.date()));

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
      success: true,
      data: {
        yearMonth: `${bjStart.year()}-${String(bjStart.month() + 1).padStart(2, '0')}`,
        days: Array.from({ length: endDate.getDate() }, (_, i) => i + 1),
        employees: result,
      },
    };
  }

  @Get('records')
  async getAttendanceRecords(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const records = await this.attendanceService.getAllAttendanceDetails(startDate, endDate);
    return { success: true, data: records };
  }

  @Post('sync/dingtalk')
  async syncFromDingtalk() {
    return this.attendanceService.syncAllProjectsFromDingtalk();
  }

  @Post('remind')
  async remindAll() {
    return { success: true, count: 0 };
  }
}
