import { 
  SyncResult, 
  ThirdPartyDepartment, 
  ThirdPartyEmployee 
} from '../types/organization.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export class MockDingTalkAdapter {
  constructor() {}

  async syncEmployees(): Promise<SyncResult> {
    console.log('[MockDingTalk] Syncing employees...');
    return {
      success: true,
      message: '模拟钉钉人员同步成功',
      total_count: 0,
      success_count: 0,
      failed_count: 0,
      created_count: 0,
      updated_count: 0
    };
  }

  async syncAttendance(date: string): Promise<SyncResult> {
    console.log(`[MockDingTalk] Syncing attendance for date: ${date}`);
    const { db } = await import('../database/connection.js');

    // 获取所有需要同步的员工（在 project_personnel 中且在岗的）
    const employees = await db.query<any>(`
      SELECT e.id, e.name, e.third_party_id 
      FROM employees e
      JOIN project_personnel pp ON e.id = pp.employee_id
      WHERE pp.on_duty_status = 'on_duty'
    `);

    const result: SyncResult = {
      success: true,
      message: '模拟钉钉考勤同步成功',
      total_count: employees.length,
      success_count: 0,
      failed_count: 0,
      created_count: 0,
      updated_count: 0,
      errors: []
    };

    const checkInBaseTime = '09:00:00';
    const checkOutBaseTime = '18:00:00';

    for (const employee of employees) {
      try {
        const checkDate = date;
        
        // 随机生成打卡时间（正负 30 分钟内）
        const randomOffsetIn = Math.floor(Math.random() * 60) - 30;
        const randomOffsetOut = Math.floor(Math.random() * 60) - 30;
        
        const checkInTime = dayjs(`${date} ${checkInBaseTime}`).add(randomOffsetIn, 'minute').format('YYYY-MM-DD HH:mm:ss');
        const checkOutTime = dayjs(`${date} ${checkOutBaseTime}`).add(randomOffsetOut, 'minute').format('YYYY-MM-DD HH:mm:ss');
        
        const existingRecord = await db.queryOne<any>(
          'SELECT id FROM attendance_records WHERE employee_id = ? AND date = ?',
          [employee.id, checkDate]
        );

        if (existingRecord) {
          await db.execute(
            `UPDATE attendance_records SET 
              check_in_time = ?, check_out_time = ?, 
              check_in_status = 'normal', check_out_status = 'normal',
              source = 'dingtalk', location_name = '模拟办公区'
            WHERE id = ?`,
            [checkInTime, checkOutTime, existingRecord.id]
          );
          result.updated_count++;
        } else {
          await db.execute(
            `INSERT INTO attendance_records (
              id, employee_id, date, check_in_time, check_out_time, 
              check_in_status, check_out_status, source, location_name, work_status
            ) VALUES (?, ?, ?, ?, ?, 'normal', 'normal', 'dingtalk', '模拟办公区', 'on_duty')`,
            [uuidv4(), employee.id, checkDate, checkInTime, checkOutTime]
          );
          result.created_count++;
        }
        result.success_count++;
      } catch (error: any) {
        result.failed_count++;
        result.errors?.push({ id: employee.id, name: employee.name, error: error.message });
      }
    }

    return result;
  }
}

export const mockDingTalkAdapter = new MockDingTalkAdapter();
