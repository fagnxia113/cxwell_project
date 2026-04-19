import { db } from '../database/connection.js';
import { notificationService } from './NotificationService.js';
import { v4 as uuidv4 } from 'uuid';

export interface DailyReportStatus {
  project_id: string;
  project_name: string;
  total_members: number;
  submitted_count: number;
  unsubmitted_count: number;
  submitted_members: Array<{
     id: string;
     name: string;
     person_name: string;
     submitted_at: Date;
   }>;
  unsubmitted_members: Array<{
    id: string;
    name: string;
  }>;
}

export class DailyReportReminderService {
  private readonly REMINDER_HOUR = 18;
  private readonly REMINDER_MINUTE = 0;

  /**
   * 获取今日日报提交状态
   */
  async getTodayReportStatus(projectId?: string, date?: string): Promise<DailyReportStatus[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const statuses: DailyReportStatus[] = [];

    // 1. 获取所有进行中的项目
    let query = `SELECT id, name FROM projects WHERE status IN ('in_progress', 'delayed')`;
    const queryParams: any[] = [];
    if (projectId) {
      query += ` AND id = ?`;
      queryParams.push(projectId);
    }
    const projects = await db.query<{ id: string; name: string }>(query, queryParams);

    if (projects.length === 0) return [];

    const projectIds = projects.map(p => p.id);

    // 2. 批量获取这些项目的所有在岗人员
    const allMembers = await db.query<{ id: string; name: string; project_id: string }>(
      `SELECT e.id, e.name, pp.project_id
       FROM project_personnel pp
       JOIN employees e ON e.id = pp.employee_id
       WHERE pp.project_id IN (?) AND pp.on_duty_status = 'on_duty' AND e.status IN ('active', 'probation')`,
      [projectIds]
    );

    // 3. 批量获取今日相关人员已提交的日报
    const employeeIds = allMembers.map(m => m.id);
    const allSubmittedReports = employeeIds.length > 0
      ? await db.query<{
          employee_id: string;
          created_at: Date;
        }>(
          `SELECT employee_id, created_at
           FROM daily_reports
           WHERE employee_id IN (?) AND report_date = ?`,
          [employeeIds, targetDate]
        )
      : [];

    // 4. 按项目分组处理
    const membersByProject = new Map<string, typeof allMembers>();
    allMembers.forEach(m => {
      const list = membersByProject.get(m.project_id) || [];
      list.push(m);
      membersByProject.set(m.project_id, list);
    });

    const reportsByEmployee = new Map<string, (typeof allSubmittedReports)[0]>();
    (allSubmittedReports as any[]).forEach(r => {
      reportsByEmployee.set(r.employee_id, r);
    });

    for (const project of projects) {
      const members = membersByProject.get(project.id) || [];
      if (members.length === 0) continue;

      const submittedReportsForProject = members
        .filter(m => reportsByEmployee.has(m.id))
        .map(m => {
          const report = reportsByEmployee.get(m.id)!;
          return {
            id: m.id,
            name: m.name,
            person_name: m.name,
            submitted_at: report.created_at
          };
        });

      const submittedMembers = submittedReportsForProject;
      const submittedIds = new Set(submittedMembers.map(m => m.id));

      const unsubmittedMembers = members
        .filter(m => !submittedIds.has(m.id))
        .map(m => ({
          id: m.id,
          name: m.name
        }));

      statuses.push({
        project_id: project.id,
        project_name: project.name,
        total_members: members.length,
        submitted_count: submittedMembers.length,
        unsubmitted_count: unsubmittedMembers.length,
        submitted_members: submittedMembers,
        unsubmitted_members: unsubmittedMembers
      });
    }

    return statuses;
  }

  /**
   * 发送日报提交提醒
   */
  async sendDailyReportReminder(projectId?: string, personId?: string): Promise<{
    total_reminded: number;
    projects: Array<{
      project_id: string;
      project_name: string;
      reminded_count: number;
    }>;
  }> {
    if (personId) {
      // 针对特定人员发送提醒
      const person = await db.queryOne<{ name: string }>(
        'SELECT name FROM employees WHERE id = ?',
        [personId]
      );
      if (person) {
        await notificationService.sendNotification({
          user_id: personId,
          user_name: person.name,
          type: 'in_app',
          title: '【日报提醒】今日日报尚未提交',
          content: `您的今日日报尚未提交，请尽快完成提交。`,
          priority: 'high',
          link: '/reports'
        });
        return {
          total_reminded: 1,
          projects: []
        };
      }
    }

    const statuses = await this.getTodayReportStatus(projectId);
    let totalReminded = 0;
    const projectResults: Array<{
      project_id: string;
      project_name: string;
      reminded_count: number;
    }> = [];

    // 获取所有项目经理信息，避免循环查询
    const projectIds = statuses.map(s => s.project_id);
    const projectManagers = projectIds.length > 0 
      ? await db.query<{ id: string; manager_id: string; manager_name: string }>(
          'SELECT id, manager_id, manager FROM projects WHERE id IN (?)',
          [projectIds]
        )
      : [];
    const managerMap = new Map(projectManagers.map(m => [m.id, { id: m.manager_id, name: m.manager_name }]));

    for (const status of statuses) {
      if (status.unsubmitted_members.length === 0) continue;

      // 发送通知给未提交的人员
      for (const member of status.unsubmitted_members) {
        await notificationService.sendNotification({
          user_id: member.id,
          user_name: member.name,
          type: 'in_app',
          title: '【日报提醒】今日日报尚未提交',
          content: `您在项目「${status.project_name}」的今日日报尚未提交，请尽快完成提交。`,
          priority: 'high',
          link: '/reports'
        });

        totalReminded++;
      }

      // 同时通知项目经理
      const manager = managerMap.get(status.project_id);
      if (manager?.id) {
        const unsubmittedNames = status.unsubmitted_members.map(m => m.name).join('、');
        
        await notificationService.sendNotification({
          user_id: manager.id,
          user_name: manager.name || '项目经理',
          type: 'in_app',
          title: `【日报统计】${status.project_name} - ${status.unsubmitted_count}人未提交`,
          content: `今日日报提交情况：\n已提交：${status.submitted_count}/${status.total_members}人\n未提交：${unsubmittedNames}`,
          priority: 'normal',
          link: '/reports/dashboard'
        });
      }

      projectResults.push({
        project_id: status.project_id,
        project_name: status.project_name,
        reminded_count: status.unsubmitted_members.length
      });
    }

    return {
      total_reminded: totalReminded,
      projects: projectResults
    };
  }

