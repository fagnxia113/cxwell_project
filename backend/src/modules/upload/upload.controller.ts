import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
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
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    
    const originalName = recoverUtf8FromLatin1(file.originalname);
    const result = await this.fileStorage.upload(file, 'uploads');
    
    return { 
      url: result.url, 
      fileUrl: result.url, 
      fileName: originalName, 
      fileSize: result.size 
    };
  }
}
