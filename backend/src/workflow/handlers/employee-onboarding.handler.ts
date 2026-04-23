import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { DingtalkService } from '../../modules/dingtalk/dingtalk.service';
import { pinyin } from 'pinyin-pro';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeOnboardingHandler implements IWorkflowHandler {
  private readonly logger = new Logger(EmployeeOnboardingHandler.name);

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
    if (!name) {
      this.logger.warn(`入职流程 [${businessId}] 无法获取员工姓名，跳过创建`);
      return;
    }

    const phone = formData.phone;
    const existingEmployee = await tx.SysEmployee.findFirst({
      where: { name, phone: phone || undefined }
    });
    if (existingEmployee) {
      this.logger.warn(`入职流程：员工 ${name} 已存在，跳过重复创建`);
      return;
    }

    const basePinyin = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    let username = basePinyin;
    let userCount = 0;
    while (await tx.SysUser.findUnique({ where: { loginName: username } })) {
      userCount++;
      username = `${basePinyin}${userCount}`;
    }

    const lastEmployee = await tx.SysEmployee.findFirst({
      where: { employeeNo: { startsWith: 'Cxwell-' } },
      orderBy: { employeeNo: 'desc' }
    });
    let nextNo = 1;
    if (lastEmployee?.employeeNo) {
      const match = lastEmployee.employeeNo.match(/\d+$/);
      if (match) nextNo = parseInt(match[0]) + 1;
    }
    const employeeNo = `Cxwell-${nextNo.toString().padStart(5, '0')}`;

    const hashedPassword = await bcrypt.hash('mima1234', 10);
    const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const deptId = formData.department_id || formData.departmentId || formData.deptId;
    const positionId = formData.position_id || formData.positionId || formData.position;

    const rawGender = formData.gender || '';
    const genderMap: Record<string, string> = { '男': '0', '女': '1', 'male': '0', 'female': '1', '0': '0', '1': '1' };
    const gender = genderMap[String(rawGender).toLowerCase()] || null;

    const rawEducation = formData.education || '';
    const eduMap: Record<string, string> = { '高中': '1', '大专': '2', '本科': '3', '硕士': '4', '博士': '5', '其他': '0' };
    const education = eduMap[rawEducation] || rawEducation || null;

    await tx.SysUser.create({
      data: {
        userId,
        loginName: username,
        userName: name,
        password: hashedPassword,
        status: '0',
        sex: gender || '0',
        deptId: deptId ? BigInt(deptId) : null
      }
    });

    const phoneCountryCode = formData.phoneCountryCode || formData.countryCode || '+86';

    await tx.SysEmployee.create({
      data: {
        name,
        employeeNo,
        userId,
        status: '0',
        phone: phone || 'N/A',
        phoneCountryCode,
        deptId: deptId ? BigInt(deptId) : null,
        position: positionId || null,
        gender,
        email: formData.email || null,
        education,
        university: formData.university || formData.graduation_school || null,
        hireDate: formData.start_date || formData.startDate ? new Date(formData.start_date || formData.startDate) : new Date()
      }
    });

    const epyRole = await tx.SysRole.findFirst({ where: { roleKey: 'epy' } });
    if (epyRole) {
      await tx.SysUserRole.create({ data: { userId, roleId: epyRole.roleId } });
    }

    this.logger.log(`服务节点执行完成：为 ${name} 创建了账号 ${username} 和工号 ${employeeNo}`);

    await this.syncToDingtalk(tx, name, phone, phoneCountryCode, deptId, positionId, formData, employeeNo);
  }

  private async syncToDingtalk(
    tx: any, name: string, phone: string, phoneCountryCode: string,
    deptId: string | undefined, positionId: string | undefined,
    formData: any, employeeNo: string
  ) {
    if (!phone) return;
    try {
      let dingtalkDeptId: number | undefined;
      if (deptId) {
        const dept = await tx.sysDept.findFirst({ where: { deptId: BigInt(deptId) } });
        if (dept?.dingtalkDeptId) {
          dingtalkDeptId = parseInt(dept.dingtalkDeptId);
        }
      }
      let jobTitleName = positionId;
      if (positionId) {
        const post = await tx.sysPost.findFirst({ where: { postId: BigInt(positionId) } });
        if (post) {
          jobTitleName = post.postName;
        }
      }
      const dingtalkResult = await this.dingtalkService.createUser({
        name,
        mobile: phone,
        countryCode: phoneCountryCode,
        deptIds: dingtalkDeptId ? [dingtalkDeptId] : undefined,
        jobTitle: jobTitleName,
        email: formData.email,
        jobNumber: employeeNo,
        hiredDate: formData.start_date || formData.startDate,
      });
      if (dingtalkResult.success && dingtalkResult.userId) {
        this.logger.log(`入职流程：员工 ${name} 已同步到钉钉，userId: ${dingtalkResult.userId}`);
        await tx.SysEmployee.update({
          where: { name, phone: phone || undefined },
          data: { dingtalkUserId: dingtalkResult.userId }
        });
      } else {
        this.logger.warn(`入职流程：员工 ${name} 同步钉钉失败: ${dingtalkResult.error}`);
      }
    } catch (error) {
      this.logger.error(`入职流程：员工 ${name} 同步钉钉异常: ${error.message}`);
    }
  }
}
