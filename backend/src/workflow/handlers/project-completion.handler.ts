import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectCompletionHandler implements IWorkflowHandler {
  private readonly logger = new Logger(ProjectCompletionHandler.name);

  constructor(private prisma: PrismaService) {}

  async handle(tx: any, businessId: string, instance: any, variables: any): Promise<void> {
    if (!businessId || !/^\d+$/.test(businessId)) {
      this.logger.warn(`项目结项处理器：businessId "${businessId}" 非纯数字，无法识别为 projectId，跳过`);
      return;
    }

    const projectId = BigInt(businessId);
    this.logger.log(`项目结项处理器开始执行：projectId=${projectId}`);

    const project = await tx.project.findUnique({ where: { projectId } });
    if (!project) {
      this.logger.warn(`项目结项处理器：项目 ${projectId} 不存在，跳过`);
      return;
    }

    if (project.status === '3') {
      this.logger.warn(`项目 ${projectId} 已结项，跳过重复处理`);
      return;
    }

    await tx.project.update({
      where: { projectId },
      data: {
        status: '3',
        endDate: new Date(),
        updateTime: new Date(),
      }
    });

    this.logger.log(`项目 ${project.projectName}(${projectId}) 结项审批通过，已更新项目状态为已完成`);
  }
}
