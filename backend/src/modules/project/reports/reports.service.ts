import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private async checkUserProjectRole(projectId: bigint, user: any): Promise<'manager' | 'member' | null> {
    const userId = user?.sub || user?.userId;
    if (!userId) return null;

    // 超级管理员
    if (userId === '1' || userId === 1) return 'manager';

    // 检查是否是项目经理
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      select: { managerId: true }
    });

    // 检查是否是项目成员
    const employee = await this.prisma.sysEmployee.findFirst({
      where: { userId: BigInt(userId) },
      select: { employeeId: true }
    });

    if (project?.managerId && employee && project.managerId.toString() === employee.employeeId.toString()) {
      return 'manager';
    }

    if (employee) {
      const membership = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          employeeId: employee.employeeId
        }
      });

      if (membership) return 'member';
    }

    return null;
  }

  async findAll(projectId: bigint) {
    const reports = await this.prisma.projectReport.findMany({
      where: { projectId },
      include: {
        attachments: true,
      },
      orderBy: { createTime: 'desc' },
    });

    return reports.map(report => this.mapReport(report));
  }

  async create(data: {
    projectId: bigint;
    milestoneId: bigint;
    name: string;
    copies: number;
    remarks?: string;
    status: string;
  }, user: any) {
    const role = await this.checkUserProjectRole(data.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以新建报告');
    }

    const report = await this.prisma.projectReport.create({
      data: {
        projectId: data.projectId,
        milestoneId: data.milestoneId,
        name: data.name,
        copies: data.copies,
        remarks: data.remarks,
        status: data.status,
      },
      include: { attachments: true },
    });
    return this.mapReport(report);
  }

  async update(id: bigint, data: any, user: any) {
    const report = await this.prisma.projectReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报告不存在');

    const role = await this.checkUserProjectRole(report.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以编辑报告');
    }

    const updated = await this.prisma.projectReport.update({
      where: { id },
      data,
      include: { attachments: true },
    });
    return this.mapReport(updated);
  }

  async updateProgress(
    id: bigint,
    data: { submittedCount: number; verifiedCount: number; rejectedCount: number },
    user: any
  ) {
    const report = await this.prisma.projectReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报告不存在');

    const role = await this.checkUserProjectRole(report.projectId, user);
    if (!role) {
      throw new ForbiddenException('您不是该项目成员');
    }

    const updated = await this.prisma.projectReport.update({
      where: { id },
      data: {
        submittedCount: data.submittedCount,
        verifiedCount: data.verifiedCount,
        rejectedCount: data.rejectedCount,
      },
      include: { attachments: true },
    });
    return this.mapReport(updated);
  }

  async remove(id: bigint, user: any) {
    const report = await this.prisma.projectReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报告不存在');

    const role = await this.checkUserProjectRole(report.projectId, user);
    if (!role) {
      throw new ForbiddenException('只有项目成员可以删除报告');
    }

    // Delete attachments first
    const attachments = await this.prisma.projectReportAttachment.findMany({
      where: { reportId: id },
    });

    for (const att of attachments) {
      await this.removeAttachment(att.id);
    }

    await this.prisma.projectReport.delete({ where: { id } });
    return { success: true };
  }

  async addAttachment(reportId: bigint, fileName: string, filePath: string) {
    const fileUrlPrefix = this.configService.get<string>('FILE_URL_PREFIX') || 'http://localhost:3000/api/files';
    const fileUrl = `${fileUrlPrefix}/reports/${filePath}`;

    const attachment = await this.prisma.projectReportAttachment.create({
      data: {
        reportId,
        fileName,
        fileUrl,
      },
    });

    // Update report status if enough copies uploaded
    const report = await this.prisma.projectReport.findUnique({
      where: { id: reportId },
      include: { attachments: true },
    });

    if (report && report.attachments.length >= report.copies) {
      await this.prisma.projectReport.update({
        where: { id: reportId },
        data: { status: 'verified' },
      });
    } else if (report && report.attachments.length > 0) {
      await this.prisma.projectReport.update({
        where: { id: reportId },
        data: { status: 'submitted' },
      });
    }

    return {
      ...attachment,
      id: attachment.id.toString(),
      reportId: attachment.reportId.toString(),
    };
  }

  async removeAttachment(id: bigint) {
    const attachment = await this.prisma.projectReportAttachment.findUnique({
      where: { id },
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    // Extract file path from URL
    const fileUrlPrefix = this.configService.get<string>('FILE_URL_PREFIX') || 'http://localhost:3000/api/files';
    const relativePath = attachment.fileUrl.replace(fileUrlPrefix, '');
    const uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    const fullPath = join(process.cwd(), uploadPath, relativePath);

    try {
      await unlink(fullPath);
    } catch (err) {
      console.error(`Failed to delete file: ${fullPath}`, err);
    }

    await this.prisma.projectReportAttachment.delete({ where: { id } });
    return { success: true };
  }

  private mapReport(report: any) {
    return {
      ...report,
      id: report.id.toString(),
      projectId: report.projectId.toString(),
      milestone_id: report.milestoneId.toString(),
      milestoneId: report.milestoneId.toString(),
      copies: report.copies,
      submitted_count: report.submittedCount ?? 0,
      verified_count: report.verifiedCount ?? 0,
      rejected_count: report.rejectedCount ?? 0,
      last_updater: report.lastUpdater,
      last_update_time: report.updateTime?.toISOString(),
      attachments: report.attachments?.map((att: any) => ({
        ...att,
        id: att.id.toString(),
        reportId: att.reportId.toString(),
        file_url: att.fileUrl,
        file_name: att.fileName,
        created_at: att.createTime?.toISOString(),
      })),
    };
  }
}
