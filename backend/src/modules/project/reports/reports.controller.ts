import { 
  Controller, Get, Post, Put, Delete, Body, Query, Param, 
  UseInterceptors, UploadedFile, UseGuards 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
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
  async create(@Body() body: any) {
    const data = await this.reportsService.create({
      projectId: BigInt(body.project_id),
      milestoneId: BigInt(body.milestone_id),
      name: body.name,
      copies: Number(body.copies),
      remarks: body.remarks,
      status: body.status || 'pending',
    });
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.reportsService.update(BigInt(id), {
      name: body.name,
      copies: Number(body.copies),
      remarks: body.remarks,
      milestoneId: body.milestone_id ? BigInt(body.milestone_id) : undefined,
    });
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.reportsService.remove(BigInt(id));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        cb(null, `${uploadPath}/reports`);
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
