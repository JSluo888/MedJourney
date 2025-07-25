"use strict";
// 文件上传路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storage_1 = require("../services/storage");
const middleware_1 = require("../middleware");
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const storageService = storage_1.StorageServiceFactory.create();
// 所有路由都需要认证
router.use(middleware_1.authenticateToken);
// 单文件上传
router.post('/single', storage_1.multerConfig.single('file'), middleware_1.validateFileUpload, async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errors_1.FileUploadError('请选择要上传的文件');
        }
        const bucket = req.body.bucket || 'documents';
        logger_1.logger.info('单文件上传请求', {
            requestId: req.requestId,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            bucket
        });
        const result = await storageService.uploadFile(req.file, bucket);
        logger_1.logger.info('单文件上传成功', {
            requestId: req.requestId,
            url: result.url,
            filename: result.filename
        });
        response_1.default.success(res, result, '文件上传成功');
    }
    catch (error) {
        logger_1.logger.error('单文件上传失败', error, {
            requestId: req.requestId,
            filename: req.file?.originalname
        });
        next(error);
    }
});
// 多文件上传
router.post('/multiple', storage_1.multerConfig.array('files', 5), middleware_1.validateFileUpload, async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new errors_1.FileUploadError('请选择要上传的文件');
        }
        const bucket = req.body.bucket || 'documents';
        logger_1.logger.info('多文件上传请求', {
            requestId: req.requestId,
            fileCount: files.length,
            bucket
        });
        const uploadPromises = files.map(file => storageService.uploadFile(file, bucket));
        const results = await Promise.all(uploadPromises);
        logger_1.logger.info('多文件上传成功', {
            requestId: req.requestId,
            uploadedCount: results.length
        });
        response_1.default.success(res, {
            files: results,
            uploaded_count: results.length
        }, '文件上传成功');
    }
    catch (error) {
        logger_1.logger.error('多文件上传失败', error, {
            requestId: req.requestId,
            fileCount: req.files?.length
        });
        next(error);
    }
});
// 获取文件URL
router.get('/url/:bucket/:filename', async (req, res, next) => {
    try {
        const { bucket, filename } = req.params;
        const url = await storageService.getFileUrl(filename, bucket);
        response_1.default.success(res, { url });
    }
    catch (error) {
        logger_1.logger.error('获取文件URL失败', error, {
            requestId: req.requestId,
            bucket: req.params.bucket,
            filename: req.params.filename
        });
        next(error);
    }
});
// 列出文件
router.get('/list/:bucket', async (req, res, next) => {
    try {
        const { bucket } = req.params;
        const prefix = req.query.prefix;
        const files = await storageService.listFiles(bucket, prefix);
        response_1.default.success(res, {
            bucket,
            prefix,
            files
        });
    }
    catch (error) {
        logger_1.logger.error('列出文件失败', error, {
            requestId: req.requestId,
            bucket: req.params.bucket
        });
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map