import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  private async isAdmin(userId: string, roleFromToken?: string): Promise<boolean> {
    if (roleFromToken === 'admin' || roleFromToken === 'general_manager') return true;
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

      return roles.some(r => r.roleKey === 'admin' || r.roleKey === 'general_manager');
    } catch {
      return false;
    }
  }

  async hasPermission(id: bigint, userId: string, action: 'view' | 'edit' | 'admin', roleFromToken?: string): Promise<boolean> {
    if (await this.isAdmin(userId, roleFromToken)) return true;

    const item = await this.prisma.bizKnowledge.findUnique({ where: { id } });
    if (!item || item.delFlag === '1') return false;

    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    if (user && item.createBy === user.loginName) return true;

    if (action !== 'view') return false;

    return this.checkViewPermission(item, userId, user);
  }

  private async checkViewPermission(item: any, userId: string, user: any): Promise<boolean> {
    if (item.visibilityType === 'everyone') return true;
    if (item.visibilityType === 'private') return false;

    if (item.visibilityType === 'specified') {
      const hasAcl = await this.checkAcl(item.id, userId, user);
      if (hasAcl) return true;
    }

    if (item.parentId) {
      const parent = await this.prisma.bizKnowledge.findUnique({ where: { id: item.parentId } });
      if (parent && parent.delFlag === '0') {
        return this.checkViewPermission(parent, userId, user);
      }
    }

    return false;
  }

  private async checkAcl(knowledgeId: bigint, userId: string, user: any): Promise<boolean> {
    const permissions = await this.prisma.bizKnowledgePermission.findMany({
      where: { knowledgeId },
    });

    if (permissions.length === 0) return false;

    const employee = await this.prisma.sysEmployee.findUnique({
      where: { userId: BigInt(userId) },
    }).catch(() => null);

    for (const p of permissions) {
      if (p.targetType === 'USER') {
        if (p.targetId === userId) return true;
        if (employee?.employeeId && p.targetId === employee.employeeId.toString()) return true;
      }

      if (p.targetType === 'DEPT') {
        if (user?.deptId && p.targetId === user.deptId.toString()) return true;
        if (employee?.deptId && p.targetId === employee.deptId.toString()) return true;
      }
    }

    return false;
  }

  async getTree(userId: string, roleFromToken?: string) {
    const isAdminUser = await this.isAdmin(userId, roleFromToken);

    const all = await this.prisma.bizKnowledge.findMany({
      where: { delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });

    if (isAdminUser) {
      return this.buildTree(all, null);
    }

    const visible: any[] = [];
    for (const item of all) {
      const hasPerm = await this.hasPermission(item.id, userId, 'view', roleFromToken);
      if (hasPerm) {
        visible.push(item);
      }
    }

    return this.buildTree(visible, null);
  }

  private buildTree(list: any[], parentId: bigint | null) {
    return list
      .filter(item => item.parentId === parentId)
      .map(item => ({
        id: item.id.toString(),
        title: item.title,
        type: item.type,
        isFolder: item.isFolder,
        parentId: item.parentId?.toString() || null,
        fileUrl: item.fileUrl,
        fileSize: item.fileSize,
        fileType: item.fileType,
        visibilityType: item.visibilityType || 'everyone',
        createBy: item.createBy || '',
        createTime: item.createTime,
        updateTime: item.updateTime,
        delFlag: item.delFlag,
        children: this.buildTree(list, item.id),
      }));
  }

  async create(data: any, userId: string, roleFromToken?: string) {
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });

    const { permissions, ...rest } = data;

    const created = await this.prisma.bizKnowledge.create({
      data: {
        title: rest.title,
        type: rest.type || 'Document',
        isFolder: rest.isFolder === true || rest.isFolder === 'true',
        parentId: (rest.parentId && rest.parentId !== 'null' && rest.parentId !== 'undefined') ? BigInt(rest.parentId) : null,
        visibilityType: rest.visibilityType || 'everyone',
        createBy: user?.loginName,
        fileUrl: rest.fileUrl || null,
        fileSize: rest.fileSize || null,
        fileType: rest.fileType || null,
      },
    });

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
      id: created.id.toString(),
      title: created.title,
      type: created.type,
      isFolder: created.isFolder,
      parentId: created.parentId?.toString() || null,
      visibilityType: created.visibilityType,
      createBy: created.createBy,
      createTime: created.createTime,
    };
  }

  async update(id: string, data: any, userId: string, roleFromToken?: string) {
    if (!(await this.hasPermission(BigInt(id), userId, 'edit', roleFromToken))) {
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

  async delete(id: string, userId: string, roleFromToken?: string) {
    const item = await this.prisma.bizKnowledge.findUnique({ where: { id: BigInt(id) } });
    if (!item) throw new NotFoundException('内容不存在');

    const isAdminUser = await this.isAdmin(userId, roleFromToken);
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

  async updatePermissions(id: bigint, visibilityType: string, permissions: any[], userId: string, roleFromToken?: string) {
    const item = await this.prisma.bizKnowledge.findUnique({ where: { id } });
    if (!item || item.delFlag === '1') {
      throw new NotFoundException('内容不存在');
    }

    const isAdminUser = await this.isAdmin(userId, roleFromToken);
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    const isOwner = user && item.createBy === user.loginName;

    if (!isAdminUser && !isOwner) {
      throw new ForbiddenException('只有管理员或创建人可以修改权限');
    }

    await this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: { visibilityType },
    });

    await this.prisma.bizKnowledgePermission.deleteMany({
      where: { knowledgeId: BigInt(id) },
    });

    if (permissions && permissions.length > 0 && visibilityType === 'specified') {
      await this.prisma.bizKnowledgePermission.createMany({
        data: permissions.map(p => ({
          knowledgeId: BigInt(id),
          targetType: p.targetType,
          targetId: p.targetId.toString(),
          permission: p.permission || 'view',
        })),
      });
    }

    return { success: true };
  }

  async transferOwner(id: bigint, newOwnerLoginName: string, userId: string, roleFromToken?: string) {
    const item = await this.prisma.bizKnowledge.findUnique({ where: { id } });
    if (!item || item.delFlag === '1') {
      throw new NotFoundException('内容不存在');
    }

    const isAdminUser = await this.isAdmin(userId, roleFromToken);
    const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(userId) } });
    const isOwner = user && item.createBy === user.loginName;

    if (!isAdminUser && !isOwner) {
      throw new ForbiddenException('只有管理员或创建人可以转让所有权');
    }

    const newOwner = await this.prisma.sysUser.findFirst({
      where: { loginName: newOwnerLoginName, delFlag: '0' },
    });
    if (!newOwner) {
      throw new NotFoundException('目标用户不存在');
    }

    await this.prisma.bizKnowledge.update({
      where: { id: BigInt(id) },
      data: { createBy: newOwner.loginName },
    });

    return { success: true, newOwner: newOwner.loginName };
  }
}
