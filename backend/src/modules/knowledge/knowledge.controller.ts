import { 
  Controller, Get, Post, Body, Put, Param, Delete, 
  UseInterceptors, UploadedFile, Request, BadRequestException, UseFilters
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { KnowledgeService } from './knowledge.service';
import { extname, join } from 'path';
import * as fs from 'fs';
import { FileUploadExceptionFilter } from '../../common/filters/file-upload.filter';
import { FileStorageService } from '../../common/services/file-storage.service';

@Controller('knowledge')
@UseFilters(FileUploadExceptionFilter)
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly fileStorage: FileStorageService,
  ) {}

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
      destination: (_req, _file, cb) => {
        const tmpDir = join(process.cwd(), 'uploads', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        cb(null, tmpDir);
      },
      filename: (_req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        const ext = extname(file.originalname);
        cb(null, `${randomName}${ext}`);
      },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }
  }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @Request() req) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件，文件大小不能超过 500MB');
    }

    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = extname(originalname).replace('.', '').toLowerCase();

    const result = await this.fileStorage.uploadFromPath(file.path, 'knowledge', file.originalname, file.size);

    try { fs.unlinkSync(file.path); } catch {}

    const data = {
      title: originalname,
      type: 'Document',
      fileUrl: result.url,
      fileSize: result.size,
      fileType: ext || 'unknown',
      isFolder: false,
      parentId: parentId || null
    };
    return this.knowledgeService.create(data, req.user.sub || req.user.userId, req.user.role);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    return this.knowledgeService.getPermissions(id);
  }

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
