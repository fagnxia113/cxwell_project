import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { milestoneService } from '../../../services/MilestoneService.js';
import { logger } from '../../../utils/logger.js';

/**
 * 里程碑审批通过后的服务任务处理器
 * 负责将流程变量中的里程碑数据正式写入数据库
 */
export class MilestoneHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { formData, process } = context;
    const projectId = process.business_id || formData.project_id;

    logger.info(`[MilestoneHandler] 开始执行里程碑数据同步 - InstanceId: ${process.id}, ProjectId: ${projectId}`);

    try {
      if (!projectId) {
        throw new Error('未找到关联的项目 ID');
      }

      const milestones = formData.milestones;
      if (!milestones || !Array.isArray(milestones)) {
        throw new Error('流程数据中未找到有效的里程碑列表');
      }

      // 调用 MilestoneService 执行物理写入
      // 注意：此操作仅在审批通过后由服务节点触发
      await milestoneService.saveMilestones(projectId, milestones);

      logger.info(`[MilestoneHandler] 里程碑数据同步成功 - ProjectId: ${projectId}`);
      
      return { 
        success: true, 
        message: '里程碑数据已同步至项目台账',
        updatedCount: milestones.length 
      };
    } catch (error: any) {
      logger.error(`[MilestoneHandler] 里程碑数据同步失败: ${error.message}`, error);
      throw error;
    }
  }
}

export const milestoneHandler = new MilestoneHandler();
