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
      // 查询用户关联的角色
      const userRoleRelation = await this.prisma.sysUserRole.findFirst({
        where: { userId: user.userId },
      });

      let roleKey = 'user'; // 默认角色

      if (user.userId === 1n) {
        roleKey = 'admin'; // 内置管理员强制为 admin
      } else if (userRoleRelation) {
        // 查询具体的角色 Key
        const role = await this.prisma.sysRole.findUnique({
          where: { roleId: userRoleRelation.roleId },
        });
        if (role) {
          roleKey = role.roleKey;
        }
      }

      const { password, ...result } = user;

      // 查询关联的员工ID
      let employee_id: string | undefined;
      const employee = await this.prisma.sysEmployee.findFirst({
        where: { userId: user.userId },
        select: { employeeId: true }
      });
      if (employee) {
        employee_id = employee.employeeId.toString();
      }

      // 获取关联权限集
      const permissionsData = await this.getUserPermissions(roleKey);

      // 字段映射：将数据库的 userName 映射为前端期望的 name
      // 并返回双重字段 role 和 roleKey 以确保兼容性
      return {
        ...result,
        id: user.userId.toString(),
        username: user.loginName,
        name: user.userName,
        role: roleKey,
        roleKey: roleKey,
        employee_id,
        ...permissionsData
      };
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
    if (roleKey === 'admin') {
      return {
        permissions: ['*'],
        menuPermissions: ['*'],
        buttonPermissions: ['*'],
      };
    }

    const casbinRole = `role:${roleKey}`;
    const policies = await this.casbinService.enforcer.getImplicitPermissionsForUser(casbinRole);
    const allPerms = policies
      .filter(p => p[2] === 'allow' || p[2] === '*')
      .map(p => p[1]);

    const menuPerms = allPerms.filter(p => p.startsWith('menu:'));
    const buttonPerms = allPerms.filter(p => !p.startsWith('menu:') && p !== '*');

    return {
      permissions: allPerms,
      menuPermissions: menuPerms,
      buttonPermissions: buttonPerms,
    };
  }
}
