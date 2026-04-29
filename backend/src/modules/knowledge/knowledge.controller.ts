import { 
  Controller, Get, Post, Body, Put, Param, Delete, 
  UseInterceptors, UploadedFile, Request, BadRequestException, UseFilters
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadExceptionFilter } from '../../common/filters/file-upload.filter';

@Controller('knowledge')
@UseFilters(FileUploadExceptionFilter)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('tree')
  async getTree(@Request() req) {
    return this.knowledgeService.getTree(req.user.sub || req.user.userId, req.user.role);
  }

  @Post()
  async create(@Body() data, @Request() req) {
    return this.knowledgeService.create(data, req.user.sub || req.user.userId, req.user.role);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data, @Request() req) {
    return this.knowledgeService.update(id, data, req.user.sub || req.user.userId, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.delete(id, req.user.sub || req.user.userId, req.user.role);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/knowledge',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        const ext = extname(file.originalname);
        return cb(null, `${randomName}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.zip', '.rar'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new BadRequestException(`不支持的文件类型: ${ext}，仅支持 PDF、Office 文档、图片和压缩包`), false);
    },
    limits: { fileSize: 20 * 1024 * 1024 }
  }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @Request() req) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件，文件大小不能超过 20MB');
    }

    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const data = {
      title: originalname,
      type: 'Document',
      fileUrl: `/api/files/knowledge/${file.filename}`,
      isFolder: false,
      parentId: parentId || null
    };
    return this.knowledgeService.create(data, req.user.sub || req.user.userId, req.user.role);
  }

  /**
   * 获取节点的权限配置
   */
  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    return this.knowledgeService.getPermissions(id);
  }

  /**
   * 更新节点的权限配置
   */
  @Put(':id/permissions')
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { visibilityType: string; permissions: any[] },
    @Request() req,
  ) {
    return this.knowledgeService.updatePermissions(
      BigInt(id),
      body.visibilityType,
      body.permissions || [],
      req.user.sub || req.user.userId,
      req.user.role,
    );
  }

  @Put(':id/transfer')
  async transferOwner(
    @Param('id') id: string,
    @Body() body: { newOwnerLoginName: string },
    @Request() req,
  ) {
    return this.knowledgeService.transferOwner(
      BigInt(id),
      body.newOwnerLoginName,
      req.user.sub || req.user.userId,
      req.user.role,
    );
  }
}
