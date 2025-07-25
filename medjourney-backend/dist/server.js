"use strict";
// Express服务器配置
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedJourneyServer = void 0;
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const middleware_1 = require("./middleware");
const routes_1 = __importDefault(require("./routes"));
const database_1 = require("./services/database");
const ai_1 = require("./services/ai");
const rag_1 = __importDefault(require("./services/rag"));
const storage_1 = require("./services/storage");
const path_1 = __importDefault(require("path"));
class MedJourneyServer {
    app;
    server;
    constructor() {
        this.app = (0, express_1.default)();
    }
    // 初始化服务器
    async initialize() {
        try {
            logger_1.logger.info('MedJourney后端服务初始化中...');
            // 初始化服务
            await this.initializeServices();
            // 配置中间件
            this.configureMiddleware();
            // 配置路由
            this.configureRoutes();
            // 配置错误处理
            this.configureErrorHandling();
            logger_1.logger.info('MedJourney后端服务初始化完成');
        }
        catch (error) {
            logger_1.logger.error('服务初始化失败', error);
            throw error;
        }
    }
    // 初始化服务
    async initializeServices() {
        try {
            logger_1.logger.info('初始化核心服务...');
            // 初始化数据库服务
            await database_1.DatabaseServiceFactory.create();
            logger_1.logger.info('✓ 数据库服务初始化完成');
            // 初始化AI服务
            await ai_1.AIServiceFactory.create();
            logger_1.logger.info('✓ AI服务初始化完成');
            // 初始化RAG服务
            await rag_1.default.create();
            logger_1.logger.info('✓ RAG服务初始化完成');
            // 初始化存储服务
            storage_1.StorageServiceFactory.create();
            logger_1.logger.info('✓ 存储服务初始化完成');
            logger_1.logger.info('所有核心服务初始化完成');
        }
        catch (error) {
            logger_1.logger.error('服务初始化失败', error);
            throw error;
        }
    }
    // 配置中间件
    configureMiddleware() {
        logger_1.logger.info('配置中间件...');
        // 基础中间件
        this.app.use(middleware_1.requestId);
        this.app.use(middleware_1.requestLogger);
        this.app.use(middleware_1.corsConfig);
        this.app.use(middleware_1.securityHeaders);
        this.app.use(middleware_1.compressionConfig);
        // 请求解析
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // 限流中间件
        this.app.use(middleware_1.rateLimiter);
        // 静态文件服务（仅在开发环境）
        if (config_1.config.server.env === 'development') {
            this.app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
        }
        logger_1.logger.info('中间件配置完成');
    }
    // 配置路由
    configureRoutes() {
        logger_1.logger.info('配置路由...');
        // API路由
        this.app.use('/api', routes_1.default);
        // 根路径
        this.app.get('/', (req, res) => {
            res.json({
                name: 'MedJourney API Server',
                version: '1.0.0',
                status: 'running',
                environment: config_1.config.server.env,
                timestamp: new Date().toISOString(),
                endpoints: {
                    api: '/api/v1',
                    health: '/health',
                    docs: '/api/v1'
                }
            });
        });
        logger_1.logger.info('路由配置完成');
    }
    // 配置错误处理
    configureErrorHandling() {
        logger_1.logger.info('配置错误处理...');
        // 404处理
        this.app.use(middleware_1.notFoundHandler);
        // 全局错误处理
        this.app.use(middleware_1.errorHandler);
        // 全局异常处理
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('未捕获的异常', error);
            this.gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('未处理的Promise拒绝', new Error(reason));
            this.gracefulShutdown('UNHANDLED_REJECTION');
        });
        // 信号处理
        process.on('SIGTERM', () => {
            logger_1.logger.info('收到SIGTERM信号，开始优雅关闭...');
            this.gracefulShutdown('SIGTERM');
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('收到SIGINT信号，开始优雅关闭...');
            this.gracefulShutdown('SIGINT');
        });
        logger_1.logger.info('错误处理配置完成');
    }
    // 启动服务器
    async start() {
        try {
            await this.initialize();
            this.server = this.app.listen(config_1.config.server.port, config_1.config.server.host, () => {
                logger_1.logger.info(`🎉 MedJourney后端服务启动成功`, {
                    host: config_1.config.server.host,
                    port: config_1.config.server.port,
                    env: config_1.config.server.env,
                    api_url: `http://${config_1.config.server.host}:${config_1.config.server.port}/api/v1`,
                    health_url: `http://${config_1.config.server.host}:${config_1.config.server.port}/health`
                });
            });
            // 设置服务器超时
            this.server.timeout = 30000; // 30秒
            this.server.keepAliveTimeout = 65000; // 65秒
            this.server.headersTimeout = 66000; // 66秒
        }
        catch (error) {
            logger_1.logger.error('服务器启动失败', error);
            process.exit(1);
        }
    }
    // 优雅关闭
    gracefulShutdown(signal) {
        logger_1.logger.info(`收到${signal}信号，开始优雅关闭服务器...`);
        if (this.server) {
            this.server.close((error) => {
                if (error) {
                    logger_1.logger.error('服务器关闭失败', error);
                    process.exit(1);
                }
                logger_1.logger.info('服务器已优雅关闭');
                process.exit(0);
            });
            // 强制关闭超时
            setTimeout(() => {
                logger_1.logger.warn('强制关闭服务器');
                process.exit(1);
            }, 10000);
        }
        else {
            process.exit(0);
        }
    }
    // 获取Express应用实例（用于测试）
    getApp() {
        return this.app;
    }
}
exports.MedJourneyServer = MedJourneyServer;
exports.default = MedJourneyServer;
//# sourceMappingURL=server.js.map