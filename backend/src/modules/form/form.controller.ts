import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { FormService } from './form.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('form')
@UseGuards(AuthGuard('jwt'))
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Get('template/:key')
  async getTemplate(@Param('key') key: string) {
    const data = await this.formService.getTemplate(key);
    return {
      success: true,
      data
    };
  }

  @Get('templates')
  async getAllTemplates() {
    const data = await this.formService.getAllTemplates();
    return {
      success: true,
      data
    };
  }

  @Post('draft')
  async saveDraft(@Request() req, @Body() body: { templateKey: string; formData: any }) {
    const userId = req.user.userId;
    const data = await this.formService.saveDraft(userId, body.templateKey, body.formData);
    return {
      success: true,
      data
    };
  }

  @Get('draft/:key')
  async getDraft(@Request() req, @Param('key') key: string) {
    const userId = req.user.userId;
    const data = await this.formService.getDraft(userId, key);
    return {
      success: true,
      data
    };
  }

  @Delete('draft/:key')
  async deleteDraft(@Request() req, @Param('key') key: string) {
    const userId = req.user.userId;
    await this.formService.deleteDraft(userId, key);
    return {
      success: true
    };
  }
}
