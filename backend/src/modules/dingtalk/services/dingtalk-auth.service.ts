import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DingtalkAuthService {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly agentId: string;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('DINGTALK_APP_KEY', '');
    this.appSecret = this.configService.get<string>('DINGTALK_APP_SECRET', '');
    this.agentId = this.configService.get<string>('DINGTALK_AGENT_ID', '');
  }

  getAppKey(): string {
    return this.appKey;
  }

  getAppSecret(): string {
    return this.appSecret;
  }

  getAgentId(): string {
    return this.agentId;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      // 优先尝试旧版 token 接口，兼容性更好
      const response = await axios.get(
        `https://oapi.dingtalk.com/gettoken?appkey=${this.appKey}&appsecret=${this.appSecret}`
      );

      if (response.data.errcode === 0 && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 60) * 1000;
        return this.accessToken as string;
      }
      
      // 如果旧版失败，尝试新版
      const v1Response = await axios.post('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
        appKey: this.appKey,
        appSecret: this.appSecret,
      });

      if (v1Response.data.accessToken) {
        this.accessToken = v1Response.data.accessToken;
        this.tokenExpireTime = Date.now() + (v1Response.data.expireIn - 60) * 1000;
        return this.accessToken as string;
      }

      throw new Error('Failed to get access token: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('[DingtalkAuth] Failed to get access token:', error?.response?.data || error.message);
      throw error;
    }
  }
}
