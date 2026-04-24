import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getProjectAttendanceConfig(projectId: bigint) {
    return this.prisma.projectAttendanceConfig.findUnique({
      where: { projectId }
    });
  }

  async updateProjectAttendanceConfig(projectId: bigint, data: {
    dingtalkGroupId?: string;
    dingtalkGroupName?: string;
    isEnabled?: boolean;
  }) {
    return this.prisma.projectAttendanceConfig.upsert({
      where: { projectId },
      update: data,
      create: {
        projectId,
        dingtalkGroupId: data.dingtalkGroupId,
        dingtalkGroupName: data.dingtalkGroupName,
        isEnabled: data.isEnabled ?? true,
      }
    });
  }

  async getProjectAttendances(projectId: bigint, startDate?: string, endDate?: string) {
    const where: any = { projectId };

    if (startDate && endDate) {
      where.workDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.workDate = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      where.workDate = {
        lte: new Date(endDate)
      };
    }

    // 先获取所有项目成员
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
            employeeNo: true,
          }
        }
      }
    });

    // 获取考勤记录
    const attendances = await this.prisma.projectAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
            employeeNo: true,
          }
        }
      },
      orderBy: { workDate: 'desc' }
    });

    // 按员工聚合打卡数据
    const employeeMap = new Map<string, { employeeId: string; employeeName: string; employeeNo: string; dates: string[]; checkedDays: number }>();

    for (const m of members) {
      employeeMap.set(m.employeeId.toString(), {
        employeeId: m.employeeId.toString(),
        employeeName: m.employee?.name || '未知',
        employeeNo: m.employee?.employeeNo || '',
        dates: [],
        checkedDays: 0,
      });
    }

    for (const a of attendances) {
      const empId = a.employeeId.toString();
      if (employeeMap.has(empId)) {
        const record = employeeMap.get(empId)!;
        const dateStr = a.workDate.toISOString().split('T')[0];
        if (!record.dates.includes(dateStr)) {
          record.dates.push(dateStr);
          record.checkedDays++;
        }
      }
    }

    // 按打卡天数降序排列，有打卡的排前面
    return Array.from(employeeMap.values()).sort((a, b) => b.checkedDays - a.checkedDays);
  }

  async getProjectManDays(projectId: bigint, yearMonth?: string) {
    let startDate: Date;
    let endDate: Date;

    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const result = await this.prisma.projectAttendance.aggregate({
      where: {
        projectId,
        workDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true,
    });

    return {
      usedManDays: result._count,
      yearMonth: yearMonth || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
    };
  }

  async getEmployeeAttendanceByDate(employeeId: bigint, workDate: string) {
    return this.prisma.projectAttendance.findFirst({
      where: {
        employeeId,
        workDate: new Date(workDate)
      }
    });
  }

  async syncAttendanceFromDingtalk(projectId: bigint, records: {
    employeeId: bigint;
    workDate: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    locationName?: string;
    checkType?: string;
    dingtalkUserId?: string;
  }[]) {
    const results: any[] = [];
    
    for (const record of records) {
      const result = await this.prisma.projectAttendance.upsert({
        where: {
          projectId_employeeId_workDate: {
            projectId,
            employeeId: record.employeeId,
            workDate: new Date(record.workDate)
          }
        },
        update: {
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          locationName: record.locationName,
          checkType: record.checkType,
        },
        create: {
          projectId,
          employeeId: record.employeeId,
          workDate: new Date(record.workDate),
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          locationName: record.locationName,
          checkType: record.checkType,
          sourceType: 'dingtalk',
          dingtalkUserId: record.dingtalkUserId,
        }
      });
      results.push(result);
    }

    return results;
  }
}
