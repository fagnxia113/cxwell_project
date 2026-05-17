import { Controller, Post, Get, Query, Req, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { Readable } from 'stream';
import { FileStorageService } from '../../common/services/file-storage.service';
import { Public } from '../../auth/public.decorator';

function recoverUtf8FromLatin1(str: string): string {
  try {
    const buf = Buffer.from(str, 'binary');
    const decoded = iconv.decode(buf, 'utf8');
    if (decoded && /[\u4e00-\u9fa5]/.test(decoded)) return decoded;
  } catch {}
  return str;
}

const MIME_MAP: Record<string, string> = {
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
  'webp': 'image/webp', 'svg': 'image/svg+xml', 'bmp': 'image/bmp', 'ico': 'image/x-icon',
  'tiff': 'image/tiff', 'tif': 'image/tiff', 'avif': 'image/avif',
  'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg', 'mov': 'video/quicktime',
  'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'aac': 'audio/aac', 'flac': 'audio/flac',
  'm4a': 'audio/mp4', 'wma': 'audio/x-ms-wma', 'opus': 'audio/opus',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain', 'csv': 'text/csv', 'rtf': 'application/rtf',
  'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed', 'tar': 'application/x-tar', 'gz': 'application/gzip',
};

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

  @Public()
  @Get('serve')
  async serveFile(@Query('path') filePath: string, @Req() req: any, @Res() res: any) {
    if (!filePath || filePath.includes('..') || filePath.includes('\0')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    if (this.fileStorage.getStorageType() === 'oss') {
      const fileUrl = `${this.fileStorage.getFileUrlPrefix()}/${filePath}`;

      try {
        const fetchHeaders: Record<string, string> = {};
        if (req.headers.range) {
          fetchHeaders['Range'] = req.headers.range;
        }

        const response = await fetch(fileUrl, { headers: fetchHeaders });

        if (!response.ok && response.status !== 206) {
          return res.status(response.status).json({ error: 'File not found' });
        }

        res.status(response.status);

        const forwardHeaders = ['content-length', 'content-range', 'accept-ranges'];
        for (const h of forwardHeaders) {
          if (response.headers.has(h)) {
            res.setHeader(h, response.headers.get(h));
          }
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.removeHeader('X-Frame-Options');

        if (response.body) {
          const nodeStream = Readable.fromWeb(response.body as any);
          nodeStream.pipe(res);
        } else {
          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
        }
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch file' });
      }
    } else {
      const localPath = join(process.cwd(), process.env.UPLOAD_PATH || 'uploads', filePath);

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stat = fs.statSync(localPath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.removeHeader('X-Frame-Options');

      if (req.headers.range) {
        const range = req.headers.range;
        const match = range.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
          const chunkSize = end - start + 1;

          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
          res.setHeader('Content-Length', chunkSize);
          res.setHeader('Accept-Ranges', 'bytes');

          const stream = fs.createReadStream(localPath, { start, end });
          stream.pipe(res);
          return;
        }
      }

      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      const stream = fs.createReadStream(localPath);
      stream.pipe(res);
    }
  }
}
