import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

function recoverUtf8FromLatin1(str: string): string {
  try {
    const buf = Buffer.from(str, 'binary');
    const decoded = iconv.decode(buf, 'utf8');
    if (decoded && /[\u4e00-\u9fa5]/.test(decoded)) return decoded;
  } catch {}
  return str;
}

@Controller('upload')
export class UploadController {
  constructor(private configService: ConfigService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        require('fs').mkdirSync(UPLOAD_PATH, { recursive: true });
        cb(null, UPLOAD_PATH);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const blocked = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.so', '.app', '.deb', '.rpm', '.vbs', '.wsf', '.scr', '.com'];
      const ext = extname(file.originalname).toLowerCase();
      if (blocked.includes(ext)) cb(new BadRequestException('不允许上传可执行文件'), false);
      else cb(null, true);
    },
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    const originalName = recoverUtf8FromLatin1(file.originalname);
    const fileUrlPrefix = this.configService.get<string>('FILE_URL_PREFIX') || '/api/files';
    const fileUrl = `${fileUrlPrefix}/${file.filename}`;
    return { url: fileUrl, fileUrl, fileName: originalName, fileSize: file.size };
  }
}
