import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { FormService } from '../services/form.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 表单控制器
 */
@Controller('workflow/form')
@UseGuards(AuthGuard('jwt'))
export class FormController {
  constructor(private formService: FormService) {}

  @Post('create')
  async createForm(@Body() body: {
    formName: string;
    formCode: string;
    formContent: string;
  }, @Req() req) {
    const createBy = req.user.loginName;
    const form = await this.formService.createForm({
      formName: body.formName,
      formCode: body.formCode,
      formContent: body.formContent,
      createBy,
    });
    return { success: true, data: form };
  }

  @Put('update/:id')
  async updateForm(@Param('id') id: string, @Body() body: {
    formName: string;
    formContent: string;
  }, @Req() req) {
    const updateBy = req.user.loginName;
    const form = await this.formService.updateForm(BigInt(id), {
      formName: body.formName,
      formContent: body.formContent,
      updateBy,
    });
    return { success: true, data: form };
  }

  @Delete('delete/:id')
  async deleteForm(@Param('id') id: string) {
    await this.formService.deleteForm(BigInt(id));
    return { success: true };
  }

  @Get('get/:id')
  async getForm(@Param('id') id: string) {
    const form = await this.formService.getForm(BigInt(id));
    return { success: true, data: form };
  }

  @Get('list')
  async getFormList() {
    const forms = await this.formService.getFormList();
    return { success: true, data: forms };
  }

  @Get('get-by-code/:formCode')
  async getFormByCode(@Param('formCode') formCode: string) {
    const form = await this.formService.getFormByCode(formCode);
    return { success: true, data: form };
  }
}