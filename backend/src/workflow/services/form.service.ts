import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 表单服务
 */
@Injectable()
export class FormService {
  private readonly logger = new Logger(FormService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建表单
   */
  async createForm(formData: {
    formName: string;
    formCode: string;
    formContent: string;
    createBy: string;
  }) {
    const existing = await this.prisma.flowForm.findFirst({
      where: { formCode: formData.formCode }
    });
    if (existing) {
      throw new BadRequestException('表单编码已存在');
    }

    return this.prisma.flowForm.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        formName: formData.formName,
        formCode: formData.formCode,
        formContent: formData.formContent,
        createBy: formData.createBy,
        createTime: new Date(),
        updateTime: new Date(),
        delFlag: '0',
      }
    });
  }

  /**
   * 更新表单
   */
  async updateForm(id: bigint, formData: {
    formName: string;
    formContent: string;
    updateBy: string;
  }) {
    const form = await this.prisma.flowForm.findUnique({ where: { id } });
    if (!form) {
      throw new BadRequestException('表单不存在');
    }

    return this.prisma.flowForm.update({
      where: { id },
      data: {
        formName: formData.formName,
        formContent: formData.formContent,
        updateBy: formData.updateBy,
        updateTime: new Date(),
      }
    });
  }

  /**
   * 删除表单
   */
  async deleteForm(id: bigint) {
    const form = await this.prisma.flowForm.findUnique({ where: { id } });
    if (!form) {
      throw new BadRequestException('表单不存在');
    }

    return this.prisma.flowForm.delete({ where: { id } });
  }

  /**
   * 获取表单详情
   */
  async getForm(id: bigint) {
    const form = await this.prisma.flowForm.findUnique({ where: { id } });
    if (!form) {
      throw new BadRequestException('表单不存在');
    }
    return form;
  }

  /**
   * 获取表单列表
   */
  async getFormList() {
    return this.prisma.flowForm.findMany({
      orderBy: { createTime: 'desc' }
    });
  }

  /**
   * 根据编码获取表单
   */
  async getFormByCode(formCode: string) {
    const form = await this.prisma.flowForm.findFirst({ where: { formCode } });
    if (!form) {
      throw new BadRequestException('表单不存在');
    }
    return form;
  }

  /**
   * 关联表单与流程定义
   */
  async associateFormWithFlow(definitionId: bigint, formId: bigint, operator: string) {
    return this.prisma.flowDefinition.update({
      where: { id: definitionId },
      data: {
        formPath: formId.toString(),
        updateBy: operator,
        updateTime: new Date(),
      }
    });
  }

  /**
   * 提交表单数据
   */
  async submitFormData(instanceId: bigint, formData: any, submitter: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    // 更新流程实例的扩展数据
    const currentExt = instance.ext ? JSON.parse(instance.ext) : {};
    const updatedExt = {
      ...currentExt,
      formData,
    };

    return this.prisma.flowInstance.update({
      where: { id: instanceId },
      data: {
        ext: JSON.stringify(updatedExt),
        updateBy: submitter,
        updateTime: new Date(),
      }
    });
  }

  /**
   * 获取表单数据
   */
  async getFormData(instanceId: bigint) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    const ext = instance.ext ? JSON.parse(instance.ext) : {};
    return ext.formData || {};
  }

  /**
   * 验证表单数据
   */
  async validateFormData(formId: bigint, formData: any): Promise<{ valid: boolean; errors: string[] }> {
    const form = await this.getForm(formId);
    const errors: string[] = [];

    // 这里可以添加具体的表单验证逻辑
    // 例如：必填字段检查、格式验证等

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 复制表单
   */
  async copyForm(id: bigint, newFormCode: string, newFormName: string, operator: string) {
    const form = await this.getForm(id);

    const existing = await this.prisma.flowForm.findFirst({
      where: { formCode: newFormCode }
    });
    if (existing) {
      throw new BadRequestException('新表单编码已存在');
    }

    return this.prisma.flowForm.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        formName: newFormName,
        formCode: newFormCode,
        formContent: form.formContent,
        createBy: operator,
        createTime: new Date(),
        updateTime: new Date(),
        delFlag: '0',
      }
    });
  }

  /**
   * 获取流程关联的表单
   */
  async getFormByFlowDefinition(definitionId: bigint) {
    const definition = await this.prisma.flowDefinition.findUnique({ 
      where: { id: definitionId }
    });
    
    if (!definition) {
      throw new BadRequestException('流程定义不存在');
    }

    if (!definition.formPath) {
      return null;
    }

    const formId = BigInt(definition.formPath);
    return this.getForm(formId);
  }
}