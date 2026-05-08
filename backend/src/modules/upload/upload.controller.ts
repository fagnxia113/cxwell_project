import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { FileStorageService } from '../../common/services/file-storage.service';

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
  constructor(private fileStorage: FileStorageService) {}

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
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    
    const originalName = recoverUtf8FromLatin1(file.originalname);
    const result = await this.fileStorage.uploadFromPath(file.path, 'uploads', file.originalname, file.size);

    try { fs.unlinkSync(file.path); } catch {}
    
    return { 
      url: result.url, 
      fileUrl: result.url, 
      fileName: originalName, 
      fileSize: result.size 
    };
  }
}
