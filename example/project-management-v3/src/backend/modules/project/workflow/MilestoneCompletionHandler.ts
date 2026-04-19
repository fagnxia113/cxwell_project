import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { milestoneService } from '../../../services/MilestoneService.js';
import { logger } from '../../../utils/logger.js';

/**
 * 里程碑结项审批通过后的服务任务处理器
 * 将里程碑标记为完成，并重新计算项目总进度
 */
export class MilestoneCompletionHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { formData, process } = context;
    const milestoneId = formData.milestoneId || formData.milestone_id;
    const projectId = process.business_id || formData.projectId || formData.project_id;

    logger.info(`[MilestoneCompletionHandler] 开始执行里程碑结项 - InstanceId: ${process.id}, MilestoneId: ${milestoneId}`);

    try {
      if (!milestoneId) {
        throw new Error('未找到关联的里程碑 ID');
      }

      // 将里程碑进度设为100%，状态自动变为 completed
      const actualEndDate = formData.actualEndDate || formData.actual_end_date || new Date().toISOString().split('T')[0];
      await milestoneService.updateMilestoneProgress(milestoneId, 100, actualEndDate);

      logger.info(`[MilestoneCompletionHandler] 里程碑结项成功 - MilestoneId: ${milestoneId}, ProjectId: ${projectId}`);

      return {
        success: true,
        message: '里程碑已结项，项目总进度已更新',
        milestoneId,
        projectId
      };
    } catch (error: any) {
      logger.error(`[MilestoneCompletionHandler] 里程碑结项失败: ${error.message}`, error);
      throw error;
    }
  }
}

export const milestoneCompletionHandler = new MilestoneCompletionHandler();
