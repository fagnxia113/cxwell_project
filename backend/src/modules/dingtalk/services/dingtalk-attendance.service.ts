import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';

@Injectable()
export class DingtalkAttendanceService {
  private readonly logger = new Logger(DingtalkAttendanceService.name);

  constructor(private authService: DingtalkAuthService) {}

  async getAttendanceList(userIds: string[], workDateFrom: string, workDateTo: string, offset: number = 0, limit: number = 50): Promise<{ success: boolean; data?: any[]; hasMore?: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const dateFrom = workDateFrom.replace(/(\d{4})(\d{2})(\d{2})\d{6}/, '$1-$2-$3 00:00:00');
      const dateTo = workDateTo.replace(/(\d{4})(\d{2})(\d{2})\d{6}/, '$1-$2-$3 23:59:59');

      this.logger.log(`[getAttendanceList] Calling DingTalk API with params:`, {
        userIds,
        dateFrom,
        dateTo,
      });

      this.logger.log('[getAttendanceList] Trying API: attendance/list');
      const responseOld = await axios.post(
        `https://oapi.dingtalk.com/attendance/list?access_token=${token}`,
        {
          workDateFrom: dateFrom,
          workDateTo: dateTo,
          userIdList: userIds,
          offset: offset,
          limit: limit,
        }
      );

      this.logger.log('[getAttendanceList] Old API response errcode:', responseOld.data.errcode, 'errmsg:', responseOld.data.errmsg, 'recordresult count:', responseOld.data.recordresult?.length);

      if (responseOld.data.errcode === 0) {
        this.logger.log('[getAttendanceList] Old API success, records:', responseOld.data.recordresult?.length);
        return {
          success: true,
          data: responseOld.data.recordresult || [],
          hasMore: responseOld.data.hasMore || false,
        };
      }

      this.logger.warn('[getAttendanceList] Old API failed:', responseOld.data.errmsg, 'trying new API');

      const startTime = new Date(dateFrom).getTime();
      const endTime = new Date(dateTo).getTime();

      const response = await axios.post(
        `https://api.dingtalk.com/v1.0/attendance/checkin/records/query`,
        {
          userIdList: userIds,
          startTime: startTime,
          endTime: endTime,
        },
        {
          headers: {
            'x-acs-dingtalk-access-token': token,
            'Content-Type': 'application/json',
          }
        }
      );

      this.logger.log('[getAttendanceList] New API response:', JSON.stringify(response.data).substring(0, 500));

      if (response.data.success || response.data.errcode === 0) {
        return {
          success: true,
          data: response.data.result?.records || [],
          hasMore: response.data.result?.hasMore || false,
        };
      }

      return { success: false, error: response.data.errmsg || response.data.errorMsg || 'Unknown error' };
    } catch (error) {
      this.logger.error('[DingtalkAttendance] Failed to get attendance list:', {
        message: error.message,
        responseData: error?.response?.data,
      });
      return {
        success: false,
        error: error?.response?.data?.errmsg || error?.response?.data?.errorMsg || error.message,
      };
    }
  }

  async getAttendanceRecord(userIds: string[], checkDateFrom: string, checkDateTo: string, isI18n: boolean = false): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/attendance/listRecord?access_token=${token}`,
        {
          user_ids: userIds.join(','),
          check_date_from: checkDateFrom,
          check_date_to: checkDateTo,
          is_i18n: isI18n,
        }
      );

      if (response.data.errcode === 0) {
        return {
          success: true,
          data: response.data.recordresult,
        };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkAttendance] Failed to get attendance record:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async getUserAttendanceData(userId: string, workDate: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/attendance/getupdatedata?access_token=${token}`,
        {
          userid: userId,
          work_date: workDate,
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, data: response.data.result };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkAttendance] Failed to get user attendance data:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async getAttendanceColumns(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/attendance/getattcolumns?access_token=${token}`,
        {}
      );

      if (response.data.errcode === 0) {
        return { success: true, data: response.data.result?.column_list };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkAttendance] Failed to get attendance columns:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async getAttendanceColumnValues(userId: string, columnIdList: string, startDate: string, endDate: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/attendance/getcolumnval?access_token=${token}`,
        {
          userid: userId,
          column_id_list: columnIdList,
          start_date: startDate,
          end_date: endDate,
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, data: response.data.result };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkAttendance] Failed to get attendance column values:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }
}
