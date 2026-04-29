import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkAttendanceService } from '../dingtalk/services/dingtalk-attendance.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Shanghai');

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
      const now = dayjs().tz();
      const fromDate = now.subtract(7, 'day').startOf('day');
      const toDate = now.endOf('day');
      
      const workDateFrom = fromDate.format('YYYYMMDDHHmmss');
      const workDateTo = toDate.format('YYYYMMDDHHmmss');

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
            try {
              const [userId] = key.split('-');
              const member = members.find(m => m.employee.dingtalkUserId === userId);
              if (!member) continue;

              const checkInRecord = records.find(r => r.checkType === 'OnDuty');
              const checkOutRecord = records.find(r => r.checkType === 'OffDuty');
              if (checkInRecord || checkOutRecord) {
                // 使用实际打卡时间的日期作为工作日期，以匹配看板的日历视图
                // 优先使用打卡时间，如果没有则回退到钉钉的工作日期
                const actualCheckTime = checkInRecord?.userCheckTime || checkOutRecord?.userCheckTime || checkInRecord?.workDate || checkOutRecord?.workDate;
                
                // 使用北京时间确定日期组件
                const bjDate = dayjs(actualCheckTime).tz('Asia/Shanghai');
                // 存储为 YYYY-MM-DD 00:00:00 UTC，保持与数据库 Date 类型及前端查询兼容
                const workDate = new Date(Date.UTC(bjDate.year(), bjDate.month(), bjDate.date()));

                await this.prisma.projectAttendance.upsert({
                  where: {
                    projectId_employeeId_workDate: {
                      projectId: config.projectId,
                      employeeId: member.employeeId,
                      workDate: workDate,
                    },
                  },
                  update: {
                    checkInTime: checkInRecord?.userCheckTime ? new Date(checkInRecord.userCheckTime) : undefined,
                    checkOutTime: checkOutRecord?.userCheckTime ? new Date(checkOutRecord.userCheckTime) : undefined,
                    locationName: checkInRecord?.userAddress || checkInRecord?.locationTitle || checkInRecord?.locationResult || checkOutRecord?.userAddress || checkOutRecord?.locationTitle || checkOutRecord?.locationResult || 'Normal',
                  },
                  create: {
                    projectId: config.projectId,
                    employeeId: member.employeeId,
                    workDate: workDate,
                    checkInTime: checkInRecord?.userCheckTime ? new Date(checkInRecord.userCheckTime) : undefined,
                    checkOutTime: checkOutRecord?.userCheckTime ? new Date(checkOutRecord.userCheckTime) : undefined,
                    locationName: checkInRecord?.locationResult || checkOutRecord?.locationResult,
                    sourceType: 'dingtalk',
                    dingtalkUserId: userId,
                  },
                });
                totalSynced++;
              }
            } catch (recordError) {
              console.error(`[AttendanceSync] Error syncing record for key ${key}:`, recordError.message);
              // 继续处理下一个记录
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

  async getProjectAttendanceDetails(projectId: bigint, startDate?: string, endDate?: string) {
    const where: any = { projectId };

    if (startDate && endDate) {
      where.workDate = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate()
      };
    }

    const attendances = await this.prisma.projectAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { workDate: 'desc' }
    });

    return attendances.map(a => ({
      id: a.id.toString(),
      employeeName: a.employee?.name || '未知',
      workDate: a.workDate,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      locationName: a.locationName,
    }));
  }

  async getAllAttendanceDetails(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.workDate = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate()
      };
    }

    const attendances = await this.prisma.projectAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
          }
        },
        project: {
          select: {
            projectName: true,
          }
        }
      },
      orderBy: { workDate: 'desc' }
    });

    return attendances.map(a => ({
      id: a.id.toString(),
      employeeName: a.employee?.name || '未知',
      workDate: a.workDate,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      locationName: a.locationName,
      projectName: a.project?.projectName || '',
      status: 'normal'
    }));
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
