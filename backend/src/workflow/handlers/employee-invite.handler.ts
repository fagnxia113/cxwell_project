import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkService } from '../../modules/dingtalk/dingtalk.service';

@Injectable()
export class EmployeeInviteHandler implements IWorkflowHandler {
  private readonly logger = new Logger(EmployeeInviteHandler.name);

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

    const name = formData.employee_name || formData.employeeName || formData.name;
    const phone = formData.phone;

    if (!phone) {
      this.logger.warn(`邀请节点 [${businessId}]：手机号缺失，无法发送邀请`);
      return;
    }

    const employee = await tx.sysEmployee.findFirst({
      where: { name, phone }
    });

    if (!employee || !employee.dingtalkUserId) {
      this.logger.warn(`邀请节点 [${businessId}]：未找到员工或未同步钉钉UserId，无法发送邀请`);
      return;
    }

    try {
      const result = await this.dingtalkService.sendActiveInvite(employee.dingtalkUserId);
      if (result.success) {
        this.logger.log(`邀请节点：已成功向员工 ${name} (${employee.dingtalkUserId}) 发送钉钉激活邀请`);
      } else {
        this.logger.warn(`邀请节点：向员工 ${name} 发送激活邀请失败: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`邀请节点：向员工 ${name} 发送激活邀请异常: ${error.message}`);
    }
  }
}
