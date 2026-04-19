import { progressAlertService } from './ProgressAlertService.js';
import { dailyReportReminderService } from './DailyReportReminderService.js';
import { logger } from '../utils/logger.js';

type ScheduledTask = () => Promise<void>;
export class SchedulerService {
  private tasks = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await this.loadTasks();
    logger.info('调度服务启动完成');
  }

  stop(): void {
    this.tasks.forEach((timer) => clearInterval(timer));
    this.tasks.clear();
    this.isRunning = false;
    logger.info('调度服务已停止');
  }

  private async loadTasks(): Promise<void> {
    this.scheduleTask('progress_check', 60 * 60 * 1000, async () => {
      try {
        await progressAlertService.runScheduledCheck();
      } catch (error: any) {
        logger.error('进度检查失败:', error);
      }
    });

    this.scheduleTask('daily_report_reminder', 60 * 1000, async () => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        try {
          await dailyReportReminderService.sendDailyReportReminder();
        } catch (error: any) {
          logger.error('日报提醒失败:', error);
        }
      }
    });
  }

  getStatus() {
    return {
      running: this.isRunning,
      taskCount: this.tasks.size,
      tasks: Array.from(this.tasks.keys())
    };
  }

  async triggerTask(taskType: string): Promise<{ success: boolean; message: string }> {
    if (taskType === 'progress_check') {
      try {
        await progressAlertService.runScheduledCheck();
        return { success: true, message: '进度检查任务已手动触发' };
      } catch (error: any) {
        return { success: false, message: `触发失败: ${error.message}` };
      }
    } else if (taskType === 'daily_report_reminder') {
      try {
        await dailyReportReminderService.sendDailyReportReminder();
        return { success: true, message: '日报提醒任务已手动触发' };
      } catch (error: any) {
        return { success: false, message: `触发失败: ${error.message}` };
      }
    }
    return { success: false, message: '未知的任务类型' };
  }

  private scheduleTask(taskId: string, intervalMs: number, fn: ScheduledTask): void {
    const timer = setInterval(fn, intervalMs);
    this.tasks.set(taskId, timer);
  }
}

export const schedulerService = new SchedulerService();