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
    return this.knowledgeService.getTree(req.user.sub);
  }

  @Post()
  async create(@Body() data, @Request() req) {
    return this.knowledgeService.create(data, req.user.sub);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data, @Request() req) {
    // 如果包含权限数据，单独处理
    if (data.permissions) {
      await this.knowledgeService.updatePermissions(BigInt(id), data.permissions);
    }
    return this.knowledgeService.update(id, data, req.user.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.delete(id, req.user.sub);
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
    return this.knowledgeService.create(data, req.user.sub);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    // 实现略，直接通过 Prisma 获取
  }
}
