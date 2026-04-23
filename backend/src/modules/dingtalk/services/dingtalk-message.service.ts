import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';

@Injectable()
export class DingtalkMessageService {
  private readonly logger = new Logger(DingtalkMessageService.name);

  constructor(private authService: DingtalkAuthService) {}

  async sendWorkNotification(userId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();
      const agentId = this.authService.getAgentId();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${token}`,
        {
          agent_id: agentId,
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
      console.error('[DingtalkMessage] Failed to send work notification:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }

  async sendOaNotification(userId: string, data: {
    title: string;
    text: string;
    messageUrl: string;
    pcMessageUrl?: string;
  }): Promise<{ success: boolean; error?: string; taskId?: string }> {
    try {
      const token = await this.authService.getAccessToken();
      const agentId = this.authService.getAgentId();

      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${token}`,
        {
          agent_id: agentId,
          userid_list: userId,
          msg: {
            msgtype: 'oa',
            oa: {
              head: {
                text: data.title,
                bgcolor: 'FFBBBBBB',
              },
              body: {
                title: data.title,
                content: data.text,
              },
              message_url: data.messageUrl,
              pc_message_url: data.pcMessageUrl || data.messageUrl,
            },
          },
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, taskId: response.data.task_id?.toString() };
      }

      return { success: false, error: response.data.errmsg || 'Unknown error' };
    } catch (error) {
      console.error('[DingtalkMessage] Failed to send OA notification:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.errmsg || error.message,
      };
    }
  }
}
