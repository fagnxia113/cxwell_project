import { IServiceTaskHandler } from '../../../core/workflow/interfaces.js';
import { ProcessContext } from '../../../core/workflow/types.js';
import { personnelTransferService } from '../../../services/PersonnelTransferService.js';
import { logger } from '../../../utils/logger.js';

/**
 * 人员项目调拨审批通过后的服务任务处理器
 * 调用 PersonnelTransferService 执行实际调拨操作
 */
export class PersonnelTransferHandler implements IServiceTaskHandler {
  async execute(context: ProcessContext, config: any): Promise<any> {
    const { formData, process } = context;

    logger.info(`[PersonnelTransferHandler] 开始执行人员调拨 - InstanceId: ${process.id}`);

    try {
      const employeeId = formData.employeeId || formData.employee_id;
      const sourceProjectId = formData.sourceProjectId || formData.source_project_id || null;
      const targetProjectId = formData.targetProjectId || formData.target_project_id || null;
      const transferDate = formData.transferDate || formData.transfer_date 
        ? new Date(formData.transferDate || formData.transfer_date) 
        : new Date();
      const remark = formData.remark || formData.transfer_reason || '审批通过后自动调拨';

      if (!employeeId) {
        throw new Error('未找到调拨员工 ID');
      }

      if (!sourceProjectId && !targetProjectId) {
        throw new Error('调出项目和调入项目不能同时为空');
      }

      const result = await personnelTransferService.transferPersonnel(
        employeeId,
        sourceProjectId,
        targetProjectId,
        transferDate,
        remark
      );

      logger.info(`[PersonnelTransferHandler] 人员调拨成功 - EmployeeId: ${employeeId}, ${sourceProjectId || '资源池'} → ${targetProjectId || '资源池'}`);

      return {
        success: true,
        message: '人员调拨已完成',
        employeeId,
        sourceProjectId,
        targetProjectId
      };
    } catch (error: any) {
      logger.error(`[PersonnelTransferHandler] 人员调拨失败: ${error.message}`, error);
      throw error;
    }
  }
}

export const personnelTransferHandler = new PersonnelTransferHandler();
