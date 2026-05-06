import { 
  Controller, Get, Post, Body, Put, Param, Delete, 
  UseInterceptors, UploadedFile, Request, BadRequestException, UseFilters
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { FileUploadExceptionFilter } from '../../common/filters/file-upload.filter';

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

@Controller('knowledge')
@UseFilters(FileUploadExceptionFilter)
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly configService: ConfigService,
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
      destination: (req, file, cb) => {
        const dir = `${UPLOAD_PATH}/knowledge`;
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        const ext = extname(file.originalname);
        return cb(null, `${randomName}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      cb(null, true);
    },
    limits: { fileSize: 500 * 1024 * 1024 }
  }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @Request() req) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件，文件大小不能超过 500MB');
    }

    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = extname(originalname).replace('.', '').toLowerCase();
    const fileUrlPrefix = this.configService.get<string>('FILE_URL_PREFIX') || '/api/files';

    const data = {
      title: originalname,
      type: 'Document',
      fileUrl: `${fileUrlPrefix}/knowledge/${file.filename}`,
      fileSize: file.size,
      fileType: ext || 'unknown',
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
