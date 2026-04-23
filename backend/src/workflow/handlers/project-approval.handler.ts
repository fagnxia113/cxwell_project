import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectApprovalHandler implements IWorkflowHandler {
  private readonly logger = new Logger(ProjectApprovalHandler.name);

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

    const projectName = formData.projectName || formData.name || '未命名项目';
    const projectCode = businessId;

    const existing = await tx.Project.findFirst({ where: { projectCode } });
    if (existing) {
      this.logger.warn(`项目立项：项目 ${projectCode} 已存在，跳过重复创建`);
      await tx.Project.update({
        where: { projectId: existing.projectId },
        data: { status: '1', updateTime: new Date() }
      });
      return;
    }

    const projectId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000));

    await tx.Project.create({
      data: {
        projectId,
        projectName: formData.projectName || '未命名项目',
        projectCode,
        projectType: formData.projectType || 'domestic',
        country: formData.country || null,
        address: formData.address || null,
        attachments: formData.attachments || null,
        status: '1',
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        managerId: formData.managerId ? BigInt(formData.managerId) : null,
        customerId: formData.customerId ? BigInt(formData.customerId) : null,
        budget: formData.budget ? Number(formData.budget) : 0,
        description: formData.description || '',
        buildingArea: formData.buildingArea ? Number(formData.buildingArea) : null,
        itCapacity: formData.itCapacity ? Number(formData.itCapacity) : null,
        cabinetCount: formData.cabinetCount ? Number(formData.cabinetCount) : null,
        cabinetPower: formData.cabinetPower ? Number(formData.cabinetPower) : null,
        powerArchitecture: formData.powerArchitecture || '',
        hvacArchitecture: formData.hvacArchitecture || '',
        fireArchitecture: formData.fireArchitecture || '',
        weakElectricArchitecture: formData.weakElectricArchitecture || '',
        createBy: inst.createBy || 'system',
        createTime: new Date(),
        updateTime: new Date(),
      }
    });

    await tx.flowInstance.update({
      where: { id: inst.id },
      data: { businessId: projectId.toString() }
    });

    this.logger.log(`项目立项审批通过，已创建项目台账: ${projectCode}`);
  }
}
