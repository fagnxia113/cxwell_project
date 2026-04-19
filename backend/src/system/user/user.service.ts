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
    return this.prisma.sysUser.findMany({
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
  }

  /**
   * 创建用户
   */
  async create(data: any) {
    const { loginName, password, ...rest } = data;

    // 检查账号冲突
    const existing = await this.prisma.sysUser.findUnique({
      where: { loginName }
    });
    if (existing) {
      throw new ConflictException('登录账号已存在');
    }

    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.sysUser.create({
      data: {
        ...rest,
        loginName,
        password: hashedPassword,
        createTime: new Date(),
      }
    });
  }

  /**
   * 更新用户
   */
  async update(userId: string, data: any) {
    const id = BigInt(userId);
    const { password, ...rest } = data;

    // 如果提供了新密码，则重新哈希
    const updateData: any = { ...rest, updateTime: new Date() };
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.sysUser.update({
      where: { userId: id },
      data: updateData
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
