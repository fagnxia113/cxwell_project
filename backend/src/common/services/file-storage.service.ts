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
      this.logger.error('OSS configuration is incomplete! STORAGE_TYPE=oss but required env vars are missing. Set OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET or switch STORAGE_TYPE=local.');
      throw new Error('OSS configuration is incomplete. Check your environment variables.');
    }

    const useInternal = this.configService.get<string>('OSS_INTERNAL') === 'true';

    try {
      this.ossClient = new OSS({
        region,
        accessKeyId,
        accessKeySecret,
        bucket,
        internal: useInternal,
        secure: true,
        timeout: 120000,
      });
      this.logger.log(`OSS client initialized: bucket=${bucket}, region=${region}, internal=${useInternal}`);
    } catch (error) {
      this.logger.error('Failed to initialize OSS client! Please check your OSS configuration.', error);
      throw new Error('Failed to initialize OSS client. Check your OSS credentials and region.');
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
      return this.uploadToOSS(file.buffer, subDir, filename || file.originalname, file.size);
    }
    return this.uploadToLocal(file.buffer, subDir, filename || file.originalname, file.size);
  }

  async uploadFromPath(
    filePath: string,
    subDir: string,
    originalName: string,
    fileSize: number,
  ): Promise<UploadResult> {
    if (this.storageType === 'oss') {
      return this.uploadFileToOSS(filePath, subDir, originalName, fileSize);
    }
    return this.copyFileToLocal(filePath, subDir, originalName, fileSize);
  }

  private async uploadToLocal(
    buffer: Buffer,
    subDir: string,
    originalName: string,
    fileSize: number,
  ): Promise<UploadResult> {
    const dir = path.join(this.uploadPath, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalFilename = this.generateFilename(originalName);
    const filePath = path.join(dir, finalFilename);
    const relativePath = `${subDir}/${finalFilename}`;

    fs.writeFileSync(filePath, buffer);

    return {
      url: `${this.fileUrlPrefix}/${relativePath}`,
      path: relativePath,
      size: fileSize,
    };
  }

  private async uploadToOSS(
    content: Buffer,
    subDir: string,
    originalName: string,
    fileSize: number,
  ): Promise<UploadResult> {
    if (!this.ossClient) {
      throw new Error('OSS client not initialized. Cannot upload file.');
    }

    const finalFilename = this.generateFilename(originalName);
    const ossPath = `${subDir}/${finalFilename}`;

    try {
      const options: any = {
        headers: { 'x-oss-object-acl': 'public-read' },
      };

      if (fileSize > 10 * 1024 * 1024) {
        this.logger.log(`Large file (${(fileSize / 1024 / 1024).toFixed(2)}MB), using multipart upload: ${ossPath}`);
        await this.ossClient.multipartUpload(ossPath, content, {
          ...options,
          partSize: 5 * 1024 * 1024,
          parallel: 3,
        });
      } else {
        await this.ossClient.put(ossPath, content, options);
      }

      return {
        url: `${this.fileUrlPrefix}/${ossPath}`,
        path: ossPath,
        size: fileSize,
      };
    } catch (error) {
      this.logger.error(`OSS upload failed for "${ossPath}": ${error.message}`, error.stack);
      throw new Error(`文件上传到 OSS 失败，请重试。错误: ${error.message}`);
    }
  }

  private async uploadFileToOSS(
    filePath: string,
    subDir: string,
    originalName: string,
    fileSize: number,
  ): Promise<UploadResult> {
    if (!this.ossClient) {
      throw new Error('OSS client not initialized. Cannot upload file.');
    }

    const finalFilename = this.generateFilename(originalName);
    const ossPath = `${subDir}/${finalFilename}`;

    try {
      const options: any = {
        headers: { 'x-oss-object-acl': 'public-read' },
      };

      if (fileSize > 10 * 1024 * 1024) {
        this.logger.log(`Large file (${(fileSize / 1024 / 1024).toFixed(2)}MB), using multipart upload from stream: ${ossPath}`);
        const stream = fs.createReadStream(filePath);
        await this.ossClient.multipartUpload(ossPath, stream, {
          ...options,
          partSize: 5 * 1024 * 1024,
          parallel: 3,
        });
      } else {
        await this.ossClient.put(ossPath, filePath, options);
      }

      return {
        url: `${this.fileUrlPrefix}/${ossPath}`,
        path: ossPath,
        size: fileSize,
      };
    } catch (error) {
      this.logger.error(`OSS upload failed for "${ossPath}": ${error.message}`, error.stack);
      throw new Error(`文件上传到 OSS 失败，请重试。错误: ${error.message}`);
    }
  }

  private async copyFileToLocal(
    filePath: string,
    subDir: string,
    originalName: string,
    fileSize: number,
  ): Promise<UploadResult> {
    const dir = path.join(this.uploadPath, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalFilename = this.generateFilename(originalName);
    const destPath = path.join(dir, finalFilename);
    const relativePath = `${subDir}/${finalFilename}`;

    fs.copyFileSync(filePath, destPath);

    return {
      url: `${this.fileUrlPrefix}/${relativePath}`,
      path: relativePath,
      size: fileSize,
    };
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
      this.logger.error('Cannot delete from OSS: client not initialized');
      return false;
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
