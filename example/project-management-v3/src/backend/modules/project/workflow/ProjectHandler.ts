import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { container } from 'tsyringe';
import { ProjectUseCase } from '../application/ProjectUseCase.js';
import { logger } from '../../../utils/logger.js';
import { db } from '../../../database/connection.js';

export class ProjectHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { formData, process } = context;
    logger.info(`[ProjectHandler] 开始执行项目台账自动写入 - InstanceId: ${process.id}`);

    try {
      const projectUseCase = container.resolve(ProjectUseCase);
      
      // 自动补全负责人姓名
      if (formData.manager_id && !formData.manager) {
        try {
          const res = await db.queryOne<{name: string}>('SELECT name FROM employees WHERE id = ?', [formData.manager_id]);
          if (res?.name) {
            formData.manager = res.name;
          }
        } catch (e) {
          logger.error('[ProjectHandler] 无法解析项目经理姓名:', e as any);
        }
      }
      
      if (formData.technical_lead_id && !formData.tech_manager) {
        try {
          const res = await db.queryOne<{name: string}>('SELECT name FROM employees WHERE id = ?', [formData.technical_lead_id]);
          if (res?.name) {
            formData.tech_manager = res.name;
          }
        } catch (e) {
          logger.error('[ProjectHandler] 无法解析技术负责人姓名:', e as any);
        }
      }
      
      // 确保有项目编号 code
      if (!formData.code) {
        formData.code = `PRJ-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        logger.info(`[ProjectHandler] 自动生成项目编号: ${formData.code}`);
      }
      console.log(`[ProjectHandler] >>> [${new Date().toISOString()}] 启动项目台账写入:`, { 
        instanceId: process.id, 
        businessKey: (process as any).business_key || (process as any).businessKey, 
        code: formData.code 
      });
      
      let project;
      try {
        project = await projectUseCase.createProject(formData as any);
        console.log(`[ProjectHandler] <<< [${new Date().toISOString()}] 项目台账写入成功:`, { projectId: project.id });
        logger.info(`[ProjectHandler] 项目台账写入成功 - ProjectId: ${project.id}`);
      } catch (err: any) {
        console.error(`[ProjectHandler] !!! [${new Date().toISOString()}] 项目台账写入失败:`, {
          message: err.message,
          stack: err.stack,
          instanceId: process.id
        });
        logger.error(`[ProjectHandler] 项目台账写入失败: ${err.message}`, err);
        throw err; // 抛出错误以确保工作流引擎能捕获到失败
      }

      return { success: true, projectId: project.id };
    } catch (error) {
      logger.error(`[ProjectHandler] 项目台账写入失败:`, error as Error);
      throw error;
    }
  }
}

export const projectHandler = new ProjectHandler();
