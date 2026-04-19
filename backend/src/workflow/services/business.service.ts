import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pinyin } from 'pinyin-pro';
import * as bcrypt from 'bcrypt';

/**
 * 业务联动服务
 */
@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 业务联动钩子：流程完结后自动修改业务表状态
   */
  async handleWorkflowCompletion(definitionId: bigint, businessId: string) {
    try {
      const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
      if (!def) return;

      this.logger.log(`[WF-HOOK] 流程完结: ${def.flowName} (${def.flowCode}), 业务ID: ${businessId}`);

      // 针对不同流程代码执行不同业务逻辑
      if (def.flowCode === 'project_approval') {
        // 项目立项审批通过：修改项目状态为 “1” (进行中/已立项)
        await this.prisma.project.update({
          where: { projectId: BigInt(businessId) },
          data: { status: '1', updateTime: new Date() }
        });
        this.logger.log(`[WF-HOOK] 项目 ${businessId} 状态已更新为 进行中`);
      } else if (def.flowCode === 'employee_onboarding') {
        // 人员入职审批通过：自动创建账号与员工档案
        await this.createEmployeeFromOnboarding(businessId);
      }
      
      // 可以在此处增加更多流程的联动逻辑，如 'purchase_approval', 'attendance_approval' 等
      
    } catch (err) {
      this.logger.error(`[WF-HOOK-ERROR] 业务联动失败: ${err.message}`, err.stack);
    }
  }

  /**
   * 根据入职审批结果自动创建人员档案及账号
   */
  private async createEmployeeFromOnboarding(businessId: string) {
    try {
      this.logger.log(`[WF-ONBOARDING] 开始为业务ID: ${businessId} 创建员工档案`);
      
      // 1. 获取流程实例以取得变量内容
      const instance = await this.prisma.flowInstance.findFirst({
        where: { businessId }
      });
      if (!instance || !instance.ext) {
        this.logger.error(`[WF-ONBOARDING] 未找到流程实例或变量内容为空`);
        return;
      }
      
      const vars = JSON.parse(instance.ext);
      const name = vars.name;
      if (!name) {
        this.logger.error(`[WF-ONBOARDING] 变量中缺少姓名信息`);
        return;
      }

      // 2. 生成拼音用户名并处理重复
      const basePinyin = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
      let username = basePinyin;
      let count = 0;
      
      while (true) {
        const existing = await this.prisma.sysUser.findUnique({
          where: { loginName: username }
        });
        if (!existing) break;
        count++;
        username = `${basePinyin}${count}`;
      }

      // 3. 构建数据并执行事务
      const hashedPassword = await bcrypt.hash('mima1234', 10);
      
      await this.prisma.$transaction(async (tx) => {
        // A. 创建系统用户
        const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
        await tx.sysUser.create({
          data: {
            userId,
            loginName: username,
            userName: name,
            password: hashedPassword,
            status: '0', // 正常
            deptId: vars.deptId ? BigInt(vars.deptId) : null,
            remark: '流程自动创建'
          }
        });

        // B. 创建员工档案
        await tx.sysEmployee.create({
          data: {
            name,
            employeeNo: `EMP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            deptId: vars.deptId ? BigInt(vars.deptId) : null,
            position: vars.position,
            education: vars.education,
            university: vars.university,
            phone: vars.phone || '', // 手机号暂不强制
            userId: userId,
            status: '0', // 在职
            hireDate: vars.hireDate ? new Date(vars.hireDate) : new Date(),
          }
        });

        this.logger.log(`[WF-ONBOARDING] [SUCCESS] 已为 ${name} 创建账号 ${username}`);
      });
    } catch (err) {
      this.logger.error(`[WF-ONBOARDING] [FAILED] 创建失败: ${err.message}`, err.stack);
    }
  }
}