  /**
   * 检查是否到提醒时间
   */
  shouldSendReminder(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    return hour === this.REMINDER_HOUR && minute === this.REMINDER_MINUTE;
  }

  /**
   * 获取日报提交统计（用于大屏展示）
   */
  async getReportStatistics(date?: string): Promise<{
    date: string;
    total_projects: number;
    total_members: number;
    total_submitted: number;
    total_unsubmitted: number;
    submission_rate: number;
    projects: DailyReportStatus[];
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const statuses = await this.getTodayReportStatus(undefined, targetDate);

    const totalMembers = statuses.reduce((sum, s) => sum + s.total_members, 0);
    const totalSubmitted = statuses.reduce((sum, s) => sum + s.submitted_count, 0);
    const totalUnsubmitted = statuses.reduce((sum, s) => sum + s.unsubmitted_count, 0);

    return {
      date: targetDate,
      total_projects: statuses.length,
      total_members: totalMembers,
      total_submitted: totalSubmitted,
      total_unsubmitted: totalUnsubmitted,
      submission_rate: totalMembers > 0 ? Math.round((totalSubmitted / totalMembers) * 100) : 0,
      projects: statuses
    };
  }

  /**
   * 一键提醒所有未提交人员
   */
  async remindAllUnsubmitted(): Promise<{
    success: boolean;
    reminded_count: number;
    message: string;
  }> {
    const result = await this.sendDailyReportReminder();

    return {
      success: true,
      reminded_count: result.total_reminded,
      message: `已向 ${result.total_reminded} 人发送日报提交提醒`
    };
  }

  /**
   * 获取历史日报提交率
   */
  async getHistoricalSubmissionRate(days: number = 7): Promise<Array<{
    date: string;
    submission_rate: number;
    total_members: number;
    submitted_count: number;
  }>> {
    const results: Array<{
      date: string;
      submission_rate: number;
      total_members: number;
      submitted_count: number;
    }> = [];

    // 计算日期范围
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    // 1. 批量获取期间每天的在岗人数 (按日期分组)
    // 注意：这里简化处理，假设 transfer_in_date 决定了其是否在岗
    const membersByDate = await db.query<{ date_str: string; count: number }>(
      `SELECT d.date_str, COUNT(DISTINCT pp.employee_id) as count
       FROM (
         SELECT DATE(DATE_ADD(?, INTERVAL n.n DAY)) as date_str
         FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n
         WHERE DATE_ADD(?, INTERVAL n.n DAY) <= CURRENT_DATE
       ) d
       LEFT JOIN project_personnel pp ON pp.transfer_in_date <= d.date_str
       JOIN employees e ON e.id = pp.employee_id
       WHERE e.status IN ('active', 'probation') AND pp.on_duty_status = 'on_duty'
       GROUP BY d.date_str
       ORDER BY d.date_str`,
      [startDateStr, startDateStr]
    );

    // 2. 批量获取期间每天的日报提交数
    const submittedByDate = await db.query<{ date_str: string; count: number }>(
      `SELECT report_date as date_str, COUNT(DISTINCT employee_id) as count
       FROM daily_reports
       WHERE report_date >= ?
       GROUP BY report_date`,
      [startDateStr]
    );

    const membersMap = new Map(membersByDate.map(m => [m.date_str, m.count]));
    const submittedMap = new Map(submittedByDate.map(s => [s.date_str, s.count]));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const totalMembers = membersMap.get(dateStr) || 0;
      const submittedCount = submittedMap.get(dateStr) || 0;

      results.push({
        date: dateStr,
        submission_rate: totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0,
        total_members: totalMembers,
        submitted_count: submittedCount
      });
    }

    return results;
  }
}

export const dailyReportReminderService = new DailyReportReminderService();
