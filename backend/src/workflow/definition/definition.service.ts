import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 流程定义管理服务
 * 负责流程的 CRUD、版本发布、节点与跳转规则的持久化
 * 此层对应 Warm-Flow 中的 FlowDefinition + FlowNode + FlowSkip 三表联动
 */
@Injectable()
export class DefinitionService {
  private readonly logger = new Logger(DefinitionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 查询所有流程定义（已发布/未发布皆可）
   */
  async findAll(isPublish?: number) {
    const where: any = { delFlag: '0' };
    if (isPublish !== undefined) where.isPublish = isPublish;

    return this.prisma.flowDefinition.findMany({
      where,
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据 ID 获取完整的流程定义（含节点 + 跳转规则）
   */
  async findFullDefinition(id: bigint) {
    const definition = await this.prisma.flowDefinition.findUnique({ where: { id } });
    if (!definition) throw new BadRequestException('流程定义不存在');

    const nodes = await this.prisma.flowNode.findMany({
      where: { definitionId: id, delFlag: '0' },
      orderBy: { nodeType: 'asc' },
    });

    const skips = await this.prisma.flowSkip.findMany({
      where: { definitionId: id, delFlag: '0' },
    });

    return { definition, nodes, skips };
  }

  /**
   * 创建新流程定义（元数据层）
   */
  async createDefinition(data: {
    flowCode: string;
    flowName: string;
    category?: string;
    version: string;
    createBy: string;
  }) {
    const id = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));

    return this.prisma.flowDefinition.create({
      data: {
        id,
        flowCode: data.flowCode,
        flowName: data.flowName,
        category: data.category ?? '',
        version: data.version,
        isPublish: 0,
        createBy: data.createBy,
        createTime: new Date(),
      }
    });
  }

  /**
   * 保存流程设计（批量写入节点 + 跳转线）
   * 前端设计器会传入完整的节点列表与连线列表
   */
  async saveDesign(definitionId: bigint, design: {
    nodes: Array<{
      nodeCode: string;
      nodeName: string;
      nodeType: number; // 0=开始 1=中间 2=结束 3=网关
      permissionFlag?: string;
      coordinate?: string;
    }>;
    skips: Array<{
      nowNodeCode: string;
      nextNodeCode: string;
      skipName?: string;
      skipCondition?: string;
      coordinate?: string;
    }>;
  }, operator: string) {
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    return this.prisma.$transaction(async (tx) => {
      // 清除旧的节点与跳转定义
      await tx.flowNode.deleteMany({ where: { definitionId } });
      await tx.flowSkip.deleteMany({ where: { definitionId } });

      // 批量写入新节点
      for (const node of design.nodes) {
        const nodeId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000));
        await tx.flowNode.create({
          data: {
            id: nodeId,
            definitionId,
            nodeCode: node.nodeCode,
            nodeName: node.nodeName,
            nodeType: node.nodeType,
            permissionFlag: node.permissionFlag ?? '',
            coordinate: node.coordinate ?? '',
            version: def.version,
            createBy: operator,
            createTime: new Date(),
          }
        });
      }

      // 批量写入跳转线
      for (const skip of design.skips) {
        const skipId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000));
        const nowNode = design.nodes.find(n => n.nodeCode === skip.nowNodeCode);
        const nextNode = design.nodes.find(n => n.nodeCode === skip.nextNodeCode);

        await tx.flowSkip.create({
          data: {
            id: skipId,
            definitionId,
            nowNodeCode: skip.nowNodeCode,
            nowNodeType: nowNode?.nodeType ?? null,
            nextNodeCode: skip.nextNodeCode,
            nextNodeType: nextNode?.nodeType ?? null,
            skipName: skip.skipName ?? '',
            skipCondition: skip.skipCondition ?? '',
            coordinate: skip.coordinate ?? '',
            createBy: operator,
            createTime: new Date(),
          }
        });
      }

      this.logger.log(`流程设计保存成功: DefID=${definitionId}, ${design.nodes.length}个节点, ${design.skips.length}条连线`);
    });
  }

  /**
   * 发布流程 (isPublish = 1)
   */
  async publish(id: bigint) {
    // 校验：必须有开始节点和结束节点
    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: id } });
    const hasStart = nodes.some(n => n.nodeType === 0);
    const hasEnd = nodes.some(n => n.nodeType === 2);

    if (!hasStart || !hasEnd) {
      throw new BadRequestException('流程必须包含开始节点和结束节点才能发布');
    }

    return this.prisma.flowDefinition.update({
      where: { id },
      data: { isPublish: 1, updateTime: new Date() }
    });
  }
}
