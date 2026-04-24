import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkService } from '../../modules/dingtalk/dingtalk.service';

@Injectable()
export class EmployeeResignationHandler implements IWorkflowHandler {
  private readonly logger = new Logger(EmployeeResignationHandler.name);

  constructor(
    private prisma: PrismaService,
    private dingtalkService: DingtalkService,
  ) {}

  async handle(tx: any, businessId: string, instance: any, variables: any): Promise<void> {
    if (!businessId) return;

    const inst = instance || await tx.flowInstance.findFirst({ where: { businessId } });
    if (!inst?.ext) return;

    let formData: any = {};
    try {
      const ext = typeof inst.ext === 'string' ? JSON.parse(inst.ext) : inst.ext;
      formData = ext?.formData || ext?.variables || ext;
    } catch { return; }

    const employeeNo = formData.employeeNo || formData.employee_no || formData.employeeId || formData.employee_id;
    const employeeName = formData.employeeName || formData.employee_name || formData.name;

    if (!employeeNo && !employeeName) {
      this.logger.warn(`离职流程 [${businessId}] 无法获取员工信息，跳过处理`);
      return;
    }

    let employee: any = null;
    if (employeeNo) {
      // 尝试按工号找
      employee = await tx.sysEmployee.findFirst({ where: { employeeNo: String(employeeNo) } });
      // 如果没找到且是纯数字，尝试按ID找
      if (!employee && /^\d+$/.test(String(employeeNo))) {
        employee = await tx.sysEmployee.findUnique({ where: { employeeId: BigInt(employeeNo) } });
      }
    }
    if (!employee && employeeName) {
      employee = await tx.sysEmployee.findFirst({ where: { name: employeeName } });
    }

    if (!employee) {
      this.logger.warn(`离职流程 [${businessId}] 未找到员工: ${employeeName || employeeNo}`);
      return;
    }

    const leaveDateStr = formData.lastWorkingDay || formData.leaveDate || formData.last_working_day;
    const leaveDate = leaveDateStr ? new Date(leaveDateStr) : new Date();

    await tx.sysEmployee.update({
      where: { employeeId: employee.employeeId },
      data: {
        status: '1',
        leaveDate,
        updateTime: new Date(),
      }
    });
    this.logger.log(`离职流程：员工 ${employee.name} (${employee.employeeNo}) 状态已更新为离职，最后工作日: ${leaveDate.toISOString().split('T')[0]}`);

    if (employee.userId) {
      try {
        await tx.sysUser.update({
          where: { userId: employee.userId },
          data: { status: '1', updateTime: new Date() }
        });
        this.logger.log(`离职流程：关联账号 ${employee.userId} 已禁用`);
      } catch (e) {
        this.logger.warn(`离职流程：禁用关联账号失败: ${e.message}`);
      }
    }

    if (employee.dingtalkUserId) {
      try {
        const dtResult = await this.dingtalkService.deleteUser(employee.dingtalkUserId);
        if (dtResult.success) {
          this.logger.log(`离职流程：员工 ${employee.name} 已从钉钉删除`);
        } else {
          this.logger.warn(`离职流程：员工 ${employee.name} 钉钉删除失败: ${dtResult.error}`);
        }
      } catch (error) {
        this.logger.error(`离职流程：员工 ${employee.name} 钉钉删除异常: ${error.message}`);
      }
    }

    this.logger.log(`离职流程 [${businessId}] 处理完成：员工 ${employee.name} 已正式离职`);
  }
}
