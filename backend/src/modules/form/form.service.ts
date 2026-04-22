import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FormService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有可用的表单模板
   */
  async getAllTemplates() {
    const list = await this.prisma.bizFormTemplate.findMany({
      orderBy: { updateTime: 'desc' }
    });
    return list.map(item => ({
      ...item,
      id: item.id.toString(),
      fields: typeof item.fields === 'string' ? JSON.parse(item.fields) : item.fields,
      layout: typeof item.layout === 'string' ? JSON.parse(item.layout) : item.layout
    }));
  }

  /**
   * 获取表单模板
   */
  async getTemplate(templateKeyOrId: string) {
    let template;
    if (/^\d+$/.test(templateKeyOrId)) {
      template = await this.prisma.bizFormTemplate.findUnique({
        where: { id: BigInt(templateKeyOrId) }
      });
    } else {
      template = await this.prisma.bizFormTemplate.findUnique({
        where: { templateKey: templateKeyOrId }
      });
    }

    if (!template) return null;

    return {
      ...template,
      id: template.id.toString(),
      fields: typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields,
      layout: typeof template.layout === 'string' ? JSON.parse(template.layout) : template.layout
    };
  }

  /**
   * 创建表单模板
   */
  async createTemplate(data: any, creator?: string) {
    const templateKey = `form_${Date.now()}`;
    const newTemplate = await this.prisma.bizFormTemplate.create({
      data: {
        templateKey: data.templateKey || templateKey,
        name: data.name,
        category: data.category || 'general',
        fields: data.fields || [],
        layout: data.layout || {},
        version: 1,
        status: '0',
        createBy: creator
      }
    });
    return {
      ...newTemplate,
      id: newTemplate.id.toString()
    };
  }

  /**
   * 更新表单模板
   */
  async updateTemplate(id: string, data: any, updater?: string) {
    const existing = await this.prisma.bizFormTemplate.findUnique({
      where: { id: BigInt(id) }
    });
    if (!existing) throw new Error('模板不存在');

    const updated = await this.prisma.bizFormTemplate.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name ?? existing.name,
        category: data.category ?? existing.category,
        fields: data.fields ?? existing.fields,
        layout: data.layout ?? existing.layout,
        version: { increment: 1 }
      }
    });

    return {
      ...updated,
      id: updated.id.toString()
    };
  }

  /**
   * 删除表单模板
   */
  async deleteTemplate(id: string) {
    return this.prisma.bizFormTemplate.delete({
      where: { id: BigInt(id) }
    });
  }

  /**
   * 复制表单模板
   */
  async copyTemplate(id: string, creator?: string) {
    const existing = await this.prisma.bizFormTemplate.findUnique({
      where: { id: BigInt(id) }
    });
    if (!existing) throw new Error('模板不存在');

    return this.createTemplate({
      ...existing,
      name: `${existing.name} (复制)`,
      templateKey: `${existing.templateKey}_copy_${Date.now()}`
    }, creator);
  }

  /**
   * 保存草稿
   */
  async saveDraft(userId: string, templateKey: string, formData: any) {
    const userIdBigInt = BigInt(userId);
    
    // 检查是否已有草稿
    const existing = await this.prisma.bizFormDraft.findFirst({
      where: { userId: userIdBigInt, templateKey }
    });

    if (existing) {
      return this.prisma.bizFormDraft.update({
        where: { id: existing.id },
        data: { formData }
      });
    }

    return this.prisma.bizFormDraft.create({
      data: {
        userId: userIdBigInt,
        templateKey,
        formData
      }
    });
  }

  /**
   * 获取草稿
   */
  async getDraft(userId: string, templateKey: string) {
    const draft = await this.prisma.bizFormDraft.findFirst({
      where: { userId: BigInt(userId), templateKey }
    });

    if (!draft) return null;

    return {
      ...draft,
      id: draft.id.toString(),
      userId: draft.userId.toString()
    };
  }

  /**
   * 删除草稿
   */
  async deleteDraft(userId: string, templateKey: string) {
    return this.prisma.bizFormDraft.deleteMany({
      where: { userId: BigInt(userId), templateKey }
    });
  }
}
