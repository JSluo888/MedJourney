// Express服务器配置

import express from 'express';
import { config } from './config';
import { logger } from './utils/logger';
import {
  requestId,
  requestLogger,
  corsConfig,
  securityHeaders,
  rateLimiter,
  compressionConfig,
  errorHandler,
  notFoundHandler
} from './middleware';
import routes from './routes';
import { DatabaseServiceFactory } from './services/database';
import { AIServiceFactory } from './services/ai';
import RAGServiceFactory from './services/rag';
import { StorageServiceFactory } from './services/storage';
import path from 'path';

class MedJourneyServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
  }

  // 初始化服务器
  async initialize(): Promise<void> {
    try {
      logger.info('MedJourney后端服务初始化中...');

      // 初始化服务
      await this.initializeServices();

      // 配置中间件
      this.configureMiddleware();

      // 配置路由
      this.configureRoutes();

      // 配置错误处理
      this.configureErrorHandling();

      logger.info('MedJourney后端服务初始化完成');
    } catch (error) {
      logger.error('服务初始化失败', error as Error);
      throw error;
    }
  }

  // 初始化服务
  private async initializeServices(): Promise<void> {
    try {
      logger.info('初始化核心服务...');

      // 初始化数据库服务
      await DatabaseServiceFactory.create();
      logger.info('✓ 数据库服务初始化完成');

      // 初始化AI服务
      await AIServiceFactory.create();
      logger.info('✓ AI服务初始化完成');

      // 初始化RAG服务
      await RAGServiceFactory.create();
      logger.info('✓ RAG服务初始化完成');

      // 初始化存储服务
      StorageServiceFactory.create();
      logger.info('✓ 存储服务初始化完成');

      logger.info('所有核心服务初始化完成');
    } catch (error) {
      logger.error('服务初始化失败', error as Error);
      throw error;
    }
  }

  // 配置中间件
  private configureMiddleware(): void {
    logger.info('配置中间件...');

    // 基础中间件
    this.app.use(requestId);
    this.app.use(requestLogger);
    this.app.use(corsConfig);
    this.app.use(securityHeaders);
    this.app.use(compressionConfig);

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 限流中间件
    this.app.use(rateLimiter);

    // 静态文件服务（仅在开发环境）
    if (config.server.env === 'development') {
      this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    }

    logger.info('中间件配置完成');
  }

  // 配置路由
  private configureRoutes(): void {
    logger.info('配置路由...');

    // API路由
    this.app.use('/api', routes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        name: 'MedJourney API Server',
        version: '1.0.0',
        status: 'running',
        environment: config.server.env,
        timestamp: new Date().toISOString(),
        endpoints: {
          api: '/api/v1',
          health: '/health',
          docs: '/api/v1'
        }
      });
    });

    logger.info('路由配置完成');
  }

  // 配置错误处理
  private configureErrorHandling(): void {
    logger.info('配置错误处理...');

    // 404处理
    this.app.use(notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler);

    // 全局异常处理
    process.on('uncaughtException', (error: Error) => {
      logger.error('未捕获的异常', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('未处理的Promise拒绝', new Error(reason));
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // 信号处理
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，开始优雅关闭...');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，开始优雅关闭...');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('错误处理配置完成');
  }

  // 启动服务器
  async start(): Promise<void> {
    try {
      await this.initialize();

      this.server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🎉 MedJourney后端服务启动成功`, {
          host: config.server.host,
          port: config.server.port,
          env: config.server.env,
          api_url: `http://${config.server.host}:${config.server.port}/api/v1`,
          health_url: `http://${config.server.host}:${config.server.port}/health`
        });
      });

      // 设置服务器超时
      this.server.timeout = 30000; // 30秒
      this.server.keepAliveTimeout = 65000; // 65秒
      this.server.headersTimeout = 66000; // 66秒

    } catch (error) {
      logger.error('服务器启动失败', error as Error);
      process.exit(1);
    }
  }

  // 优雅关闭
  private gracefulShutdown(signal: string): void {
    logger.info(`收到${signal}信号，开始优雅关闭服务器...`);

    if (this.server) {
      this.server.close((error: any) => {
        if (error) {
          logger.error('服务器关闭失败', error);
          process.exit(1);
        }

        logger.info('服务器已优雅关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.warn('强制关闭服务器');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  // 获取Express应用实例（用于测试）
  getApp(): express.Application {
    return this.app;
  }
}

export default MedJourneyServer;
export { MedJourneyServer };