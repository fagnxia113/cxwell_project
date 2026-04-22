import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { DingtalkService } from './dingtalk.service';

@Controller('dingtalk')
export class DingtalkController {
  constructor(private readonly dingtalkService: DingtalkService) {}

  @Post('user/create')
  async createUser(@Body() body: {
    name: string;
    mobile: string;
    deptIds?: number[];
    jobTitle?: string;
    email?: string;
  }) {
    const result = await this.dingtalkService.createUser(body);
    return result;
  }

  @Post('user/update')
  async updateUser(
    @Body() body: {
      userId: string;
      name?: string;
      deptIds?: number[];
      jobTitle?: string;
      email?: string;
    }
  ) {
    const result = await this.dingtalkService.updateUser(body.userId, body);
    return result;
  }

  @Post('user/delete')
  async deleteUser(@Body() body: { userId: string }) {
    const result = await this.dingtalkService.deleteUser(body.userId);
    return result;
  }

  @Post('message/send')
  async sendMessage(@Body() body: { userId: string; content: string }) {
    const result = await this.dingtalkService.sendMessage(body.userId, body.content);
    return result;
  }

  @Get('test')
  async test() {
    return { success: true, message: 'Dingtalk service is working' };
  }
}
