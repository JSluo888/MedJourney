// 中间件导出模块

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../utils/logger';
import ResponseHelper from '../utils/response';

// 请求ID中间件
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.http('请求开始', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // 响应结束时记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.http('请求完成', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length')
    });
  });

  next();
};

// CORS配置
export const corsConfig = cors({
  origin: (origin, callback) => {
    // 开发环境允许所有来源
    if (config.server.env === 'development') {
      callback(null, true);
      return;
    }
    
    // 生产环境检查允许的来源
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://medjourney.minimax.io',
      'https://medjourney-mvp.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS阻止的来源', { origin });
      callback(new Error('CORS策略不允许此来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Info'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining']
});

// 安全头配置
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// 速率限制配置
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求频率过高，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('速率限制触发', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.url
    });
    ResponseHelper.tooManyRequests(res, '请求频率过高，请稍后再试');
  }
});

// API速率限制（更严格）
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // API端点限制更严格
  message: {
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API请求频率过高，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('API速率限制触发', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.url
    });
    ResponseHelper.tooManyRequests(res, 'API请求频率过高，请稍后再试');
  }
});

// 响应压缩
export const compressionConfig = compression({
  filter: (req: Request, res: Response) => {
    // 对于图片和视频文件，不进行压缩
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // 大于1KB的响应才压缩
});

// 健康检查中间件
export const healthCheck = (req: Request, res: Response, next: NextFunction): void => {
  if (req.url === '/health' || req.url === '/health/') {
    ResponseHelper.success(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env,
      uptime: process.uptime()
    });
    return;
  }
  next();
};

// 错误处理中间件
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // 如果响应已经发送，委托给默认的Express错误处理器
  if (res.headersSent) {
    return next(err);
  }

  logger.error('未处理的错误', err, {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // 根据错误类型返回适当的响应
  if (err.name === 'ValidationError') {
    ResponseHelper.validationError(res, err.message, err.details);
  } else if (err.status === 404) {
    ResponseHelper.notFound(res, '请求的资源不存在');
  } else if (err.status === 401) {
    ResponseHelper.unauthorized(res, err.message || '认证失败');
  } else if (err.status === 403) {
    ResponseHelper.forbidden(res, err.message || '权限不足');
  } else if (err.status === 429) {
    ResponseHelper.tooManyRequests(res, err.message || '请求频率过高');
  } else {
    // 生产环境不暴露详细错误信息
    const message = config.server.env === 'production' 
      ? '服务器内部错误' 
      : err.message || '未知错误';
    
    ResponseHelper.internalError(res, message);
  }
};

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('404 - 路由未找到', {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  ResponseHelper.notFound(res, `路由 ${req.method} ${req.url} 不存在`);
};

// 导出所有中间件
export {
  authenticateToken,
  authorize,
  optionalAuth,
  validatePatientAccess,
  generateToken,
  verifyToken,
  refreshToken,
  revokeToken
} from './auth';

export {
  handleValidationErrors,
  validatePatientCreation,
  validatePatientUpdate,
  validateSessionCreation,
  validateMessageSend,
  validateMedicalHistoryImport,
  validateFamilyScore,
  validateIdParam,
  validatePagination,
  validateDateRange,
  validateSearch,
  validateFileUpload
} from './validation';

export default {
  requestId,
  requestLogger,
  corsConfig,
  securityHeaders,
  rateLimiter,
  apiRateLimiter,
  compressionConfig,
  healthCheck,
  errorHandler,
  notFoundHandler
};