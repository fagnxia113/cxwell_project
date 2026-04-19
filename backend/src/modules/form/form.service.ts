import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FormService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有可用的表单模板
   */
  async getAllTemplates() {
    const list = await this.prisma.bizFormTemplate.findMany();
    return list.map(item => ({
      ...item,
      id: item.id.toString()
    }));
  }

  /**
   * 获取表单模板
   */
  async getTemplate(templateKey: string) {
    const template = await this.prisma.bizFormTemplate.findUnique({
      where: { templateKey }
    });

    if (!template) return null;

    return {
      ...template,
      id: template.id.toString()
    };
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
