import { db } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { thirdPartyConfigService } from './ThirdPartyService.js';
import { mockDingTalkAdapter } from './MockDingTalkAdapter.js';

export interface AttendanceStatus {
  employeeId: string;
  name: string;
  projectName: string;
  hasClockedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  locationName?: string;
  hasDailyReport: boolean;
  status: 'normal' | 'missing_report' | 'absent';
}

export class AttendanceService {
  /**
   * 获取今日考勤及日报提交状态看板
   */
  async getDailyAttendanceBoard() {
    const today = dayjs().format('YYYY-MM-DD');

    // 使用 SQL 查询，方便关联项目和员工信息
    const query = `
      SELECT 
        pp.employee_id as employeeId,
        e.name as name,
        p.name as projectName,
        ar.check_in_time as checkInTime,
        ar.check_out_time as checkOutTime,
        ar.check_in_location_name as locationName,
        EXISTS(SELECT 1 FROM daily_reports dr WHERE dr.employee_id = pp.employee_id AND dr.report_date = ?) as hasDailyReport
      FROM project_personnel pp
      JOIN employees e ON pp.employee_id = e.id
      JOIN projects p ON pp.project_id = p.id
      LEFT JOIN attendance_records ar ON pp.employee_id = ar.employee_id AND ar.date = ?
      WHERE pp.on_duty_status = 'on_duty'
        AND pp.transfer_in_date <= ?
        AND (pp.transfer_out_date IS NULL OR pp.transfer_out_date >= ?)
    `;

    const rows = await db.query<any>(query, [today, today, today, today]);

    // 构建看板数据
    const board: AttendanceStatus[] = rows.map(row => {
      const hasDailyReport = row.hasDailyReport === 1 || row.hasDailyReport === true;
      const hasClockedIn = !!row.checkInTime;
      
      let status: 'normal' | 'missing_report' | 'absent' = 'absent';
      if (hasClockedIn && hasDailyReport) {
        status = 'normal';
      } else if (hasClockedIn && !hasDailyReport) {
        status = 'missing_report';
      } else {
        status = 'absent';
      }

      return {
        employeeId: row.employeeId,
        name: row.name,
        projectName: row.projectName,
        hasClockedIn,
        checkInTime: row.checkInTime ? dayjs(row.checkInTime).format('HH:mm:ss') : undefined,
        checkOutTime: row.checkOutTime ? dayjs(row.checkOutTime).format('HH:mm:ss') : undefined,
        locationName: row.locationName,
        hasDailyReport,
        status
      };
    });

    return board;
  }

  /**
   * 发送未提交日报提醒
   */
  async sendDailyReportReminders() {
    const board = await this.getDailyAttendanceBoard();
    const missing = board.filter(item => !item.hasDailyReport);

    console.log(`[Scheduler] Checking daily reports. Found ${missing.length} missing reports.`);

    for (const item of missing) {
      // 创建系统通知
      const notificationSql = `
        INSERT INTO notifications (id, user_id, title, content, type, priority, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      await db.execute(notificationSql, [
        uuidv4(),
        item.employeeId,
        '日报催报提醒',
        `您好，${item.name}。系统检测到您今日尚未在项目【${item.projectName}】提交日报，请及时填写。`,
        'in_app',
        'high',
        false
      ]).catch(err => console.error('Failed to send notification:', err));
    }

    return missing.length;
  }

  /**
   * 同步钉钉考勤数据 (当前为模拟实现)
   */
  async syncDingTalkAttendance() {
    const today = dayjs().format('YYYY-MM-DD');
    await mockDingTalkAdapter.syncEmployees();
    return await mockDingTalkAdapter.syncAttendance(today);
  }
}

export const attendanceService = new AttendanceService();
