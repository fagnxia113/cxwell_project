import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestoneService {
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

  async saveMilestones(projectId: bigint, milestones: any[], user: any) {
    const role = await this.checkUserProjectRole(projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以编辑里程碑');
    }
    // 获取项目当前的里程碑
    const existingMilestones = await this.prisma.projectMilestone.findMany({
      where: { projectId },
    });

    // 扁平化所有里程碑（包括子里程碑）
    const flatMilestones = this.flattenMilestones(milestones);

    // 收集所有 ID 用于判断删除
    const milestoneIds = flatMilestones.map(m => m.id).filter(id => id && !id.toString().startsWith('temp_'));
    const toDelete = existingMilestones.filter(
      em => !milestoneIds.includes(em.id.toString())
    );

    // 删除不再存在的里程碑
    if (toDelete.length > 0) {
      await this.prisma.projectMilestone.deleteMany({
        where: {
          id: { in: toDelete.map(m => m.id) },
        },
      });
    }

    // 递归保存所有里程碑
    await this.saveMilestoneRecursive(projectId, milestones, null);

    // 同步项目总进度
    await this.syncProjectProgress(projectId);

    return { saved: true };
  }

  private flattenMilestones(milestones: any[], result: any[] = []): any[] {
    for (const m of milestones) {
      result.push(m);
      if (m.children && m.children.length > 0) {
        this.flattenMilestones(m.children, result);
      }
    }
    return result;
  }

  private async saveMilestoneRecursive(projectId: bigint, milestones: any[], parentId: bigint | null) {
    for (const milestone of milestones) {
      const data: any = {
        projectId,
        name: milestone.name || '未命名',
        description: milestone.description || null,
        plannedStartDate: milestone.planned_start_date ? new Date(milestone.planned_start_date) : null,
        plannedEndDate: milestone.planned_end_date ? new Date(milestone.planned_end_date) : null,
        plannedDate: milestone.planned_start_date ? new Date(milestone.planned_start_date) : null, // 保持旧字段兼容
        actualDate: milestone.actual_end_date ? new Date(milestone.actual_end_date) : null,
        status: milestone.status === 'completed' ? '1' : (milestone.status === 'in_progress' ? '2' : '0'),
        weight: milestone.weight || 0,
        progress: milestone.progress || 0,
        parentId: parentId,
      };

      let savedId: bigint;

      if (milestone.id && milestone.id.toString().startsWith('temp_')) {
        // 临时 ID 的为新建
        const created = await this.prisma.projectMilestone.create({ data });
        savedId = created.id;
      } else if (milestone.id) {
        // 更新已有里程碑
        await this.prisma.projectMilestone.update({
          where: { id: BigInt(milestone.id) },
          data,
        });
        savedId = BigInt(milestone.id);
      } else {
        // 新建里程碑
        const created = await this.prisma.projectMilestone.create({ data });
        savedId = created.id;
      }

      // 递归保存子里程碑
      if (milestone.children && milestone.children.length > 0) {
        await this.saveMilestoneRecursive(projectId, milestone.children, savedId);
      }
    }
  }

  async updateProgress(id: bigint, progress: number, status?: string) {
    const currentMilestone = await this.prisma.projectMilestone.findUnique({
      where: { id },
      select: { projectId: true, parentId: true }
    });

    if (!currentMilestone) return { success: false };

    const data: any = { progress };
    // 自动更新里程碑状态
    if (status) {
      data.status = status === 'completed' ? '1' : (status === 'in_progress' ? '2' : '0');
    } else if (progress >= 100) {
      // 进度100%自动设为已完成
      data.status = '1';
    } else if (progress > 0) {
      // 进度>0且<100%自动设为进行中
      data.status = '2';
    }

    // 1. 更新当前里程碑
    await this.prisma.projectMilestone.update({
      where: { id },
      data,
    });

    // 2. 递归同步父级进度
    if (currentMilestone.parentId) {
      await this.syncParentProgress(currentMilestone.parentId);
    }

    // 3. 同步项目总进度
    await this.syncProjectProgress(currentMilestone.projectId);

    return { success: true };
  }

  // 递归同步父级里程碑进度
  private async syncParentProgress(parentId: bigint) {

    
    const parent = await this.prisma.projectMilestone.findUnique({
      where: { id: parentId },
      include: { children: true }
    });

    if (!parent) {

      return;
    }
    
    if (!parent.children || parent.children.length === 0) {

      return;
    }

    // 计算加权平均进度
    const totalWeight = parent.children.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    let newProgress = 0;
    




    if (totalWeight > 0) {
      const weightedSum = parent.children.reduce((sum, c) => sum + ((Number(c.progress) || 0) * (Number(c.weight) || 0)), 0);
      newProgress = Math.round(weightedSum / totalWeight);

    } else {
      // 如果没有权重，则计算简单平均
      const simpleSum = parent.children.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
      newProgress = Math.round(simpleSum / parent.children.length);

    }

    // 确定新状态
    let newStatus = parent.status;
    if (newProgress === 100) {
      newStatus = '1'; // 已完成
    } else if (newProgress > 0) {
      newStatus = '2'; // 进行中
    } else {
      newStatus = '0'; // 未开始
    }



    // 更新父级进度和状态
    await this.prisma.projectMilestone.update({
      where: { id: parentId },
      data: { 
        progress: newProgress,
        status: newStatus
      }
    });


    // 继续向上同步（递归处理祖父级）
    if (parent.parentId) {

      await this.syncParentProgress(parent.parentId);
    } else {

    }
  }

  // 同步项目总进度
  private async syncProjectProgress(projectId: bigint) {

    const rootMilestones = await this.prisma.projectMilestone.findMany({
      where: {
        projectId,
        parentId: null
      }
    });




    if (rootMilestones.length === 0) return;

    const totalWeight = rootMilestones.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
    let projectProgress = 0;

    if (totalWeight > 0) {
      const weightedSum = rootMilestones.reduce((sum, m) => sum + ((Number(m.progress) || 0) * (Number(m.weight) || 0)), 0);
      projectProgress = Math.round(weightedSum / totalWeight);

    } else {
      const simpleSum = rootMilestones.reduce((sum, m) => sum + (Number(m.progress) || 0), 0);
      projectProgress = Math.round(simpleSum / rootMilestones.length);

    }

    // 确定项目状态
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      select: { status: true }
    });

    let projectStatus = project?.status || '1';

    // 如果项目已经是 "已结项" (3)，则不再通过里程碑自动更新状态
    if (projectStatus === '3') {

    } else {
      // 只要有进度，就进入 "进行中" (2)
      // 如果没有进度，保持原状（如 "立项中" (1)）
      if (projectProgress > 0) {
        projectStatus = '2';
      }
    }


    await this.prisma.project.update({
      where: { projectId },
      data: { progress: projectProgress, status: projectStatus }
    });

  }
}
