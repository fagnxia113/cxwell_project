import {
  ThirdPartyConfig,
  SyncResult,
  ThirdPartyDepartment,
  ThirdPartyEmployee,
  PlatformType
} from '../types/organization.js';
import { BaseThirdPartyAdapter, thirdPartyConfigService, syncLogService } from './ThirdPartyService.js';
import { departmentServiceV2 as departmentService } from './DepartmentServiceV2.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

interface WeChatWorkTokenResponse {
  errcode: number;
  errmsg: string;
  access_token: string;
  expires_in: number;
}

interface WeChatWorkDepartment {
  id: number;
  name: string;
  parentid: number;
  order: number;
}

interface WeChatWorkUser {
  userid: string;
  name: string;
  department: number[];
  position: string;
  mobile: string;
  email: string;
  avatar: string;
  status: number;
}

interface WeChatWorkCheckinData {
  userid: string;
  groupname: string;
  checkin_type: string;
  exception_type: string;
  checkin_time: number;
  location_title: string;
  location_detail: string;
  wifiname: string;
  notes: string;
  wifimac: string;
  mediaids?: string[];
  lat: number;
  lng: number;
  deviceid: string;
}

export class WeChatWorkAdapter extends BaseThirdPartyAdapter {
  private baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin';

  constructor(config: ThirdPartyConfig) {
    super(config);
  }

  async getAccessToken(): Promise<string> {
    if (this.config.access_token && this.config.token_expire_time) {
      const expireTime = new Date(this.config.token_expire_time);
      if (expireTime > new Date(Date.now() + 5 * 60 * 1000)) {
        return this.config.access_token;
      }
    }

    const response = await fetch(
      `${this.baseUrl}/gettoken?corpid=${this.config.corp_id}&corpsecret=${this.config.app_secret}`
    );

    const data: WeChatWorkTokenResponse = await response.json();

    if (data.errcode !== 0) {
      throw new Error(`获取企业微信access_token失败: ${data.errmsg}`);
    }

    const expireTime = new Date(Date.now() + data.expires_in * 1000);
    await thirdPartyConfigService.updateAccessToken(this.config.id, data.access_token, expireTime);

    // 更新内存中的配置
    this.config.access_token = data.access_token;
    this.config.token_expire_time = expireTime;

    return data.access_token;
  }

