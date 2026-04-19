import { prisma } from '../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export interface ScheduleSegment {
  date: string;
  type: 'work' | 'rest' | 'home_rest';
  projectId: string | null;
  projectName?: string;
}

export interface MonthlySchedule {
  id: string;
  employeeId: string;
  employeeName?: string;
  yearMonth: string;
  segments: ScheduleSegment[];
  status: string;
  submittedAt: Date;
}

export class PersonnelRotationService {
  /**
   * 保存或更新月度计划
   */
  async saveMonthlySchedule(employeeId: string, yearMonth: string, segments: ScheduleSegment[]) {
    // 校验逻辑：1. 是否有日期重叠；2. 是否满足“一天一个项目”
    this.validateSegments(segments);

    const normalizedMonth = this.normalizeYearMonth(yearMonth);
    const existing = await prisma.personnel_rotation_plans.findUnique({
      where: {
        employee_id_year_month: {
          employee_id: employeeId,
          year_month: normalizedMonth,
        },
      },
    });

    if (existing) {
      return await prisma.personnel_rotation_plans.update({
        where: { id: existing.id },
        data: {
          schedule_data: segments as any,
          status: 'updated',
        },
      });
    } else {
      return await prisma.personnel_rotation_plans.create({
        data: {
          id: uuidv4(),
          employee_id: employeeId,
          year_month: normalizedMonth,
          schedule_data: segments as any,
          status: 'submitted',
        },
      });
    }
  }

  /**
   * 获取项目的月度出勤一览表数据
   * 包含两类人员：
   * 1. 项目成员表(project_personnel)中的在职人员
   * 2. 行程报备中关联到该项目的员工
   */
  async getProjectExpectedAttendance(projectId: string, yearMonth: string) {
    const normalizedMonth = this.normalizeYearMonth(yearMonth);
    // 1. 获取该项目下的所有人员（从项目成员表）
    const personnel = await prisma.$queryRaw<any[]>`
      SELECT pp.employee_id, e.name as employee_name
      FROM project_personnel pp
      JOIN employees e ON pp.employee_id = e.id
      WHERE pp.project_id = ${projectId}
        AND pp.on_duty_status = 'on_duty'
        AND (pp.transfer_out_date IS NULL OR DATE_FORMAT(pp.transfer_out_date, '%Y-%m') >= ${yearMonth})
    `;

    // 2. 获取行程报备中关联到该项目的所有员工
    // 先获取该月所有员工的行程数据
    const allPlans = await prisma.personnel_rotation_plans.findMany({
      where: { year_month: normalizedMonth },
    });

    // 找出schedule_data中包含该projectId的员工
    const employeeIdsFromPlans = new Set<string>();
    for (const plan of allPlans) {
      const segments = plan.schedule_data as any as ScheduleSegment[];
      if (segments && Array.isArray(segments)) {
        for (const seg of segments) {
          if (seg.projectId === projectId) {
            employeeIdsFromPlans.add(plan.employee_id);
          }
        }
      }
    }

    // 3. 合并两类人员的employee_id
    const allEmployeeIds = new Set([
      ...personnel.map(p => p.employee_id),
      ...Array.from(employeeIdsFromPlans)
    ]);

    if (allEmployeeIds.size === 0) {
      return [];
    }

    // 4. 获取这些员工的详细信息
    const employeeIds = Array.from(allEmployeeIds);
    const employees = await prisma.employees.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true }
    });

    // 5. 获取这些人员的行程计划
    const plans = await prisma.personnel_rotation_plans.findMany({
      where: {
        employee_id: { in: employeeIds },
        year_month: normalizedMonth,
      },
    });

    // 6. 汇总数据
    return employees.map(emp => {
      const plan = plans.find(pl => pl.employee_id === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        segments: plan ? (plan.schedule_data as any as ScheduleSegment[]) : [],
      };
    });
  }

  /**
   * 获取员工自己的月度报备记录
   */
  async getEmployeeSchedule(employeeId: string, yearMonth: string) {
    const normalizedMonth = this.normalizeYearMonth(yearMonth);
    return await prisma.personnel_rotation_plans.findUnique({
      where: {
        employee_id_year_month: {
          employee_id: employeeId,
          year_month: normalizedMonth,
        },
      },
    });
  }

  private normalizeYearMonth(yearMonth: string | number): string {
    return String(yearMonth).replace(/-/g, '').substring(0, 6);
  }

  /**
   * 校验行程段是否有冲突
   */
  private validateSegments(segments: ScheduleSegment[]) {
    // 检查是否有重复的日期
    const dates = segments.map(s => s.date);
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
      throw new Error('日期重复: 同一日期不能有多个行程安排');
    }
  }
}

export const personnelRotationService = new PersonnelRotationService();
