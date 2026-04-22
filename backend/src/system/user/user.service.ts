import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 查询用户列表 (含分页/筛选可选，本版本为管理台全量)
   */
  async findAll() {
    const users = await this.prisma.sysUser.findMany({
      where: { delFlag: '0' },
      select: {
        userId: true,
        loginName: true,
        userName: true,
        email: true,
        phonenumber: true,
        status: true,
        createTime: true,
        deptId: true,
      },
      orderBy: { createTime: 'desc' }
    });

    // 批量查询角色映射信息
    const userIds = users.map(u => u.userId);
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId: { in: userIds } }
    });

    if (userRoles.length > 0) {
        const roleIds = [...new Set(userRoles.map(ur => ur.roleId))];
        const roles = await this.prisma.sysRole.findMany({
            where: { roleId: { in: roleIds } }
        });

        // 将角色信息挂载到用户对象上
        return users.map(user => {
            const myRoleIds = userRoles.filter(ur => ur.userId === user.userId).map(ur => ur.roleId);
            const myRoles = roles.filter(r => myRoleIds.includes(r.roleId));
            return {
                ...user,
                roles: myRoles.map(r => ({ roleId: r.roleId.toString(), roleName: r.roleName, roleKey: r.roleKey }))
            };
        });
    }

    return users.map(user => ({ ...user, roles: [] }));
  }

  /**
   * 根据ID查询用户
   */
  async findById(userId: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) }
    });
    if (!user) return null;

    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId: user.userId }
    });

    const roles = await this.prisma.sysRole.findMany({
      where: { roleId: { in: userRoles.map(ur => ur.roleId) } }
    });

    return {
      ...user,
      roles: roles.map(r => ({ roleId: r.roleId.toString(), roleName: r.roleName, roleKey: r.roleKey }))
    };
  }

  /**
   * 创建用户
   */
  async create(data: any) {
    const { loginName, password, roleId, roleIds, ...rest } = data;

    // 检查账号冲突
    const existing = await this.prisma.sysUser.findUnique({
      where: { loginName }
    });
    if (existing) {
      throw new ConflictException('登录账号已存在');
    }

    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.sysUser.create({
        data: {
          ...rest,
          loginName,
          password: hashedPassword,
          createTime: new Date(),
        }
      });

      // 处理角色分配
      const targetRoleIds: bigint[] = [];
      if (roleId) targetRoleIds.push(BigInt(roleId));
      if (Array.isArray(roleIds)) {
        roleIds.forEach(id => targetRoleIds.push(BigInt(id)));
      }

      if (targetRoleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: [...new Set(targetRoleIds)].map(rId => ({
            userId: user.userId,
            roleId: rId
          }))
        });
      }

      return user;
    });
  }
  /**
   * 更新用户
   */
  async update(userId: string, data: any) {
    const id = BigInt(userId);
    const { password, roleId, roleIds, ...rest } = data;

    // 过滤掉前端可能多传的、数据库模型中不存在或不应直接更新的字段
    const { 
      userId: _userId, 
      name: _name, 
      role: _role, 
      roleKey: _roleKey, 
      ...sanitizedRest 
    } = rest;

    // 转换日期和其他必要的字段
    const updateData: any = { ...sanitizedRest, updateTime: new Date() };
    
    // 特殊字段强制转换：deptId 必须是 BigInt
    if (updateData.deptId) {
      updateData.deptId = BigInt(updateData.deptId);
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. 更新用户信息
      const user = await tx.sysUser.update({
        where: { userId: id },
        data: updateData
      });

      // 2. 更新角色分配 (先删后加)
      const targetRoleIds: bigint[] = [];
      if (roleId) targetRoleIds.push(BigInt(roleId));
      if (Array.isArray(roleIds)) {
        roleIds.forEach(rid => targetRoleIds.push(BigInt(rid)));
      }

      // 如果传了角色信息，则进行同步
      if (roleId || roleIds) {
        await tx.sysUserRole.deleteMany({ where: { userId: id } });
        if (targetRoleIds.length > 0) {
          await tx.sysUserRole.createMany({
            data: [...new Set(targetRoleIds)].map(rid => ({
              userId: id,
              roleId: rid
            }))
          });
        }
      }

      return user;
    });
  }

  /**
   * 重置密码 (管理员强制)
   */
  async resetPassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { password: hashedPassword, updateTime: new Date() }
    });
  }

  /**
   * 逻辑删除
   */
  async remove(userId: string) {
    return this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { delFlag: '2', updateTime: new Date() } // 2 通常表示已删除
    });
  }

  /**
   * 修改状态
   */
  async updateStatus(userId: string, status: string) {
    return this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { status, updateTime: new Date() }
    });
  }
}
