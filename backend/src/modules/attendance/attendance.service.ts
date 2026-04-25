import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkAttendanceService } from '../dingtalk/services/dingtalk-attendance.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private dingtalkAttendanceService: DingtalkAttendanceService,
  ) {}

  // 每天每小时自动同步一次钉钉考勤
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.syncAllProjectsFromDingtalk();
  }

  async syncAllProjectsFromDingtalk() {
    try {
      // 获取所有需要同步考勤的项目及其考勤组配置
      const projectsWithConfig = await this.prisma.projectAttendanceConfig.findMany({
        where: { isEnabled: true },
        include: { project: true },
      });

      if (projectsWithConfig.length === 0) {
        return { success: false, message: '没有已配置考勤组的项目' };
      }

      let totalSynced = 0;
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 7); // 同步最近7天的数据
      const workDateFrom = `${fromDate.getFullYear()}${String(fromDate.getMonth() + 1).padStart(2, '0')}${fromDate.getDate()}000000`;
      const workDateTo = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${today.getDate()}235959`;

      // 遍历每个配置的考勤组
      for (const config of projectsWithConfig) {
        // 获取该项目下的所有员工（使用钉钉用户ID）
        const members = await this.prisma.projectMember.findMany({
          where: { projectId: config.projectId },
          include: { employee: true },
        });

        const userIds: string[] = members
          .map(m => m.employee.dingtalkUserId)
          .filter((id): id is string => !!id);

        if (userIds.length === 0) continue;

        // 调用钉钉考勤接口
        const result = await this.dingtalkAttendanceService.getAttendanceList(
          userIds,
          workDateFrom,
          workDateTo
        );

        if (result.success && result.data && result.data.length > 0) {
          // 按员工+日期聚合记录
          const recordMap = new Map<string, any[]>();
          for (const record of result.data) {
            const userId = record.userId;
            const workDateStr = record.workDate || record.checkDate;
            const key = `${userId}-${workDateStr}`;
            if (!recordMap.has(key)) {
              recordMap.set(key, []);
            }
            recordMap.get(key)!.push(record);
          }
          
          // 处理每个员工每天的记录
          for (const [key, records] of recordMap) {
            const [userId] = key.split('-');
            const member = members.find(m => m.employee.dingtalkUserId === userId);
            if (!member) continue;

            const checkInRecord = records.find(r => r.checkType === 'OnDuty');
            const checkOutRecord = records.find(r => r.checkType === 'OffDuty');

            if (checkInRecord || checkOutRecord) {
              await this.prisma.projectAttendance.upsert({
                where: {
                  projectId_employeeId_workDate: {
                    projectId: config.projectId,
                    employeeId: member.employeeId,
                    workDate: new Date(checkInRecord?.workDate || checkOutRecord?.workDate),
                  },
                },
                update: {
                  checkInTime: checkInRecord?.userCheckTime ? new Date(checkInRecord.userCheckTime) : undefined,
                  checkOutTime: checkOutRecord?.userCheckTime ? new Date(checkOutRecord.userCheckTime) : undefined,
                  locationName: checkInRecord?.locationResult || checkOutRecord?.locationResult,
                },
                create: {
                  projectId: config.projectId,
                  employeeId: member.employeeId,
                  workDate: new Date(checkInRecord?.workDate || checkOutRecord?.workDate),
                  checkInTime: checkInRecord?.userCheckTime ? new Date(checkInRecord.userCheckTime) : undefined,
                  checkOutTime: checkOutRecord?.userCheckTime ? new Date(checkOutRecord.userCheckTime) : undefined,
                  locationName: checkInRecord?.locationResult || checkOutRecord?.locationResult,
                  sourceType: 'dingtalk',
                  dingtalkUserId: userId,
                },
              });
              totalSynced++;
            }
          }
        }
      }

      return { success: true, totalSynced };
    } catch (error) {
      console.error('[AttendanceSync] Error:', error);
      return { success: false, error: error.message };
    }
  }


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
