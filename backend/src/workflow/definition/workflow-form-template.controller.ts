import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { FormService } from '../../modules/form/form.service';

@Controller('workflow/form-templates')
export class WorkflowFormTemplateController {
  constructor(private readonly formService: FormService) {}

  @Get('templates')
  async getAllTemplates() {
    const data = await this.formService.getAllTemplates();
    return {
      success: true,
      data
    };
  }

  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    const data = await this.formService.getTemplate(id);
    return {
      success: true,
      data
    };
  }

  @Post()
  async createTemplate(@Request() req, @Body() data: any) {
    const creator = req.user.loginName;
    const result = await this.formService.createTemplate(data, creator);
    return {
      success: true,
      data: result
    };
  }

  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Request() req, @Body() data: any) {
    const updater = req.user.loginName;
    const result = await this.formService.updateTemplate(id, data, updater);
    return {
      success: true,
      data: result
    };
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    await this.formService.deleteTemplate(id);
    return {
      success: true
    };
  }

  @Post(':id/copy')
  async copyTemplate(@Param('id') id: string, @Request() req) {
    const creator = req.user.loginName;
    const result = await this.formService.copyTemplate(id, creator);
    return {
      success: true,
      data: result
    };
  }
}
