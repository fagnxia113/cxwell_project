import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaveApprovalHandler implements IWorkflowHandler {
  private readonly logger = new Logger(LeaveApprovalHandler.name);

  constructor(private prisma: PrismaService) {}

  async handle(tx: any, businessId: string, instance: any, variables: any): Promise<void> {
    if (!businessId) return;

    const inst = instance || await tx.flowInstance.findFirst({ where: { businessId } });
    if (!inst?.ext) return;

    let formData: any = {};
    try {
      const ext = typeof inst.ext === 'string' ? JSON.parse(inst.ext) : inst.ext;
      formData = ext?.formData || ext?.variables || ext;
    } catch { return; }

    const employeeName = formData.employeeName || formData.employee_name || formData.name;
    const leaveType = formData.leaveType || formData.leave_type;
    const startDateStr = formData.leaveStartDate || formData.startDate || formData.start_date;
    const endDateStr = formData.leaveEndDate || formData.endDate || formData.end_date;
    const days = Number(formData.days || formData.leaveDays || 0);
    const reason = formData.reason || formData.description || null;

    if (!employeeName || !leaveType || !startDateStr || !endDateStr) {
      this.logger.warn(`请假流程 [${businessId}] 表单数据不完整，跳过创建请假记录`);
      return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    let employee: any = null;
    employee = await tx.SysEmployee.findFirst({ where: { name: employeeName } });
    if (!employee && formData.employeeNo) {
      employee = await tx.SysEmployee.findFirst({ where: { employeeNo: formData.employeeNo } });
    }

    const leaveId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 100000));

    await tx.leave.create({
      data: {
        leaveId,
        employeeId: employee?.employeeId || null,
        employeeName,
        employeeNo: employee?.employeeNo || formData.employeeNo || null,
        leaveType: String(leaveType),
        startDate,
        endDate,
        days,
        reason,
        status: 'approved',
        sourceType: 'workflow',
        sourceId: inst.id,
        instanceId: inst.id,
        createTime: new Date(),
        updateTime: new Date(),
      }
    });

    this.logger.log(`请假流程 [${businessId}] 处理完成：员工 ${employeeName} 请假 ${leaveType}，${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}，共 ${days} 天`);
  }
}
