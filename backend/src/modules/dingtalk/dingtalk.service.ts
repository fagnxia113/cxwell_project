import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DingtalkService {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly agentId: string;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('DINGTALK_APP_KEY', 'dingytzb7anagf7jumkn');
    this.appSecret = this.configService.get<string>('DINGTALK_APP_SECRET', 'A-E_wJg-Zt****ajOrE3J4vf');
    this.agentId = this.configService.get<string>('DINGTALK_AGENT_ID', '4506043319');
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      console.log('[Dingtalk] Requesting access token with appKey:', this.appKey);
      const response = await axios.post('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
        appKey: this.appKey,
        appSecret: this.appSecret,
      });

      console.log('[Dingtalk] Access token response:', JSON.stringify(response.data));

      if (response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        this.tokenExpireTime = Date.now() + (response.data.expireIn - 60) * 1000;
        console.log('[Dingtalk] Got access token:', this.accessToken?.substring(0, 10) + '...');
        return response.data.accessToken;
      }
      throw new Error('Failed to get access token: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('[Dingtalk] Failed to get access token:', error?.response?.data || error.message);
      throw error;
    }
  }

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
      const token = await this.getAccessToken();

      const mobileWithCountryCode = userData.countryCode
        ? userData.countryCode.replace('+', '') + userData.mobile
        : userData.mobile;

      const deptIdList = userData.deptIds ? userData.deptIds.join(',') : undefined;

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/create?access_token=${token}`,
        {
          name: userData.name,
          mobile: mobileWithCountryCode,
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
      console.error('[Dingtalk] Failed to create user:', error?.response?.data || error.message);
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
      const token = await this.getAccessToken();

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
      console.error('[Dingtalk] Failed to update user:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/user/delete?access_token=${token}`,
        { userid: userId }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[Dingtalk] Failed to delete user:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async sendMessage(userId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${token}`,
        {
          agent_id: this.agentId,
          userid_list: userId,
          msg: {
            msgtype: 'text',
            text: { content },
          },
        }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[Dingtalk] Failed to send message:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async createDepartment(name: string, parentDeptId?: number, nameEn?: string): Promise<{ success: boolean; deptId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/create?access_token=${token}`,
        {
          name,
          name_en: nameEn,
          parent_id: parentDeptId || 1,
        }
      );

      console.log('[Dingtalk] Create department response:', JSON.stringify(response.data));

      if (response.data.errcode === 0) {
        const deptId = response.data.result?.dept_id || response.data.dept_id;
        return { success: true, deptId: deptId?.toString() };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[Dingtalk] Failed to create department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async deleteDepartment(deptId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/department/delete?access_token=${token}`,
        { dept_id: deptId }
      );

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[Dingtalk] Failed to delete department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }

  async updateDepartment(deptId: string, name: string, nameEn?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();

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
      console.error('[Dingtalk] Failed to update department:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.message || error.message,
      };
    }
  }
}
