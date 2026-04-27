import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DingtalkUserService {
  private readonly logger = new Logger(DingtalkUserService.name);

  constructor(
    private authService: DingtalkAuthService,
    private prisma: PrismaService
  ) {}

  async createUser(userData: {
    name: string;
    mobile: string;
    countryCode?: string;
    deptIds?: number[];
    jobTitle?: string;
    email?: string;
    jobNumber?: string;
    hiredDate?: Date;
    leader?: string;
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

      const requestBody: any = {
        name: userData.name,
        mobile: mobileToUse,
        dept_id_list: deptIdList,
        title: userData.jobTitle || '',
        email: userData.email || '',
        job_number: userData.jobNumber || '',
        hired_date: userData.hiredDate ? new Date(userData.hiredDate).getTime() : undefined,
      };

      if (userData.leader) {
        requestBody.leader = userData.leader;
      }

      this.logger.log('[createUser] Request body:', JSON.stringify(requestBody));

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/create?access_token=${token}`,
        requestBody
      );

      this.logger.log('[createUser] Response:', JSON.stringify(response.data));

      if (response.data.errcode === 0) {
        return { success: true, userId: response.data.result?.userid };
      }

      // 40103: 已发出邀请，对方同意后即可加入组织
      // 60121: 员工已存在
      if (response.data.errcode === 40103 || response.data.errcode === 60121) {
        this.logger.log(`[createUser] 用户已存在或已邀请 (${response.data.errcode})，尝试通过手机号获取 userId...`);
        const existing = await this.getUserByMobile(mobileToUse);
        if (existing.success && existing.userId) {
          return { success: true, userId: existing.userId };
        }
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      this.logger.error('[DingtalkUser] Failed to create user:', error?.response?.data || error.message);
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
    leader?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const requestBody: any = {
        userid: userId,
        name: userData.name,
        department: userData.deptIds,
        title: userData.jobTitle,
        email: userData.email,
      };

      if (userData.leader !== undefined) {
        requestBody.leader = userData.leader;
      }

      this.logger.log('[updateUser] Request body:', JSON.stringify(requestBody));

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/user/update?access_token=${token}`,
        requestBody
      );

      this.logger.log('[updateUser] Response:', JSON.stringify(response.data));

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      this.logger.error('[DingtalkUser] Failed to update user:', error?.response?.data || error.message);
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

  async sendActiveInvite(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/user/active/invite?access_token=${token}`,
        { userid: userId }
      );

      this.logger.log(`[sendActiveInvite] Response for ${userId}:`, JSON.stringify(response.data));

      if (response.data.errcode === 0) {
        return { success: true };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      this.logger.error('[DingtalkUser] Failed to send active invite:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async syncAllUnboundUsers(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const unboundEmployees = await this.prisma.sysEmployee.findMany({
        where: {
          dingtalkUserId: null,
          phone: { not: 'N/A' },
          status: '0'
        }
      });

      if (unboundEmployees.length === 0) {
        return { success: true, count: 0 };
      }

      let count = 0;
      for (const emp of unboundEmployees) {
        if (!emp.phone) continue;
        const res = await this.getUserByMobile(emp.phone);
        if (res.success && res.userId) {
          await this.prisma.sysEmployee.update({
            where: { employeeId: emp.employeeId },
            data: { dingtalkUserId: res.userId }
          });
          count++;
        }
      }
      return { success: true, count };
    } catch (e) {
      return { success: false, count: 0, error: e.message };
    }
  }
}
