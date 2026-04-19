import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { db } from '../../../database/connection.js';
import { logger } from '../../../utils/logger.js';

/**
 * 项目结项审批通过后的服务任务处理器
 * 将项目状态更新为 completed，进度设为 100%
 */
export class ProjectCompletionHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { formData, process } = context;
    const projectId = process.business_id || formData.projectId || formData.project_id;

    logger.info(`[ProjectCompletionHandler] 开始执行项目结项 - InstanceId: ${process.id}, ProjectId: ${projectId}`);

    try {
      if (!projectId) {
        throw new Error('未找到关联的项目 ID');
      }

      // 检查是否所有里程碑已结项
      const pendingMilestones = await db.query<any>(
        `SELECT id, name, status, progress FROM project_milestones 
         WHERE project_id = ? AND status != 'completed' AND status != 'cancelled'`,
        [projectId]
      );

      if (pendingMilestones.length > 0) {
        const names = pendingMilestones.map((m: any) => m.name).join('、');
        logger.warn(`[ProjectCompletionHandler] 存在未结项的里程碑: ${names}，但仍允许结项`);
        // 注意：这里仅发出警告，不阻断流程。如果需要强制要求所有里程碑完成，可抛出错误
      }

      // 更新项目状态
      await db.execute(
        `UPDATE projects SET 
          status = 'completed', 
          progress = 100,
          updated_at = NOW()
        WHERE id = ?`,
        [projectId]
      );

      logger.info(`[ProjectCompletionHandler] 项目结项成功 - ProjectId: ${projectId}`);

      return {
        success: true,
        message: '项目已结项',
        projectId,
        completionDate: formData.completionDate || new Date().toISOString().split('T')[0]
      };
    } catch (error: any) {
      logger.error(`[ProjectCompletionHandler] 项目结项失败: ${error.message}`, error);
      throw error;
    }
  }
}

export const projectCompletionHandler = new ProjectCompletionHandler();
