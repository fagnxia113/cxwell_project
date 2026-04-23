import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';

@Injectable()
export class DingtalkUserService {
  private readonly logger = new Logger(DingtalkUserService.name);

  constructor(private authService: DingtalkAuthService) {}

  async createUser(userData: {
    name: string;
    mobile: string;
    countryCode?: string;
    deptIds?: number[];
    jobTitle?: string;
    email?: string;
    jobNumber?: string;
    hiredDate?: Date;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      let mobileToUse: string;
      if (userData.countryCode && userData.countryCode !== '+86') {
        mobileToUse = `${userData.countryCode}-${userData.mobile}`;
      } else {
        mobileToUse = userData.mobile;
      }

      const deptIdList = userData.deptIds ? userData.deptIds.join(',') : undefined;

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/create?access_token=${token}`,
        {
          name: userData.name,
          mobile: mobileToUse,
          dept_id_list: deptIdList,
          title: userData.jobTitle || '',
          email: userData.email || '',
          job_number: userData.jobNumber || '',
          hired_date: userData.hiredDate ? new Date(userData.hiredDate).getTime() : undefined,
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, userId: response.data.result?.userid };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkUser] Failed to create user:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async updateUser(userId: string, userData: {
    name?: string;
    deptIds?: number[];
    jobTitle?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/user/update?access_token=${token}`,
        {
          userid: userId,
          name: userData.name,
          department: userData.deptIds,
          title: userData.jobTitle,
          email: userData.email,
        }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkUser] Failed to update user:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/user/delete?access_token=${token}`,
        { userid: userId }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkUser] Failed to delete user:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async getUserByMobile(mobile: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/getbymobile?access_token=${token}`,
        { mobile }
      );

      if (response.data.errcode === 0) {
        return { success: true, userId: response.data.result?.userid };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkUser] Failed to get user by mobile:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async getUserDetail(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${token}`,
        { userid: userId }
      );

      if (response.data.errcode === 0) {
        return { success: true, data: response.data.result };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkUser] Failed to get user detail:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }
}
