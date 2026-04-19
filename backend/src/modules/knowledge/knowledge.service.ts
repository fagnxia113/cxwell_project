import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, type?: string, parentId?: string, search?: string, all?: string) {
    // 如果是获取所有文件夹（all=true 且 type=Folder）
    if (all === 'true' && type === 'Folder') {
      return this.prisma.bizKnowledge.findMany({
        where: {
          isFolder: true,
          delFlag: '0',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 基础查询条件
    const where: any = {
      delFlag: '0',
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (parentId) {
      if (parentId === 'root') {
        where.parentId = null;
      } else {
        where.parentId = BigInt(parentId);
      }
    } else {
      // 默认查根目录
      where.parentId = null;
    }

    if (search) {
      where.title = { contains: search };
    }

    // 获取所有数据，然后在内存中进行权限过滤
    const allItems = await this.prisma.bizKnowledge.findMany({
      where,
      include: { permissions: true },
      orderBy: [
        { isFolder: 'desc' }, // 文件夹优先
        { createdAt: 'desc' },
      ],
    });

    // 过滤用户有权限查看的项目
    return allItems.filter((item) => this.hasPermission(userId, item, 'view'));
  }

  async findOne(id: string, userId: number) {
    const item = await this.prisma.bizKnowledge.findUnique({
      where: { id: BigInt(id) },
      include: { permissions: true },
    });

    if (!item || item.delFlag !== '0') {
      throw new NotFoundException('Knowledge item not found');
    }

    if (!this.hasPermission(userId, item, 'view')) {
      throw new ForbiddenException('You do not have permission to view this item');
    }

    return item;
  }

  async create(createKnowledgeDto: CreateKnowledgeDto, userId: number) {
    const { permissions, ...data } = createKnowledgeDto;

    const item = await this.prisma.bizKnowledge.create({
      data: {
        ...data,
        isFolder: data.isFolder || false,
        parentId: data.parentId ? BigInt(data.parentId) : null,
        createdBy: BigInt(userId),
      },
    });

    if (permissions && permissions.length > 0) {
      await this.prisma.bizKnowledgePermission.createMany({
        data: permissions.map((p) => ({
          knowledgeId: item.id,
          targetType: p.targetType,
          targetId: BigInt(p.targetId),
          permission: p.permission || 'view',
        })),
      });
    }

    return item;
  }

  async update(id: string, updateKnowledgeDto: UpdateKnowledgeDto, userId: number) {
    const item = await this.prisma.bizKnowledge.findUnique({
      where: { id: BigInt(id) },
      include: { permissions: true },
    });

    if (!item || item.delFlag !== '0') {
      throw new NotFoundException('Knowledge item not found');
    }

    if (!this.hasPermission(userId, item, 'edit')) {
      throw new ForbiddenException('You do not have permission to edit this item');
    }

    const { permissions, ...data } = updateKnowledgeDto;

    const updatedItem = await this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data,
    });

    if (permissions !== undefined) {
      await this.prisma.bizKnowledgePermission.deleteMany({
        where: { knowledgeId: BigInt(id) },
      });

      if (permissions.length > 0) {
        await this.prisma.bizKnowledgePermission.createMany({
          data: permissions.map((p) => ({
            knowledgeId: BigInt(id),
            targetType: p.targetType,
            targetId: BigInt(p.targetId),
            permission: p.permission || 'view',
          })),
        });
      }
    }

    return updatedItem;
  }

  async remove(id: string, userId: number) {
    const item = await this.prisma.bizKnowledge.findUnique({
      where: { id: BigInt(id) },
      include: { permissions: true },
    });

    if (!item || item.delFlag !== '0') {
      throw new NotFoundException('Knowledge item not found');
    }

    if (!this.hasPermission(userId, item, 'delete')) {
      throw new ForbiddenException('You do not have permission to delete this item');
    }

    // 软删除
    return this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: { delFlag: '1' },
    });
  }

  async checkIsEmpty(id: string, userId: number) {
    const item = await this.prisma.bizKnowledge.findUnique({
      where: { id: BigInt(id) },
      include: { permissions: true },
    });

    if (!item || item.delFlag !== '0') {
      throw new NotFoundException('Knowledge item not found');
    }

    if (!this.hasPermission(userId, item, 'view')) {
      throw new ForbiddenException('You do not have permission to view this item');
    }

    const childCount = await this.prisma.bizKnowledge.count({
      where: { parentId: BigInt(id), delFlag: '0' },
    });

    return { isEmpty: childCount === 0 };
  }

  // 权限验证辅助方法
  private hasPermission(
    userId: number,
    item: any & { permissions?: any[] },
    requiredPermission: string
  ): boolean {
    const permissionOrder = ['view', 'edit', 'delete', 'admin'];
    const requiredIndex = permissionOrder.indexOf(requiredPermission);

    // 1. 管理员或创建者有完全权限
    if (item.createdBy === BigInt(userId)) {
      return true;
    }

    // 2. everyone 可见性
    if (item.visibilityType === 'everyone') {
      return true;
    }

    // 3. private 只有创建者可见（已在上面处理）
    if (item.visibilityType === 'private') {
      return false;
    }

    // 4. specified 权限检查
    if (item.visibilityType === 'specified' && item.permissions) {
      for (const perm of item.permissions) {
        const permIndex = permissionOrder.indexOf(perm.permission);
        if (permIndex >= requiredIndex) {
          if (perm.targetType === 'user' && perm.targetId === BigInt(userId)) {
            return true;
          }
          // TODO: 可以在这里添加对 dept/role/post 的权限检查
        }
      }
    }

    return false;
  }
}
