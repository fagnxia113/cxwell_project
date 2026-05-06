import {
  Controller, Get, Post, Put, Delete, Body, Query, Param,
  UseInterceptors, UploadedFile, Req, ForbiddenException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private configService: ConfigService
  ) {}

  @Get()
  async findAll(@Query('project_id') projectId: string) {
    const data = await this.reportsService.findAll(BigInt(projectId));
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const data = await this.reportsService.create({
      projectId: BigInt(body.project_id),
      milestoneId: BigInt(body.milestone_id),
      name: body.name,
      copies: Number(body.copies),
      remarks: body.remarks,
      status: body.status || 'pending',
    }, req.user);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.reportsService.update(BigInt(id), {
      name: body.name,
      copies: Number(body.copies),
      remarks: body.remarks,
      milestoneId: body.milestone_id ? BigInt(body.milestone_id) : undefined,
    }, req.user);
    return { success: true, data };
  }

  @Put(':id/progress')
  async updateProgress(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.reportsService.updateProgress(
      BigInt(id),
      {
        submittedCount: body.submitted_count ?? 0,
        verifiedCount: body.verified_count ?? 0,
        rejectedCount: body.rejected_count ?? 0,
      },
      req.user
    );
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return await this.reportsService.remove(BigInt(id), req.user);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const dir = `${uploadPath}/reports`;
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('report_id') reportId: string) {
    const data = await this.reportsService.addAttachment(
      BigInt(reportId),
      file.originalname,
      file.filename
    );
    return { success: true, data };
  }

  @Delete('attachments/:id')
  async removeAttachment(@Param('id') id: string) {
    return await this.reportsService.removeAttachment(BigInt(id));
  }
}
