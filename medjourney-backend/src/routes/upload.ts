// 文件上传路由

import { Router } from 'express';
import { StorageServiceFactory, multerConfig } from '../services/storage';
import {
  validateFileUpload,
  authenticateToken
} from '../middleware';
import { logger } from '../utils/logger';
import ResponseHelper from '../utils/response';
import { Request, Response, NextFunction } from 'express';
import { FileUploadError } from '../utils/errors';

const router = Router();
const storageService = StorageServiceFactory.create();

// 所有路由都需要认证
router.use(authenticateToken);

// 单文件上传
router.post(
  '/single',
  multerConfig.single('file'),
  validateFileUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new FileUploadError('请选择要上传的文件');
      }

      const bucket = req.body.bucket || 'documents';
      
      logger.info('单文件上传请求', {
        requestId: req.requestId,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        bucket
      });

      const result = await storageService.uploadFile(req.file, bucket);

      logger.info('单文件上传成功', {
        requestId: req.requestId,
        url: result.url,
        filename: result.filename
      });

      ResponseHelper.success(res, result, '文件上传成功');
    } catch (error) {
      logger.error('单文件上传失败', error as Error, {
        requestId: req.requestId,
        filename: req.file?.originalname
      });
      next(error);
    }
  }
);

// 多文件上传
router.post(
  '/multiple',
  multerConfig.array('files', 5),
  validateFileUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new FileUploadError('请选择要上传的文件');
      }

      const bucket = req.body.bucket || 'documents';
      
      logger.info('多文件上传请求', {
        requestId: req.requestId,
        fileCount: files.length,
        bucket
      });

      const uploadPromises = files.map(file => 
        storageService.uploadFile(file, bucket)
      );

      const results = await Promise.all(uploadPromises);

      logger.info('多文件上传成功', {
        requestId: req.requestId,
        uploadedCount: results.length
      });

      ResponseHelper.success(res, {
        files: results,
        uploaded_count: results.length
      }, '文件上传成功');
    } catch (error) {
      logger.error('多文件上传失败', error as Error, {
        requestId: req.requestId,
        fileCount: (req.files as Express.Multer.File[])?.length
      });
      next(error);
    }
  }
);

// 获取文件URL
router.get(
  '/url/:bucket/:filename',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bucket, filename } = req.params;
      
      const url = await storageService.getFileUrl(filename, bucket);
      
      ResponseHelper.success(res, { url });
    } catch (error) {
      logger.error('获取文件URL失败', error as Error, {
        requestId: req.requestId,
        bucket: req.params.bucket,
        filename: req.params.filename
      });
      next(error);
    }
  }
);

// 列出文件
router.get(
  '/list/:bucket',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bucket } = req.params;
      const prefix = req.query.prefix as string;
      
      const files = await storageService.listFiles(bucket, prefix);
      
      ResponseHelper.success(res, {
        bucket,
        prefix,
        files
      });
    } catch (error) {
      logger.error('列出文件失败', error as Error, {
        requestId: req.requestId,
        bucket: req.params.bucket
      });
      next(error);
    }
  }
);

export default router;