import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowNode } from '@prisma/client';

/**
 * 流程节点服务
 */
@Injectable()
export class NodeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取节点
   */
  async getNode(id: bigint): Promise<FlowNode> {
    const node = await this.prisma.flowNode.findUnique({ where: { id } });
    if (!node) {
      throw new BadRequestException('节点不存在');
    }
    return node;
  }

  /**
   * 根据流程定义获取节点列表
   */
  async getNodesByDefinition(definitionId: bigint): Promise<FlowNode[]> {
    return this.prisma.flowNode.findMany({ where: { definitionId } });
  }

  /**
   * 根据节点类型获取节点
   */
  async getNodesByType(definitionId: bigint, nodeType: number): Promise<FlowNode[]> {
    return this.prisma.flowNode.findMany({ where: { definitionId, nodeType } });
  }

  /**
   * 根据节点代码获取节点
   */
  async getNodeByCode(definitionId: bigint, nodeCode: string): Promise<FlowNode | null> {
    return this.prisma.flowNode.findFirst({ where: { definitionId, nodeCode } });
  }

  /**
   * 创建节点
   */
  async createNode(data: {
    definitionId: bigint;
    nodeCode: string;
    nodeName: string;
    nodeType: number;
    permissionFlag: string;
    createBy: string;
  }): Promise<FlowNode> {
    return this.prisma.flowNode.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        definitionId: data.definitionId,
        nodeCode: data.nodeCode,
        nodeName: data.nodeName,
        nodeType: data.nodeType,
        permissionFlag: data.permissionFlag,
        createBy: data.createBy,
        createTime: new Date(),
        updateTime: new Date(),
        delFlag: '0',
        version: '1.0',
        formCustom: 'N',
      }
    });
  }

  /**
   * 更新节点
   */
  async updateNode(id: bigint, data: Partial<FlowNode>): Promise<FlowNode> {
    return this.prisma.flowNode.update({ where: { id }, data });
  }

  /**
   * 删除节点
   */
  async deleteNode(id: bigint, operator: string): Promise<FlowNode> {
    return this.prisma.flowNode.update({
      where: { id },
      data: { delFlag: '1', updateBy: operator },
    });
  }

  /**
   * 获取开始节点
   */
  async getStartNode(definitionId: bigint): Promise<FlowNode | null> {
    return this.prisma.flowNode.findFirst({ where: { definitionId, nodeType: 0 } });
  }

  /**
   * 获取结束节点
   */
  async getEndNode(definitionId: bigint): Promise<FlowNode | null> {
    return this.prisma.flowNode.findFirst({ where: { definitionId, nodeType: 2 } });
  }
}