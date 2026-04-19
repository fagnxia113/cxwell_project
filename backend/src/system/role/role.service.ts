import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CasbinService } from '../../auth/casbin.service';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private casbinService: CasbinService,
  ) {}

  /**
   * 获取所有角色
   */
  async findAll() {
    return this.prisma.sysRole.findMany({
      where: { delFlag: '0' },
      orderBy: { roleSort: 'asc' },
    });
  }

  /**
   * 创建角色
   */
  async create(data: any) {
    return this.prisma.sysRole.create({
      data: {
        ...data,
        createTime: new Date(),
      }
    });
  }

  /**
   * 更新角色
   */
  async update(roleId: string, data: any) {
    return this.prisma.sysRole.update({
      where: { roleId: BigInt(roleId) },
      data: { ...data, updateTime: new Date() }
    });
  }

  /**
   * 获取角色的菜单 ID 列表
   */
  async getRoleMenuIds(roleId: string) {
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: BigInt(roleId) }
    });
    return roleMenus.map(rm => rm.menuId.toString());
  }

  /**
   * 更新角色权限信息 (菜单关联与 Casbin 策略)
   */
  async updateRolePermissions(roleId: string, menuIds: string[]) {
    const id = BigInt(roleId);
    
    // 1. 获取角色基本信息 (用于 Casbin 角色 Key)
    const role = await this.prisma.sysRole.findUnique({ where: { roleId: id } });
    if (!role) throw new NotFoundException('角色不存在');

    // 2. 清理旧的 SysRoleMenu 关联
    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: id } });

    // 3. 建立新的 SysRoleMenu 关联
    if (menuIds.length > 0) {
      await this.prisma.sysRoleMenu.createMany({
        data: menuIds.map(mId => ({
          roleId: id,
          menuId: BigInt(mId)
        }))
      });
    }

    // 4. 同步 Casbin 策略 (基于菜单权限 perms 字段)
    // 首先移除该角色的所有策略
    await this.casbinService.enforcer.removeFilteredPolicy(0, role.roleKey);
    
    // 获取所有选中菜单的 perms 字段
    const selectedMenus = await this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: menuIds.map(mId => BigInt(mId)) },
        perms: { not: null, notIn: [''] }
      }
    });

    // 注入新的策略
    for (const menu of selectedMenus) {
      // 假设 perms 是类似 "system:user:list" 的字符串，我们可以将其直接作为 Casbin 的资源（Object）
      // 动作（Action）默认为 read 或者根据 menuId 动态判定，这里简化为 "read"
      await this.casbinService.enforcer.addPolicy(role.roleKey, menu.perms!, 'read');
    }

    // 保存策略到数据库并重载
    await this.casbinService.enforcer.savePolicy();
    
    return true;
  }

  /**
   * 逻辑删除角色
   */
  async remove(roleId: string) {
    const id = BigInt(roleId);
    // 同时清理 Casbin 关联
    const role = await this.prisma.sysRole.findUnique({ where: { roleId: id } });
    if (role) {
      await this.casbinService.enforcer.removeFilteredPolicy(0, role.roleKey);
      await this.casbinService.enforcer.savePolicy();
    }

    return this.prisma.sysRole.update({
      where: { roleId: id },
      data: { delFlag: '2' }
    });
  }
}
