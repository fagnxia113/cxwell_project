import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CasbinService } from './casbin.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private casbinService: CasbinService,
  ) {}

  /**
   * 校验用户合法性
   */
  async validateUser(loginName: string, pass: string): Promise<any> {
    const user = await this.prisma.sysUser.findFirst({
      where: { loginName, delFlag: '0' },
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      // 这里的 user.roleKey 假设在 sys_user 中已有（或通过关联查询）
      // 实际上 sys_user 关联 sys_role，这里简化演示取第一个有效角色
      const userWithRoles = await this.prisma.sysUserRole.findFirst({
        where: { userId: user.userId },
      });
      
      // 硬核判定：如果是内置 ID 为 1 的用户，强制赋予 admin 角色
      const role = (user.userId === 1n || userWithRoles) ? 'admin' : 'user';

      const { password, ...result } = user;
      // 同时返回 role 和 roleKey 以确保前后端字段兼容性
      return { ...result, role, roleKey: role };
    }
    return null;
  }

  /**
   * 登录成功签发 Token
   */
  async login(user: any) {
    const payload = { 
      loginName: user.loginName, 
      sub: user.userId.toString(), 
      role: user.roleKey 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * 获取当前用户的动态权限码集
   */
  async getUserPermissions(roleKey: string) {
    // 如果是超级管理员，直接赋予通配符权限，绕过显式策略检查
    if (roleKey === 'admin') {
      return {
        permissions: ['*'],
        menuPermissions: ['*'],
      };
    }

    // Casbin: 获取该角色的所有权限
    const policies = await this.casbinService.enforcer.getImplicitPermissionsForUser(`role:${roleKey}`);
    const permissions = policies.map(p => p[1]);
    
    return {
      permissions,
      menuPermissions: permissions.filter(p => p.startsWith('menu:')),
    };
  }
}
