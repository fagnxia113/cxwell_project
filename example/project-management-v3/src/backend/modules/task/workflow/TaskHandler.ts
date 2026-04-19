import { singleton, inject, container } from 'tsyringe';
import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { logger } from '../../../utils/logger.js';
import { TaskUseCase } from '../../project/application/TaskUseCase.js';

@singleton()
export class TaskCompletionHandler implements IServiceTaskHandler {
  constructor(
    @inject('TaskUseCase') private taskUseCase: TaskUseCase
  ) {}

  async execute(context: ProcessContext, _config: any): Promise<any> {
    const { formData, process } = context;
    const taskId = process.business_id || formData.task_id;

    if (!taskId) {
      logger.warn(`[TaskCompletionHandler] 未找到关联的 task_id，跳过推升进度。`);
      return { success: false, message: 'Missing taskId' };
    }

    try {
      logger.info(`[TaskCompletionHandler] 正在推升任务进度至 100% - TaskId: ${taskId}`);
      
      // 调用 updateTaskProgress 设定为 100
      // 这将自动把 Task 表的状态置为 completed，且递归更新父级 Milestone 和 Project 的总 Progress
      await this.taskUseCase.updateTaskProgress(taskId, 100);
      
      logger.info(`[TaskCompletionHandler] 任务进度推升成功 - TaskId: ${taskId}`);
      return { success: true };
    } catch (error) {
      logger.error(`[TaskCompletionHandler] 更新任务验收进度失败:`, error as Error);
      throw error;
    }
  }
}

let _taskCompletionHandler: TaskCompletionHandler;

export function getTaskHandlers() {
  if (!_taskCompletionHandler) _taskCompletionHandler = container.resolve(TaskCompletionHandler);
  return {
    taskCompletionHandler: _taskCompletionHandler
  };
}
