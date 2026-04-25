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
    return this.attendanceService.syncAllProjectsFromDingtalk();
  }

  @Post('remind')
  async remindAll() {
    return { success: true, count: 0 };
  }
}
