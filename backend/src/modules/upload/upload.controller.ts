import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

function recoverUtf8FromLatin1(str: string): string {
  try {
    const buf = Buffer.from(str, 'binary');
    const decoded = iconv.decode(buf, 'utf-8');
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
        cb(null, UPLOAD_DIR);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const blocked = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.so', '.app', '.deb', '.rpm', '.vbs', '.wsf', '.scr', '.com'];
      const ext = extname(file.originalname).toLowerCase();
      if (blocked.includes(ext)) cb(new BadRequestException('不允许上传可执行文件'), false);
      else cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    const originalName = recoverUtf8FromLatin1(file.originalname);
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:8080';
    const fileUrl = `${baseUrl}/api/files/${file.filename}`;
    return { url: fileUrl, fileUrl, fileName: originalName, fileSize: file.size };
  }
}
