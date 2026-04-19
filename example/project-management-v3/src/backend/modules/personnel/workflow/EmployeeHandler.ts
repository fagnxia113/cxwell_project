import { v4 as uuidv4 } from 'uuid';
import pinyinLib from 'pinyin';
const pinyin = (pinyinLib as any).default || (pinyinLib as any).pinyin || pinyinLib;
import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { db } from '../../../database/connection.js';
import { logger } from '../../../utils/logger.js';

export class EmployeeHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { process } = context;
    const formData = process.variables?.formData || {};

    logger.debug('创建员工服务 - formData', { formData });

    try {
      const employeeName = formData.employee_name;
      const gender = formData.gender; // 'male' or 'female'
      const departmentId = formData.department_id;
      const positionId = formData.position_id;
      const hireDate = formData.start_date;
      const email = formData.email || '';
      const phone = formData.phone || '';

      if (!employeeName) {
        throw new Error('员工姓名为空，无法创建员工记录');
      }

      logger.info(`正在为员工 ${employeeName} 创建记录...`);

      const employeeNo = await this.generateEmployeeNo();
      const username = await this.generatePinyinUsername(employeeName);

      logger.debug(`生成的工号: ${employeeNo}, 用户名: ${username}`);

      let positionName = '';
      if (positionId) {
        const position = await db.queryOne<any>(
          'SELECT name FROM positions WHERE id = ?',
          [positionId]
        );
        positionName = position?.name || '';
      }

      const employeeId = uuidv4();
      const userId = uuidv4();
      const defaultPassword = '123456'; 

      const typeMap: Record<string, any> = {
        'regular': 'full_time',
        'intern': 'intern',
        'outsourced': 'contract'
      };
      const employeeType = typeMap[formData.employee_type] || 'full_time';

      await db.transaction(async (conn) => {
        // 1. 插入到 employees 表
        await conn.execute(
          `INSERT INTO employees (id, name, gender, employee_no, department_id, position, email, phone, hire_date, status, user_id, employee_type, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [employeeId, employeeName, gender || null, employeeNo, departmentId, positionName, email, phone, hireDate, 'active', userId, employeeType]
        );

        // 2. 插入到 users 表
        await conn.execute(
          `INSERT INTO users (id, username, password, name, email, role, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, username, defaultPassword, employeeName, email, 'user', 'active']
        );
      });

      logger.info(`员工记录创建成功: ${employeeName} (ID: ${employeeId}, UserID: ${userId})`);
      return { employeeId, userId, username };
    } catch (error: any) {
      logger.error('创建员工记录失败:', error);
      throw error;
    }
  }

  private async generateEmployeeNo(): Promise<string> {
    const prefix = 'EMP';
    const result = await db.queryOne<{ employee_no: string }>(
      'SELECT employee_no FROM employees ORDER BY employee_no DESC LIMIT 1'
    );
    
    let nextNo = 1;
    if (result && result.employee_no) {
      const lastNoStr = result.employee_no;
      // 匹配 E 或 EMP- 后面的数字
      const match = lastNoStr.match(/\d+$/);
      const lastNum = match ? parseInt(match[0]) : 0;
      nextNo = lastNum + 1;
    }
    
    let employeeNo = `${prefix}-${nextNo.toString().padStart(5, '0')}`;
    while (await this.isEmployeeNoExists(employeeNo)) {
      nextNo++;
      employeeNo = `${prefix}-${nextNo.toString().padStart(5, '0')}`;
    }
    return employeeNo;
  }

  private async isEmployeeNoExists(employeeNo: string): Promise<boolean> {
    const result = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM employees WHERE employee_no = ?', [employeeNo]);
    return result ? result.count > 0 : false;
  }

  private async generatePinyinUsername(name: string): Promise<string> {
    const py = pinyin(name, { style: 'normal', heteronym: false });
    let baseUsername = py.map((item: string[]) => item[0]).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseUsername) baseUsername = 'user';

    let username = baseUsername;
    let counter = 1;
    while (await this.isUsernameExists(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    return username;
  }

  private async isUsernameExists(username: string): Promise<boolean> {
    const result = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
    return result ? result.count > 0 : false;
  }
}

export const employeeHandler = new EmployeeHandler();
