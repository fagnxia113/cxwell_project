import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';

@Injectable()
export class DingtalkDeptService {
  private readonly logger = new Logger(DingtalkDeptService.name);

  constructor(private authService: DingtalkAuthService) {}

  async createDepartment(name: string, parentDeptId?: number, nameEn?: string): Promise<{ success: boolean; deptId?: string; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/create?access_token=${token}`,
        {
          name,
          name_en: nameEn,
          parent_id: parentDeptId || 1,
        }
      );



      if (response.data.errcode === 0) {
        const deptId = response.data.result?.dept_id || response.data.dept_id;
        return { success: true, deptId: deptId?.toString() };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkDept] Failed to create department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async updateDepartment(deptId: string, name: string, nameEn?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/update?access_token=${token}`,
        {
          dept_id: deptId,
          name,
          name_en: nameEn,
        }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkDept] Failed to update department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async deleteDepartment(deptId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/delete?access_token=${token}`,
        { dept_id: deptId }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkDept] Failed to delete department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async getDepartmentList(parentDeptId?: number): Promise<{ success: boolean; list?: any[]; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/listsub?access_token=${token}`,
        { dept_id: parentDeptId || 1 }
      );

      if (response.data.errcode === 0) {
        return { success: true, list: response.data.result };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkDept] Failed to get department list:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }
}
