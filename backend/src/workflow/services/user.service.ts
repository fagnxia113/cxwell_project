import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlowUser } from '@prisma/client';

/**
 * 流程用户服务
 */
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取流程用户
   */
  async getUser(id: bigint): Promise<FlowUser> {
    const user = await this.prisma.flowUser.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('流程用户不存在');
    }
    return user;
  }

  /**
   * 根据关联ID获取用户列表
   */
  async getUsersByAssociated(associated: bigint): Promise<FlowUser[]> {
    return this.prisma.flowUser.findMany({ where: { associated } });
  }

  /**
   * 根据用户ID获取用户列表
   */
  async getUsersByProcessedBy(processedBy: string): Promise<FlowUser[]> {
    return this.prisma.flowUser.findMany({ where: { processedBy } });
  }

  /**
   * 创建流程用户
   */
  async createUser(data: {
    type: string;
    processedBy: string;
    associated: bigint;
    createBy: string;
  }): Promise<FlowUser> {
    return this.prisma.flowUser.create({
      data: {
        id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)),
        type: data.type,
        processedBy: data.processedBy,
        associated: data.associated,
        createBy: data.createBy,
        createTime: new Date(),
        delFlag: '0',
      }
    });
  }

  /**
   * 批量创建流程用户
   */
  async createUsers(users: Array<{
    type: string;
    processedBy: string;
    associated: bigint;
    createBy: string;
  }>): Promise<{ count: number }> {
    const flowUsers = users.map((user, index) => ({
      id: BigInt(Date.now()) + BigInt(index) + BigInt(Math.floor(Math.random() * 1000)),
      type: user.type,
      processedBy: user.processedBy,
      associated: user.associated,
      createBy: user.createBy,
      createTime: new Date(),
      delFlag: '0',
    }));
    return this.prisma.flowUser.createMany({ data: flowUsers });
  }

  /**
   * 删除流程用户
   */
  async deleteUser(id: bigint): Promise<FlowUser> {
    return this.prisma.flowUser.delete({ where: { id } });
  }

  /**
   * 根据关联ID删除流程用户
   */
  async deleteUsersByAssociated(associated: bigint): Promise<{ count: number }> {
    return this.prisma.flowUser.deleteMany({ where: { associated } });
  }

  /**
   * 获取任务的处理人
   */
  async getTaskProcessors(taskId: bigint): Promise<string[]> {
    const users = await this.prisma.flowUser.findMany({ where: { associated: taskId, type: '1' } });
    return users.map(user => user.processedBy).filter((user): user is string => user !== null);
  }

  /**
   * 检查用户是否是任务的处理人
   */
  async isTaskProcessor(taskId: bigint, userId: string): Promise<boolean> {
    const count = await this.prisma.flowUser.count({ where: { associated: taskId, processedBy: userId, type: '1' } });
    return count > 0;
  }
}