  async getDepartments(): Promise<ThirdPartyDepartment[]> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/department/list?access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.errcode !== 0) {
      throw new Error(`获取企业微信部门列表失败: ${data.errmsg}`);
    }

    return data.department.map((dept: WeChatWorkDepartment) => ({
      id: String(dept.id),
      name: dept.name,
      parent_id: dept.parentid ? String(dept.parentid) : undefined,
      order: dept.order
    }));
  }

  async getEmployees(departmentId?: string): Promise<ThirdPartyEmployee[]> {
    const accessToken = await this.getAccessToken();

    let url = `${this.baseUrl}/user/list?access_token=${accessToken}`;
    if (departmentId) {
      url = `${this.baseUrl}/user/list?access_token=${accessToken}&department_id=${departmentId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode !== 0) {
      throw new Error(`获取企业微信员工列表失败: ${data.errmsg}`);
    }

    return data.userlist.map((user: WeChatWorkUser) => ({
      id: user.userid,
      name: user.name,
      department_ids: user.department.map(String),
      position: user.position,
      mobile: user.mobile,
      email: user.email,
      avatar: user.avatar,
      status: user.status
    }));
  }

  async syncDepartments(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: '同步成功',
      total_count: 0,
      success_count: 0,
      failed_count: 0,
      created_count: 0,
      updated_count: 0,
      errors: []
    };

    try {
      const wechatDepartments = await this.getDepartments();
      result.total_count = wechatDepartments.length;

      const idMapping: Record<string, string> = {};

      const sortedDepts = [...wechatDepartments].sort((a, b) => {
        if (!a.parent_id) return -1;
        if (!b.parent_id) return 1;
        return 0;
      });

      for (const wechatDept of sortedDepts) {
        try {
          const existingDept = await this.findDepartmentByThirdPartyId(wechatDept.id);

          if (existingDept) {
            await departmentService.updateDepartment(existingDept.id, {
              name: wechatDept.name,
              sort_order: wechatDept.order || 0
            });
            idMapping[wechatDept.id] = existingDept.id;
            result.updated_count++;
          } else {
            const newDept = await departmentService.createDepartment({
              name: wechatDept.name,
              parent_id: wechatDept.parent_id ? idMapping[wechatDept.parent_id] : undefined,
              sort_order: wechatDept.order || 0
            });

            await this.updateDepartmentThirdPartyId(newDept.id, wechatDept.id, 'wechat_work');
            idMapping[wechatDept.id] = newDept.id;
            result.created_count++;
          }

          result.success_count++;
        } catch (error: any) {
          result.failed_count++;
          result.errors?.push({
            id: wechatDept.id,
            name: wechatDept.name,
            error: error.message
          });
        }
      }

      if (result.failed_count > 0) {
        result.success = false;
        result.message = `同步完成，成功 ${result.success_count} 条，失败 ${result.failed_count} 条`;
      }
    } catch (error: any) {
      result.success = false;
      result.message = error.message;
    }

    return result;
  }

  private async findDepartmentByThirdPartyId(thirdPartyId: string): Promise<any> {
    const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.SERVER_PORT || '8080'}`
    const result = await fetch(
      `${apiBaseUrl}/api/organization/departments?include_inactive=true`
    );
    const data = await result.json();

    if (data.success && Array.isArray(data.data)) {
      return data.data.find((dept: any) =>
        dept.third_party_id === thirdPartyId &&
        dept.third_party_source === 'wechat_work'
      );
    }
    return null;
  }

  private async updateDepartmentThirdPartyId(
    departmentId: string,
    thirdPartyId: string,
    source: PlatformType
  ): Promise<void> {
    const { db } = await import('../database/connection.js');
    await db.execute(
      'UPDATE departments SET third_party_id = ?, third_party_source = ? WHERE id = ?',
      [thirdPartyId, source, departmentId]
    );
  }

  async syncEmployees(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: '同步成功',
      total_count: 0,
      success_count: 0,
      failed_count: 0,
      created_count: 0,
      updated_count: 0,
      errors: []
    };

    try {
      const wechatEmployees = await this.getEmployees();
      result.total_count = wechatEmployees.length;

      const { db } = await import('../database/connection.js');

      for (const weEmployee of wechatEmployees) {
        try {
          // 查找现有员工：先按第三方ID，再按手机号/邮箱
          let existingEmployee = await this.findEmployeeByThirdPartyId(weEmployee.id);
          
          if (!existingEmployee && weEmployee.mobile) {
            existingEmployee = await this.findEmployeeByPhone(weEmployee.mobile);
          }

          if (existingEmployee) {
            // 更新员工信息
            await db.execute(
              `UPDATE employees SET 
                name = ?, position = ?, email = ?, 
                third_party_id = ?, third_party_source = ? 
               WHERE id = ?`,
              [
                weEmployee.name, weEmployee.position || '', weEmployee.email || '',
                weEmployee.id, 'wechat_work', existingEmployee.id
              ]
            );
            result.updated_count++;
          } else {
            // 创建新员工
            const id = uuidv4();
            await db.execute(
              `INSERT INTO employees (
                id, name, phone, email, position, 
                third_party_id, third_party_source, status, hire_date
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id, weEmployee.name, weEmployee.mobile || '', weEmployee.email || '',
                weEmployee.position || '', weEmployee.id, 'wechat_work', 
                weEmployee.status === 1 ? 'active' : 'resigned',
                new Date().toISOString().split('T')[0]
              ]
            );
            result.created_count++;
          }
          result.success_count++;
        } catch (error: any) {
          result.failed_count++;
          result.errors?.push({
            id: weEmployee.id,
            name: weEmployee.name,
            error: error.message
          });
        }
      }
    } catch (error: any) {
      result.success = false;
      result.message = error.message;
    }

    return result;
  }

  private async findEmployeeByThirdPartyId(thirdPartyId: string): Promise<any> {
    const { db } = await import('../database/connection.js');
    return db.queryOne(
      'SELECT id FROM employees WHERE third_party_id = ? AND third_party_source = ?',
      [thirdPartyId, 'wechat_work']
    );
  }

  private async findEmployeeByPhone(phone: string): Promise<any> {
    const { db } = await import('../database/connection.js');
    return db.queryOne('SELECT id FROM employees WHERE phone = ?', [phone]);
  }

  /**
   * 获取企业微信打卡数据
   */
  async getCheckinData(startTime: number, endTime: number, useridlist: string[]): Promise<WeChatWorkCheckinData[]> {
    const accessToken = await this.getAccessToken();
    
    // 如果没有专门的打卡 Secret，尝试使用主 App Secret (通常打卡需要单独的应用权限)
    // 优先从 config 中读取 checkin_secret
    const checkinSecret = this.config.config?.checkin_secret;
    let currentToken = accessToken;

    if (checkinSecret) {
      const response = await fetch(
        `${this.baseUrl}/gettoken?corpid=${this.config.corp_id}&corpsecret=${checkinSecret}`
      );
      const data: WeChatWorkTokenResponse = await response.json();
      if (data.errcode === 0) {
        currentToken = data.access_token;
      }
    }

    const response = await fetch(
      `${this.baseUrl}/checkin/getcheckindata?access_token=${currentToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opencheckindatatype: 3, // 全部打卡数据
          starttime: startTime,
          endtime: endTime,
          useridlist: useridlist
        })
      }
    );

    const data = await response.json();
    if (data.errcode !== 0) {
      throw new Error(`获取打卡数据失败: ${data.errmsg}`);
    }

    return data.checkindata;
  }

  /**
   * 同步打卡数据到本地
   */
  async syncAttendance(date: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: '同步成功',
      total_count: 0,
      success_count: 0,
      failed_count: 0,
      created_count: 0,
      updated_count: 0,
      errors: []
    };

    try {
      const { db } = await import('../database/connection.js');
      const startTime = dayjs(date).startOf('day').unix();
      const endTime = dayjs(date).endOf('day').unix();

      // 获取所有绑定了企微ID的员工
      const employees = await db.query<any>(
        'SELECT id, third_party_id FROM employees WHERE third_party_id IS NOT NULL AND third_party_source = ?',
        ['wechat_work']
      );

      if (employees.length === 0) {
        return { ...result, message: '没有已绑定的员工，无需同步' };
      }

      const useridlist = employees.map(e => e.third_party_id);
      const checkinData = await this.getCheckinData(startTime, endTime, useridlist);
      
      result.total_count = checkinData.length;

      // 按员工ID和打卡记录ID去重并保存
      for (const data of checkinData) {
        try {
          const employee = employees.find(e => e.third_party_id === data.userid);
          if (!employee) continue;

          // 企业微信一条打卡记录可能包含多个状态
          // 逻辑：如果是上班打卡，更新 check_in；如果是下班打卡，更新 check_out
          const checkTime = dayjs.unix(data.checkin_time).format('YYYY-MM-DD HH:mm:ss');
          const checkDate = dayjs.unix(data.checkin_time).format('YYYY-MM-DD');
          
          // 这里的 unique key 可以是 (employee_id, date, third_party_id)
          // 但由于本地表结构是 (employee_id, date)，我们可能需要按日期聚合
          
          const recordId = uuidv4();
          const thirdPartyRecordId = `${data.userid}_${data.checkin_time}`;

          // 简化的逻辑：如果当天没有记录，插入；如果有，根据类型更新
          const existingRecord = await db.queryOne<any>(
            'SELECT id FROM attendance_records WHERE employee_id = ? AND date = ?',
            [employee.id, checkDate]
          );

          if (data.checkin_type === '上班打卡') {
            if (existingRecord) {
              await db.execute(
                `UPDATE attendance_records SET 
                  check_in_time = ?, check_in_location_name = ?, check_in_status = ?,
                  source = ?, third_party_id = ?, location_name = ?
                WHERE id = ?`,
                [
                  checkTime, data.location_title, 
                  data.exception_type === '正常' ? 'normal' : 'late',
                  'wechat_work', thirdPartyRecordId, data.location_title,
                  existingRecord.id
                ]
              );
            } else {
              await db.execute(
                `INSERT INTO attendance_records (
                  id, employee_id, date, check_in_time, check_in_location_name, 
                  check_in_status, source, third_party_id, location_name, work_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'on_duty')`,
                [
                  recordId, employee.id, checkDate, checkTime, data.location_title,
                  data.exception_type === '正常' ? 'normal' : 'late',
                  'wechat_work', thirdPartyRecordId, data.location_title
                ]
              );
            }
            result.updated_count++;
          } else if (data.checkin_type === '下班打卡') {
            if (existingRecord) {
              await db.execute(
                `UPDATE attendance_records SET 
                  check_out_time = ?, check_out_location_name = ?, check_out_status = ?,
                  source = ?, third_party_id = ?, location_name = ?
                WHERE id = ?`,
                [
                  checkTime, data.location_title, 
                  data.exception_type === '正常' ? 'normal' : 'early_leave',
                  'wechat_work', thirdPartyRecordId, data.location_title,
                  existingRecord.id
                ]
              );
            } else {
              await db.execute(
                `INSERT INTO attendance_records (
                  id, employee_id, date, check_out_time, check_out_location_name, 
                  check_out_status, source, third_party_id, location_name, work_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'on_duty')`,
                [
                  recordId, employee.id, checkDate, checkTime, data.location_title,
                  data.exception_type === '正常' ? 'normal' : 'early_leave',
                  'wechat_work', thirdPartyRecordId, data.location_title
                ]
              );
            }
            result.updated_count++;
          }
          result.success_count++;
        } catch (error: any) {
          result.failed_count++;
        }
      }

    } catch (error: any) {
      result.success = false;
      result.message = error.message;
    }
    return result;
  }
}

export function createWeChatWorkAdapter(config: ThirdPartyConfig): WeChatWorkAdapter {
  return new WeChatWorkAdapter(config);
}
