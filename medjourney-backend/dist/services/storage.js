"use strict";
// 存储服务类 - 文件上传和管理
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = exports.LocalStorageService = exports.StorageServiceFactory = exports.multerConfig = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// 本地存储服务类
class LocalStorageService {
    uploadPath;
    baseUrl;
    constructor() {
        this.uploadPath = path_1.default.join(process.cwd(), 'uploads');
        this.baseUrl = `http://${config_1.config.server.host}:${config_1.config.server.port}/uploads`;
        this.ensureUploadDirectory();
    }
    async ensureUploadDirectory() {
        try {
            await promises_1.default.access(this.uploadPath);
        }
        catch {
            await promises_1.default.mkdir(this.uploadPath, { recursive: true });
            logger_1.logger.info('创建上传目录', { path: this.uploadPath });
        }
    }
    async uploadFile(file, bucket) {
        try {
            // 生成唯一文件名
            const fileExtension = path_1.default.extname(file.originalname);
            const filename = `${(0, uuid_1.v4)()}${fileExtension}`;
            const bucketPath = path_1.default.join(this.uploadPath, bucket);
            const filePath = path_1.default.join(bucketPath, filename);
            // 确保bucket目录存在
            await promises_1.default.mkdir(bucketPath, { recursive: true });
            // 验证文件类型
            this.validateFile(file);
            // 处理图片文件
            if (file.mimetype.startsWith('image/')) {
                await this.processImage(file.buffer, filePath);
            }
            else {
                await promises_1.default.writeFile(filePath, file.buffer);
            }
            const url = `${this.baseUrl}/${bucket}/${filename}`;
            logger_1.logger.info('文件上传成功', {
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
        }
        catch (error) {
            logger_1.logger.error('文件上传失败', error, {
                originalName: file.originalname,
                bucket
            });
            throw new errors_1.FileUploadError('文件上传失败');
        }
    }
    async deleteFile(filename, bucket) {
        try {
            const filePath = path_1.default.join(this.uploadPath, bucket, filename);
            await promises_1.default.unlink(filePath);
            logger_1.logger.info('文件删除成功', { filename, bucket });
            return true;
        }
        catch (error) {
            logger_1.logger.warn('文件删除失败', error, { filename, bucket });
            return false;
        }
    }
    async getFileUrl(filename, bucket) {
        return `${this.baseUrl}/${bucket}/${filename}`;
    }
    async listFiles(bucket, prefix) {
        try {
            const bucketPath = path_1.default.join(this.uploadPath, bucket);
            const files = await promises_1.default.readdir(bucketPath);
            if (prefix) {
                return files.filter(file => file.startsWith(prefix));
            }
            return files;
        }
        catch (error) {
            logger_1.logger.error('列出文件失败', error, { bucket, prefix });
            return [];
        }
    }
    validateFile(file) {
        // 检查文件大小
        if (file.size > config_1.config.storage.max_file_size) {
            throw new errors_1.FileUploadError(`文件大小超过限制 (${config_1.config.storage.max_file_size} bytes)`);
        }
        // 检查文件类型
        if (!config_1.config.storage.allowed_types.includes(file.mimetype)) {
            throw new errors_1.FileUploadError(`不支持的文件类型: ${file.mimetype}`);
        }
    }
    async processImage(buffer, outputPath) {
        try {
            // 使用sharp处理图片
            await (0, sharp_1.default)(buffer)
                .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
                .jpeg({ quality: 85 })
                .toFile(outputPath);
        }
        catch (error) {
            logger_1.logger.error('图片处理失败', error);
            throw new errors_1.FileUploadError('图片处理失败');
        }
    }
}
exports.LocalStorageService = LocalStorageService;
// Supabase存储服务类
class SupabaseStorageService {
    client;
    defaultBucket;
    constructor() {
        this.client = (0, supabase_js_1.createClient)(config_1.config.database.supabase_url, config_1.config.database.supabase_service_key);
        this.defaultBucket = config_1.config.storage.bucket_name;
    }
    async uploadFile(file, bucket = this.defaultBucket) {
        try {
            // 验证文件
            this.validateFile(file);
            // 生成唯一文件名
            const fileExtension = path_1.default.extname(file.originalname);
            const filename = `${Date.now()}_${(0, uuid_1.v4)()}${fileExtension}`;
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
            logger_1.logger.info('Supabase文件上传成功', {
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
        }
        catch (error) {
            logger_1.logger.error('Supabase文件上传失败', error, {
                originalName: file.originalname,
                bucket
            });
            throw new errors_1.FileUploadError('文件上传失败');
        }
    }
    async deleteFile(filename, bucket = this.defaultBucket) {
        try {
            const { error } = await this.client.storage
                .from(bucket)
                .remove([`${bucket}/${filename}`]);
            if (error) {
                throw error;
            }
            logger_1.logger.info('Supabase文件删除成功', { filename, bucket });
            return true;
        }
        catch (error) {
            logger_1.logger.warn('Supabase文件删除失败', error, { filename, bucket });
            return false;
        }
    }
    async getFileUrl(filename, bucket = this.defaultBucket) {
        const { data } = this.client.storage
            .from(bucket)
            .getPublicUrl(`${bucket}/${filename}`);
        return data.publicUrl;
    }
    async listFiles(bucket = this.defaultBucket, prefix) {
        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .list(prefix);
            if (error) {
                throw error;
            }
            return data?.map(file => file.name) || [];
        }
        catch (error) {
            logger_1.logger.error('Supabase列出文件失败', error, { bucket, prefix });
            return [];
        }
    }
    validateFile(file) {
        // 检查文件大小
        if (file.size > config_1.config.storage.max_file_size) {
            throw new errors_1.FileUploadError(`文件大小超过限制 (${config_1.config.storage.max_file_size} bytes)`);
        }
        // 检查文件类型
        if (!config_1.config.storage.allowed_types.includes(file.mimetype)) {
            throw new errors_1.FileUploadError(`不支持的文件类型: ${file.mimetype}`);
        }
    }
}
exports.SupabaseStorageService = SupabaseStorageService;
// Multer配置
exports.multerConfig = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: config_1.config.storage.max_file_size,
        files: 5 // 最多5个文件
    },
    fileFilter: (req, file, cb) => {
        if (config_1.config.storage.allowed_types.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new errors_1.FileUploadError(`不支持的文件类型: ${file.mimetype}`));
        }
    }
});
// 存储服务工厂
class StorageServiceFactory {
    static instance = null;
    static create() {
        if (StorageServiceFactory.instance) {
            return StorageServiceFactory.instance;
        }
        let service;
        // 在生产环境中优先使用Supabase存储
        if (config_1.config.server.env === 'production' && config_1.config.database.supabase_url !== 'https://localhost:54321') {
            try {
                service = new SupabaseStorageService();
                logger_1.logger.info('使用Supabase存储服务');
            }
            catch (error) {
                logger_1.logger.warn('Supabase存储初始化失败，使用本地存储', { error });
                service = new LocalStorageService();
            }
        }
        else {
            logger_1.logger.info('使用本地存储服务');
            service = new LocalStorageService();
        }
        StorageServiceFactory.instance = service;
        return service;
    }
    static getInstance() {
        return StorageServiceFactory.instance;
    }
    static reset() {
        StorageServiceFactory.instance = null;
    }
}
exports.StorageServiceFactory = StorageServiceFactory;
exports.default = StorageServiceFactory;
//# sourceMappingURL=storage.js.map