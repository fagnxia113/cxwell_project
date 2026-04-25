import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  // ─── 管理员判断 ───────────────────────────────────────
  /**
   * 判断用户是否为系统管理员
   * 通过角色表查询，不再硬编码 userId
   */
  private async isAdmin(userId: string): Promise<boolean> {
    // userId '1' 是系统内置超管，保留兼容
    if (userId === '1') return true;

    try {
      const userRoles = await this.prisma.sysUserRole.findMany({
        where: { userId: BigInt(userId) },
      });
      if (userRoles.length === 0) return false;

      const roles = await this.prisma.sysRole.findMany({
        where: {
          roleId: { in: userRoles.map(r => r.roleId) },
          delFlag: '0',
        },
      });

      return roles.some(r => r.roleKey === 'admin' || r.roleKey === 'root');
    } catch {
      return false;
    }
  }

  // ─── 核心权限校验 ─────────────────────────────────────
  /**
   * 权限检查流程（简化版）:
   * 1. 管理员 → 全部放行
   * 2. 创建人 → 全部放行
   * 3. visibilityType = 'everyone' → 可见
   * 4. visibilityType = 'private' → 不可见（仅创建人/管理员）
   * 5. visibilityType = 'specified' → 查 ACL 表
   * 6. 以上均不匹配 → 向上递归查父级
   */
  async hasPermission(id: bigint, userId: string, action: 'view' | 'edit' | 'admin'): Promise<boolean> {
    // 1. 管理员 bypass
    if (await this.isAdmin(userId)) return true;

    const item = await this.prisma.bizKnowledge.findUnique({ where: { id } });
    if (!item || item.delFlag === '1') return false;

    // 2. 创建人
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    if (user && item.createBy === user.loginName) return true;

    // 对于非 view 操作，只有管理员和创建人可以执行
    if (action !== 'view') return false;

    // 以下仅处理 view 权限
    return this.checkViewPermission(item, userId, user);
  }

  /**
   * 检查 view 权限（递归）
   */
  private async checkViewPermission(item: any, userId: string, user: any): Promise<boolean> {
    // 3. 全部可见
    if (item.visibilityType === 'everyone') return true;

    // 4. 仅创建人可见（已在上层检查过创建人，到这里说明不是创建人）
    if (item.visibilityType === 'private') return false;

    // 5. 指定可见 → 查 ACL
    if (item.visibilityType === 'specified') {
      const hasAcl = await this.checkAcl(item.id, userId, user);
      if (hasAcl) return true;
    }

    // 6. 向上递归（文件继承父目录权限）
    if (item.parentId) {
      const parent = await this.prisma.bizKnowledge.findUnique({ where: { id: item.parentId } });
      if (parent && parent.delFlag === '0') {
        return this.checkViewPermission(parent, userId, user);
      }
    }

    return false;
  }

  /**
   * ACL 权限检查（USER / DEPT 匹配）
   */
  private async checkAcl(knowledgeId: bigint, userId: string, user: any): Promise<boolean> {
    const permissions = await this.prisma.bizKnowledgePermission.findMany({
      where: { knowledgeId },
    });

    if (permissions.length === 0) return false;

    // 获取用户的部门信息
    const employee = await this.prisma.sysEmployee.findUnique({
      where: { userId: BigInt(userId) },
    }).catch(() => null);

    for (const p of permissions) {
      // 用户维度匹配
      if (p.targetType === 'USER' && p.targetId === userId) return true;

      // 部门维度匹配
      if (p.targetType === 'DEPT') {
        if (user?.deptId && p.targetId === user.deptId.toString()) return true;
        if (employee?.deptId && p.targetId === employee.deptId.toString()) return true;
      }
    }

    return false;
  }

  // ─── 获取知识库树 ─────────────────────────────────────
  /**
   * 获取知识库树（含权限过滤）
   */
  async getTree(userId: string) {
    const isAdminUser = await this.isAdmin(userId);

    const all = await this.prisma.bizKnowledge.findMany({
      where: { delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });

    // 管理员直接返回全部
    if (isAdminUser) {
      return this.buildTree(all, null);
    }

    // 普通用户过滤有权限查看的内容
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
        parentId: item.parentId?.toString() || null,
        visibilityType: item.visibilityType || 'everyone',
        createBy: item.createBy || '',
        children: this.buildTree(list, item.id),
      }));
  }

  // ─── 创建 ─────────────────────────────────────────────
  /**
   * 创建知识库内容（含权限存储）
   */
  async create(data: any, userId: string) {
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });

    const { permissions, ...rest } = data;

    const created = await this.prisma.bizKnowledge.create({
      data: {
        ...rest,
        parentId: rest.parentId ? BigInt(rest.parentId) : null,
        visibilityType: rest.visibilityType || 'everyone',
        createBy: user?.loginName,
      },
    });

    // 如果有权限设置且是文件夹，存储到权限表
    if (permissions && Array.isArray(permissions) && permissions.length > 0 && rest.isFolder) {
      await this.prisma.bizKnowledgePermission.createMany({
        data: permissions.map((p: any) => ({
          knowledgeId: created.id,
          targetType: p.targetType,
          targetId: p.targetId.toString(),
          permission: p.permission || 'view',
        })),
      });
    }

    return {
      ...created,
      id: created.id.toString(),
      parentId: created.parentId?.toString() || null,
    };
  }

  // ─── 更新 ─────────────────────────────────────────────
  /**
   * 更新知识库内容
   */
  async update(id: string, data: any, userId: string) {
    if (!(await this.hasPermission(BigInt(id), userId, 'edit'))) {
      throw new ForbiddenException('您没有修改此内容的权限');
    }

    const { permissions, ...rest } = data;
    return this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        parentId: rest.parentId ? BigInt(rest.parentId) : undefined,
      },
    });
  }

  // ─── 删除 ─────────────────────────────────────────────
  /**
   * 软删除（管理员或创建人）
   */
  async delete(id: string, userId: string) {
    const item = await this.prisma.bizKnowledge.findUnique({ where: { id: BigInt(id) } });
    if (!item) throw new NotFoundException('内容不存在');

    const isAdminUser = await this.isAdmin(userId);
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    const isOwner = user && item.createBy === user.loginName;

    if (!isAdminUser && !isOwner) {
      throw new ForbiddenException('只有管理员或创建人可以删除');
    }

    return this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: { delFlag: '1' },
    });
  }

  // ─── 权限管理 ─────────────────────────────────────────
  /**
   * 获取节点的权限配置
   */
  async getPermissions(id: string) {
    const item = await this.prisma.bizKnowledge.findUnique({
      where: { id: BigInt(id) },
    });
    if (!item || item.delFlag === '1') {
      throw new NotFoundException('内容不存在');
    }

    const permissions = await this.prisma.bizKnowledgePermission.findMany({
      where: { knowledgeId: BigInt(id) },
    });

    return {
      id: item.id.toString(),
      title: item.title,
      isFolder: item.isFolder,
      visibilityType: item.visibilityType,
      createBy: item.createBy,
      permissions: permissions.map(p => ({
        id: p.id.toString(),
        targetType: p.targetType,
        targetId: p.targetId,
        permission: p.permission,
      })),
    };
  }

  /**
   * 更新节点的权限配置（管理员或创建人）
   */
  async updatePermissions(id: bigint, visibilityType: string, permissions: any[], userId: string) {
    const item = await this.prisma.bizKnowledge.findUnique({ where: { id } });
    if (!item || item.delFlag === '1') {
      throw new NotFoundException('内容不存在');
    }

    // 只有管理员或创建人可以修改权限
    const isAdminUser = await this.isAdmin(userId);
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    const isOwner = user && item.createBy === user.loginName;

    if (!isAdminUser && !isOwner) {
      throw new ForbiddenException('只有管理员或创建人可以修改权限');
    }

    // 更新 visibilityType
    await this.prisma.bizKnowledge.update({
      where: { id },
      data: { visibilityType },
    });

    // 清除旧权限，写入新权限
    await this.prisma.bizKnowledgePermission.deleteMany({
      where: { knowledgeId: id },
    });

    if (permissions && permissions.length > 0 && visibilityType === 'specified') {
      await this.prisma.bizKnowledgePermission.createMany({
        data: permissions.map(p => ({
          knowledgeId: id,
          targetType: p.targetType,
          targetId: p.targetId.toString(),
          permission: p.permission || 'view',
        })),
      });
    }

    return { success: true };
  }
}
