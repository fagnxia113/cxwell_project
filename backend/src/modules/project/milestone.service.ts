import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestoneService {
  constructor(private prisma: PrismaService) {}

  async saveMilestones(projectId: bigint, milestones: any[], user: any) {
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
    console.log(`[Sync] === Starting sync for parentId: ${parentId} ===`);
    
    const parent = await this.prisma.projectMilestone.findUnique({
      where: { id: parentId },
      include: { children: true }
    });

    if (!parent) {
      console.log(`[Sync] Parent not found: ${parentId}`);
      return;
    }
    
    if (!parent.children || parent.children.length === 0) {
      console.log(`[Sync] Parent has no children: ${parentId}`);
      return;
    }

    // 计算加权平均进度
    const totalWeight = parent.children.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    let newProgress = 0;
    
    console.log(`[Sync] Parent: ${parent.name} (id=${parentId})`);
    console.log(`[Sync] Total children weight: ${totalWeight}`);
    console.log(`[Sync] Children details:`, parent.children.map(c => ({
      id: c.id.toString(),
      name: c.name,
      weight: c.weight,
      progress: c.progress,
      status: c.status
    })));

    if (totalWeight > 0) {
      const weightedSum = parent.children.reduce((sum, c) => sum + ((Number(c.progress) || 0) * (Number(c.weight) || 0)), 0);
      newProgress = Math.round(weightedSum / totalWeight);
      console.log(`[Sync] Weighted calculation: ${weightedSum} / ${totalWeight} = ${newProgress}`);
    } else {
      // 如果没有权重，则计算简单平均
      const simpleSum = parent.children.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
      newProgress = Math.round(simpleSum / parent.children.length);
      console.log(`[Sync] No weight found, using simple average: ${simpleSum} / ${parent.children.length} = ${newProgress}`);
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

    console.log(`[Sync] Updating parent progress from ${parent.progress} to ${newProgress}, status from ${parent.status} to ${newStatus}`);

    // 更新父级进度和状态
    await this.prisma.projectMilestone.update({
      where: { id: parentId },
      data: { 
        progress: newProgress,
        status: newStatus
      }
    });
    console.log(`[Sync] Successfully updated parent ${parentId} to progress ${newProgress}`);

    // 继续向上同步（递归处理祖父级）
    if (parent.parentId) {
      console.log(`[Sync] Parent has grandparent ${parent.parentId}, recursing...`);
      await this.syncParentProgress(parent.parentId);
    } else {
      console.log(`[Sync] Parent is root milestone, stopping recursion`);
    }
  }

  // 同步项目总进度
  private async syncProjectProgress(projectId: bigint) {
    console.log(`[Sync] === Starting project sync for projectId: ${projectId} ===`);
    const rootMilestones = await this.prisma.projectMilestone.findMany({
      where: {
        projectId,
        parentId: null
      }
    });

    console.log(`[Sync] Found ${rootMilestones.length} root milestones`);
    console.log(`[Sync] Root milestones details:`, rootMilestones.map(m => ({
      id: m.id.toString(),
      name: m.name,
      weight: m.weight,
      progress: m.progress,
      status: m.status
    })));

    if (rootMilestones.length === 0) return;

    const totalWeight = rootMilestones.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
    let projectProgress = 0;

    if (totalWeight > 0) {
      const weightedSum = rootMilestones.reduce((sum, m) => sum + ((Number(m.progress) || 0) * (Number(m.weight) || 0)), 0);
      projectProgress = Math.round(weightedSum / totalWeight);
      console.log(`[Sync] Project weighted sum: ${weightedSum}, Total weight: ${totalWeight}, Result: ${projectProgress}`);
    } else {
      const simpleSum = rootMilestones.reduce((sum, m) => sum + (Number(m.progress) || 0), 0);
      projectProgress = Math.round(simpleSum / rootMilestones.length);
      console.log(`[Sync] Project simple average: ${simpleSum} / ${rootMilestones.length} = ${projectProgress}`);
    }

    // 确定项目状态
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      select: { status: true }
    });

    let projectStatus = project?.status || '1';

    // 如果项目已经是 "已结项" (3)，则不再通过里程碑自动更新状态
    if (projectStatus === '3') {
      console.log(`[Sync] Project is already closed (status=3), skipping status update`);
    } else {
      // 只要有进度，就进入 "进行中" (2)
      // 如果没有进度，保持原状（如 "立项中" (1)）
      if (projectProgress > 0) {
        projectStatus = '2';
      }
    }

    console.log(`[Sync] Updating project progress to ${projectProgress}, status to ${projectStatus}`);
    await this.prisma.project.update({
      where: { projectId },
      data: { progress: projectProgress, status: projectStatus }
    });
    console.log(`[Sync] === Project sync completed ===`);
  }
}
