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
      console.log('[DingtalkAuth] Requesting access token with appKey:', this.appKey);
      const response = await axios.post('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
        appKey: this.appKey,
        appSecret: this.appSecret,
      });

      console.log('[DingtalkAuth] Access token response:', JSON.stringify(response.data));

      if (response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        this.tokenExpireTime = Date.now() + (response.data.expireIn - 60) * 1000;
        console.log('[DingtalkAuth] Got access token:', this.accessToken?.substring(0, 10) + '...');
        return response.data.accessToken;
      }
      throw new Error('Failed to get access token: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('[DingtalkAuth] Failed to get access token:', error?.response?.data || error.message);
      throw error;
    }
  }
}
