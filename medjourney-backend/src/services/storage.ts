// 存储服务类 - 文件上传和管理

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { config } from '../config';
import { logger } from '../utils/logger';
import { FileUploadError } from '../utils/errors';
import { StorageService } from '../types/services';

// 本地存储服务类
class LocalStorageService implements StorageService {
  private uploadPath: string;
  private baseUrl: string;

  constructor() {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.baseUrl = `http://${config.server.host}:${config.server.port}/uploads`;
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      logger.info('创建上传目录', { path: this.uploadPath });
    }
  }

  async uploadFile(file: Express.Multer.File, bucket: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    try {
      // 生成唯一文件名
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const bucketPath = path.join(this.uploadPath, bucket);
      const filePath = path.join(bucketPath, filename);

      // 确保bucket目录存在
      await fs.mkdir(bucketPath, { recursive: true });

      // 验证文件类型
      this.validateFile(file);

      // 处理图片文件
      if (file.mimetype.startsWith('image/')) {
        await this.processImage(file.buffer, filePath);
      } else {
        await fs.writeFile(filePath, file.buffer);
      }

      const url = `${this.baseUrl}/${bucket}/${filename}`;
      
      logger.info('文件上传成功', {
        filename,
        originalName: file.originalname,
        size: file.size,
        bucket
      });

      return {
        url,
        filename,
        size: file.size
      };
    } catch (error) {
      logger.error('文件上传失败', error as Error, {
        originalName: file.originalname,
        bucket
      });
      throw new FileUploadError('文件上传失败');
    }
  }

  async deleteFile(filename: string, bucket: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, bucket, filename);
      await fs.unlink(filePath);
      
      logger.info('文件删除成功', { filename, bucket });
      return true;
    } catch (error) {
      logger.warn('文件删除失败', error as Error, { filename, bucket });
      return false;
    }
  }

  async getFileUrl(filename: string, bucket: string): Promise<string> {
    return `${this.baseUrl}/${bucket}/${filename}`;
  }

  async listFiles(bucket: string, prefix?: string): Promise<string[]> {
    try {
      const bucketPath = path.join(this.uploadPath, bucket);
      const files = await fs.readdir(bucketPath);
      
      if (prefix) {
        return files.filter(file => file.startsWith(prefix));
      }
      
      return files;
    } catch (error) {
      logger.error('列出文件失败', error as Error, { bucket, prefix });
      return [];
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // 检查文件大小
    if (file.size > config.storage.max_file_size) {
      throw new FileUploadError(`文件大小超过限制 (${config.storage.max_file_size} bytes)`);
    }

    // 检查文件类型
    if (!config.storage.allowed_types.includes(file.mimetype)) {
      throw new FileUploadError(`不支持的文件类型: ${file.mimetype}`);
    }
  }

  private async processImage(buffer: Buffer, outputPath: string): Promise<void> {
    try {
      // 使用sharp处理图片
      await sharp(buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    } catch (error) {
      logger.error('图片处理失败', error as Error);
      throw new FileUploadError('图片处理失败');
    }
  }
}

// Supabase存储服务类
class SupabaseStorageService implements StorageService {
  private client: SupabaseClient;
  private defaultBucket: string;

  constructor() {
    this.client = createClient(
      config.database.supabase_url,
      config.database.supabase_service_key
    );
    this.defaultBucket = config.storage.bucket_name;
  }

  async uploadFile(file: Express.Multer.File, bucket: string = this.defaultBucket): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    try {
      // 验证文件
      this.validateFile(file);

      // 生成唯一文件名
      const fileExtension = path.extname(file.originalname);
      const filename = `${Date.now()}_${uuidv4()}${fileExtension}`;
      const filePath = `${bucket}/${filename}`;

      // 上传文件到Supabase存储
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw error;
      }

      // 获取公共URL
      const { data: publicData } = this.client.storage
        .from(bucket)
        .getPublicUrl(filePath);

      logger.info('Supabase文件上传成功', {
        filename,
        originalName: file.originalname,
        size: file.size,
        bucket
      });

      return {
        url: publicData.publicUrl,
        filename,
        size: file.size
      };
    } catch (error) {
      logger.error('Supabase文件上传失败', error as Error, {
        originalName: file.originalname,
        bucket
      });
      throw new FileUploadError('文件上传失败');
    }
  }

  async deleteFile(filename: string, bucket: string = this.defaultBucket): Promise<boolean> {
    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([`${bucket}/${filename}`]);

      if (error) {
        throw error;
      }

      logger.info('Supabase文件删除成功', { filename, bucket });
      return true;
    } catch (error) {
      logger.warn('Supabase文件删除失败', error as Error, { filename, bucket });
      return false;
    }
  }

  async getFileUrl(filename: string, bucket: string = this.defaultBucket): Promise<string> {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(`${bucket}/${filename}`);
    
    return data.publicUrl;
  }

  async listFiles(bucket: string = this.defaultBucket, prefix?: string): Promise<string[]> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(prefix);

      if (error) {
        throw error;
      }

      return data?.map(file => file.name) || [];
    } catch (error) {
      logger.error('Supabase列出文件失败', error as Error, { bucket, prefix });
      return [];
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // 检查文件大小
    if (file.size > config.storage.max_file_size) {
      throw new FileUploadError(`文件大小超过限制 (${config.storage.max_file_size} bytes)`);
    }

    // 检查文件类型
    if (!config.storage.allowed_types.includes(file.mimetype)) {
      throw new FileUploadError(`不支持的文件类型: ${file.mimetype}`);
    }
  }
}

// Multer配置
export const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.max_file_size,
    files: 5 // 最多5个文件
  },
  fileFilter: (req, file, cb) => {
    if (config.storage.allowed_types.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

// 存储服务工厂
class StorageServiceFactory {
  private static instance: StorageService | null = null;

  static create(): StorageService {
    if (StorageServiceFactory.instance) {
      return StorageServiceFactory.instance;
    }

    let service: StorageService;
    
    // 在生产环境中优先使用Supabase存储
    if (config.server.env === 'production' && config.database.supabase_url !== 'https://localhost:54321') {
      try {
        service = new SupabaseStorageService();
        logger.info('使用Supabase存储服务');
      } catch (error) {
        logger.warn('Supabase存储初始化失败，使用本地存储', { error });
        service = new LocalStorageService();
      }
    } else {
      logger.info('使用本地存储服务');
      service = new LocalStorageService();
    }

    StorageServiceFactory.instance = service;
    return service;
  }

  static getInstance(): StorageService | null {
    return StorageServiceFactory.instance;
  }

  static reset(): void {
    StorageServiceFactory.instance = null;
  }
}

export { StorageServiceFactory, LocalStorageService, SupabaseStorageService };
export default StorageServiceFactory;