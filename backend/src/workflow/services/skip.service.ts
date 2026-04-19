import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowSkip } from '@prisma/client';

/**
 * 流程跳转服务
 */
@Injectable()
export class SkipService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取跳转
   */
  async getSkip(id: bigint): Promise<FlowSkip> {
    const skip = await this.prisma.flowSkip.findUnique({ where: { id } });
    if (!skip) {
      throw new BadRequestException('跳转不存在');
    }
    return skip;
  }

  /**
   * 根据流程定义获取跳转列表
   */
  async getSkipsByDefinition(definitionId: bigint): Promise<FlowSkip[]> {
    return this.prisma.flowSkip.findMany({ where: { definitionId } });
  }

  /**
   * 根据当前节点获取跳转
   */
  async getSkipsByCurrentNode(definitionId: bigint, nowNodeCode: string): Promise<FlowSkip[]> {
    return this.prisma.flowSkip.findMany({ where: { definitionId, nowNodeCode } });
  }

  /**
   * 创建跳转
   */
  async createSkip(data: {
    definitionId: bigint;
    nowNodeCode: string;
    nextNodeCode: string;
    conditionType: number;
    conditionExpression: string;
    createBy: string;
  }): Promise<FlowSkip> {
    return this.prisma.flowSkip.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        definitionId: data.definitionId,
        nowNodeCode: data.nowNodeCode,
        nextNodeCode: data.nextNodeCode,
        skipCondition: data.conditionExpression,
        createBy: data.createBy,
        createTime: new Date(),
        updateTime: new Date(),
        delFlag: '0',
      }
    });
  }

  /**
   * 更新跳转
   */
  async updateSkip(id: bigint, data: Partial<FlowSkip>): Promise<FlowSkip> {
    return this.prisma.flowSkip.update({ where: { id }, data });
  }

  /**
   * 删除跳转
   */
  async deleteSkip(id: bigint, operator: string): Promise<FlowSkip> {
    return this.prisma.flowSkip.update({
      where: { id },
      data: { delFlag: '1', updateBy: operator },
    });
  }

  /**
   * 获取下一个节点
   */
  async getNextNode(definitionId: bigint, nowNodeCode: string, variables: any = {}): Promise<string | null> {
    const skips = await this.getSkipsByCurrentNode(definitionId, nowNodeCode);
    
    // 简单实现：返回第一个匹配的跳转
    for (const skip of skips) {
      if (!skip.skipCondition || this.evaluateCondition(skip.skipCondition, variables)) {
        return skip.nextNodeCode;
      }
    }
    
    return null;
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(expression: string, variables: any): boolean {
    // 简单实现，实际项目中可使用更复杂的表达式引擎
    try {
      // 这里只是一个示例，实际项目中应该使用安全的表达式评估
      return true;
    } catch (error) {
      return false;
    }
  }
}