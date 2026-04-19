import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowDefinition } from '@prisma/client';

/**
 * 流程定义服务
 */
@Injectable()
export class DefService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取流程定义
   */
  async getDefinition(id: bigint): Promise<FlowDefinition> {
    const definition = await this.prisma.flowDefinition.findUnique({ where: { id } });
    if (!definition) {
      throw new BadRequestException('流程定义不存在');
    }
    return definition;
  }

  /**
   * 获取所有流程定义
   */
  async getDefinitions(): Promise<FlowDefinition[]> {
    return this.prisma.flowDefinition.findMany();
  }

  /**
   * 获取已发布的流程定义
   */
  async getPublishedDefinitions(): Promise<FlowDefinition[]> {
    return this.prisma.flowDefinition.findMany({ where: { isPublish: 1 } });
  }

  /**
   * 创建流程定义
   */
  async createDefinition(data: {
    name: string;
    code: string;
    category: string;
    createBy: string;
  }): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        flowName: data.name,
        flowCode: data.code,
        category: data.category,
        createBy: data.createBy,
        delFlag: '0',
        isPublish: 0,
        version: '1.0',
        modelValue: 'CLASSICS',
        activityStatus: 1,
      },
    });
  }

  /**
   * 更新流程定义
   */
  async updateDefinition(id: bigint, data: Partial<FlowDefinition>): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.update({ where: { id }, data });
  }

  /**
   * 发布流程定义
   */
  async publishDefinition(id: bigint, operator: string): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.update({
      where: { id },
      data: { isPublish: 1, updateBy: operator },
    });
  }

  /**
   * 取消发布流程定义
   */
  async unpublishDefinition(id: bigint, operator: string): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.update({
      where: { id },
      data: { isPublish: 0, updateBy: operator },
    });
  }

  /**
   * 删除流程定义
   */
  async deleteDefinition(id: bigint, operator: string): Promise<FlowDefinition> {
    return this.prisma.flowDefinition.update({
      where: { id },
      data: { delFlag: '1', updateBy: operator },
    });
  }
}