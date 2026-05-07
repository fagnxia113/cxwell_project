import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import OSS = require('ali-oss');

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private storageType: 'local' | 'oss';
  private readonly uploadPath: string;
  private readonly fileUrlPrefix: string;
  private ossClient: OSS | null = null;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE') === 'oss' ? 'oss' : 'local';
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.fileUrlPrefix = this.configService.get<string>('FILE_URL_PREFIX') || '/api/files';

    if (this.storageType === 'oss') {
      this.initOSS();
    } else {
      this.ensureUploadDir();
    }
  }

  private initOSS() {
    const region = this.configService.get<string>('OSS_REGION');
    const accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET');
    const bucket = this.configService.get<string>('OSS_BUCKET');

    if (!region || !accessKeyId || !accessKeySecret || !bucket) {
      this.logger.error('OSS configuration is incomplete, falling back to local storage');
      this.storageType = 'local';
      this.ensureUploadDir();
      return;
    }

    try {
      this.ossClient = new OSS({
        region,
        accessKeyId,
        accessKeySecret,
        bucket,
        internal: this.configService.get<string>('OSS_INTERNAL') !== 'false',
        secure: true,
      });
      this.logger.log(`OSS client initialized: bucket=${bucket}, region=${region}`);
    } catch (error) {
      this.logger.error('Failed to initialize OSS client, falling back to local storage', error);
      this.storageType = 'local';
      this.ensureUploadDir();
    }
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    subDir: string,
    filename?: string
  ): Promise<UploadResult> {
    if (this.storageType === 'oss') {
      return this.uploadToOSS(file, subDir, filename);
    }
    return this.uploadToLocal(file, subDir, filename);
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    subDir: string,
    filename?: string
  ): Promise<UploadResult> {
    const dir = path.join(this.uploadPath, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalFilename = filename || this.generateFilename(file.originalname);
    const filePath = path.join(dir, finalFilename);
    const relativePath = `${subDir}/${finalFilename}`;

    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `${this.fileUrlPrefix}/${relativePath}`,
      path: relativePath,
      size: file.size,
    };
  }

  private async uploadToOSS(
    file: Express.Multer.File,
    subDir: string,
    filename?: string
  ): Promise<UploadResult> {
    if (!this.ossClient) {
      throw new Error('OSS client not initialized');
    }

    const finalFilename = filename || this.generateFilename(file.originalname);
    const ossPath = `${subDir}/${finalFilename}`;

    try {
      await this.ossClient.put(ossPath, file.buffer, {
        headers: { 'x-oss-object-acl': 'public-read' },
      });
      
      return {
        url: `${this.fileUrlPrefix}/${ossPath}`,
        path: ossPath,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('Failed to upload to OSS, falling back to local', error);
      return this.uploadToLocal(file, subDir, filename);
    }
  }

  async delete(filePath: string): Promise<boolean> {
    if (this.storageType === 'oss') {
      return this.deleteFromOSS(filePath);
    }
    return this.deleteFromLocal(filePath);
  }

  private async deleteFromLocal(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadPath, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch (error) {
      this.logger.error('Failed to delete local file', error);
      return false;
    }
  }

  private async deleteFromOSS(filePath: string): Promise<boolean> {
    if (!this.ossClient) {
      return this.deleteFromLocal(filePath);
    }

    try {
      await this.ossClient.delete(filePath);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete from OSS', error);
      return false;
    }
  }

  private generateFilename(originalName: string): string {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const ext = path.extname(originalName);
    return `${randomName}${ext}`;
  }

  getStorageType(): string {
    return this.storageType;
  }

  getFileUrlPrefix(): string {
    return this.fileUrlPrefix;
  }
}
