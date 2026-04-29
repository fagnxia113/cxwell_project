import { 
  Controller, Get, Post, Body, Put, Param, Delete, 
  UseInterceptors, UploadedFile, Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('knowledge')
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
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.zip', '.rar'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error('不支持的文件类型'), false);
    },
    limits: { fileSize: 20 * 1024 * 1024 }
  }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @Request() req) {
    const data = {
      title: file.originalname,
      type: 'Document',
      fileUrl: `/api/files/knowledge/${file.filename}`,
      isFolder: false,
      parentId: parentId || null
    };
    // 文件不设独立权限，继承父目录
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
