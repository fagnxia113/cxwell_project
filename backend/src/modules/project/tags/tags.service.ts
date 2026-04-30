import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private async checkUserProjectRole(projectId: bigint, user: any): Promise<'manager' | 'member' | null> {
    const userId = user?.sub || user?.userId;
    if (!userId) return null;

    if (userId === '1' || userId === 1 || user?.role === 'admin' || user?.role === 'general_manager') return 'manager';

    const project = await this.prisma.project.findUnique({
      where: { projectId },
      select: { managerId: true }
    });

    const employee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(userId) },
      select: { employeeId: true }
    });

    if (project?.managerId && employee && project.managerId.toString() === employee.employeeId.toString()) {
      return 'manager';
    }

    if (employee) {
      const membership = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          employeeId: employee.employeeId
        }
      });
      if (membership) return 'member';
    }

    return null;
  }

  async findAll(projectId: bigint) {
    const tags = await this.prisma.projectTag.findMany({
      where: { projectId },
      orderBy: { createTime: 'desc' },
    });
    return tags.map(tag => this.mapTag(tag));
  }

  async create(data: {
    projectId: bigint;
    milestoneId?: bigint;
    tagType: string;
    systemType?: string;
    requiredCount: number;
    taggedCount?: number;
    verifiedCount?: number;
    abnormalCount?: number;
  }, user: any) {
    const role = await this.checkUserProjectRole(data.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以创建标签');
    }

    const tag = await this.prisma.projectTag.create({
      data: {
        projectId: data.projectId,
        milestoneId: data.milestoneId || null,
        tagType: data.tagType,
        systemType: data.systemType || null,
        requiredCount: data.requiredCount,
        taggedCount: data.taggedCount || 0,
        verifiedCount: data.verifiedCount || 0,
        abnormalCount: data.abnormalCount || 0,
        status: 'pending',
      },
    });
    return this.mapTag(tag);
  }

  async update(id: bigint, data: {
    tagType?: string;
    systemType?: string;
    requiredCount?: number;
    taggedCount?: number;
    verifiedCount?: number;
    abnormalCount?: number;
    milestoneId?: bigint;
  }, user: any) {
    const tag = await this.prisma.projectTag.findUnique({ where: { id } });
    if (!tag) return null;

    const role = await this.checkUserProjectRole(tag.projectId, user);
    if (role === null) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const updateData: any = { ...data };
    if (data.tagType !== undefined) updateData.tagType = data.tagType;
    if (data.systemType !== undefined) updateData.systemType = data.systemType;
    if (data.requiredCount !== undefined) updateData.requiredCount = data.requiredCount;
    if (data.taggedCount !== undefined) updateData.taggedCount = data.taggedCount;
    if (data.verifiedCount !== undefined) updateData.verifiedCount = data.verifiedCount;
    if (data.abnormalCount !== undefined) updateData.abnormalCount = data.abnormalCount;
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId;

    const updated = await this.prisma.projectTag.update({
      where: { id },
      data: updateData,
    });
    return this.mapTag(updated);
  }

  async remove(id: bigint, user: any) {
    const tag = await this.prisma.projectTag.findUnique({ where: { id } });
    if (!tag) return null;

    const role = await this.checkUserProjectRole(tag.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以删除标签');
    }

    await this.prisma.projectTag.delete({ where: { id } });
    return { success: true };
  }

  private mapTag(tag: any) {
    return {
      ...tag,
      id: tag.id.toString(),
      projectId: tag.projectId.toString(),
      milestone_id: tag.milestoneId?.toString() || null,
      milestoneId: tag.milestoneId?.toString() || null,
      tag_type: tag.tagType,
      system_type: tag.systemType,
      required_count: tag.requiredCount,
      tagged_count: tag.taggedCount,
      verified_count: tag.verifiedCount,
      abnormal_count: tag.abnormalCount,
      last_update_time: tag.updateTime || tag.last_update_time,
    };
  }
}
