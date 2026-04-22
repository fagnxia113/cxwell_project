import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KnowledgeService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'knowledge');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * 获取知识库树
   */
  async getTree(userId: string) {
    const all = await this.prisma.bizKnowledge.findMany({
      where: { delFlag: '0' },
      orderBy: { createTime: 'desc' }
    });

    // 过滤有权限查看的内容
    const visible: any[] = [];
    for (const item of all) {
      if (await this.hasPermission(item.id, userId, 'view')) {
        visible.push(item);
      }
    }

    return this.buildTree(visible, null);
  }

  /**
   * 构建树状结构
   */
  private buildTree(list: any[], parentId: bigint | null) {
    return list
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        id: item.id.toString(),
        parentId: item.parentId?.toString(),
        children: this.buildTree(list, item.id)
      }));
  }

  /**
   * 核心权限校验逻辑 (混合模式)
   * 1. 超管/本人 2. 外部共享(ACL) 3. 内部公开(Data Scope) 4. 层级继承
   */
  async hasPermission(id: bigint, userId: string, action: 'view' | 'edit' | 'admin'): Promise<boolean> {
    // 1. 超管 bypass
    if (userId === '1' || userId === 'admin') return true;

    const [item, user] = await Promise.all([
      this.prisma.bizKnowledge.findUnique({ where: { id } }),
      this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } })
    ]);

    const employee = await this.prisma.sysEmployee.findUnique({ where: { userId: BigInt(userId) } });

    if (!item || item.delFlag === '1') return false;

    // 2. 所有者
    if (item.createBy === user?.loginName) return true;

    // 3. 公开内容 (Everyone)
    if (item.visibilityType === 'everyone' && action === 'view') return true;

    // 4. 显性授权 (Specified ACL)
    const permissions = await this.prisma.bizKnowledgePermission.findMany({
      where: { knowledgeId: id }
    });

    const userRoleIds = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId) }
    }).then(list => list.map(r => r.roleId.toString()));

    for (const p of permissions) {
      let match = false;
      if (p.targetType === 'USER' && p.targetId === userId) match = true;
      if (p.targetType === 'DEPT' && p.targetId === user?.deptId?.toString()) match = true;
      if (p.targetType === 'ROLE' && userRoleIds.includes(p.targetId)) match = true;
      if (p.targetType === 'POST' && employee?.position === p.targetId) match = true;

      if (match) {
        if (action === 'view') return true;
        if (action === 'edit' && ['edit', 'admin'].includes(p.permission)) return true;
        if (action === 'admin' && p.permission === 'admin') return true;
      }
    }

    // 5. 内部公开 (Internal - Data Scope)
    if (item.visibilityType === 'internal') {
      const isVisible = await this.checkDataScope(user, action);
      if (isVisible) return true;
    }

    // 6. 继承逻辑 (Recursive)
    if (item.parentId) {
      return this.hasPermission(item.parentId, userId, action);
    }

    return false;
  }

  /**
   * 数据范围校验 (若依风格)
   */
  private async checkDataScope(user: any, action: string): Promise<boolean> {
    if (!user) return false;
    
    const roles = await this.prisma.sysUserRole.findMany({
      where: { userId: user.userId },
    }).then(async list => {
      const ids = list.map(r => r.roleId);
      return this.prisma.sysRole.findMany({ where: { roleId: { in: ids } } });
    });

    const scopes = roles.map(r => Number(r.dataScope));
    const maxScope = Math.min(...scopes);

    if (maxScope === 1) return true; // 全部数据
    if (maxScope === 2) return true; // 部门及以下 (简化处理，通常需要计算部门树)
    if (maxScope === 3) return true; // 仅本人 (已在前面处理过，这里兜底)

    return false;
  }

  /**
   * 创建内容
   */
  async create(data: any, userId: string) {
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    return this.prisma.bizKnowledge.create({
      data: {
        ...data,
        parentId: data.parentId ? BigInt(data.parentId) : null,
        createBy: user?.loginName,
      }
    });
  }

  /**
   * 更新内容 (含权限管理)
   */
  async update(id: string, data: any, userId: string) {
    if (!(await this.hasPermission(BigInt(id), userId, 'edit'))) {
      throw new ForbiddenException('您没有修改此内容的权限');
    }
    
    // 如果是更新权限设置
    if (data.permissions) {
      if (!(await this.hasPermission(BigInt(id), userId, 'admin'))) {
        throw new ForbiddenException('只有管理员或所有者可以更改权限');
      }
      // 级联处理权限表略 (将在 Controller 中通过事务调用，或者在此处简单实现)
    }

    const { permissions, ...rest } = data;
    return this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        parentId: rest.parentId ? BigInt(rest.parentId) : undefined,
      }
    });
  }

  /**
   * 删除
   */
  async delete(id: string, userId: string) {
    if (!(await this.hasPermission(BigInt(id), userId, 'admin'))) {
      throw new ForbiddenException('您没有删除此内容的权限');
    }
    return this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: { delFlag: '1' }
    });
  }

  /**
   * 存储权限设置 (用于管理弹窗)
   */
  async updatePermissions(id: bigint, permissions: any[]) {
    await this.prisma.bizKnowledgePermission.deleteMany({
      where: { knowledgeId: id }
    });

    if (permissions && permissions.length > 0) {
      await this.prisma.bizKnowledgePermission.createMany({
        data: permissions.map(p => ({
          knowledgeId: id,
          targetType: p.targetType,
          targetId: p.targetId.toString(),
          permission: p.permission
        }))
      });
    }
  }
}
