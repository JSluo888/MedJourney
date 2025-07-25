// 统一日志管理服务

import winston from 'winston';
import { config } from '../config';
import { LoggerService } from '../types/services';

// 日志级别配置
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 日志颜色配置
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// 创建 Winston 日志器
const createWinstonLogger = () => {
  const transports: winston.transport[] = [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta, null, 2)}`;
          }
          return log;
        })
      )
    })
  ];

  // 生产环境下添加文件输出
  if (config.server.env === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      })
    );
  }

  return winston.createLogger({
    levels: logLevels,
    level: config.server.env === 'production' ? 'info' : 'debug',
    transports,
    exceptionHandlers: [
      new winston.transports.Console(),
      ...(config.server.env === 'production' ? [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ] : [])
    ],
    rejectionHandlers: [
      new winston.transports.Console(),
      ...(config.server.env === 'production' ? [
        new winston.transports.File({ filename: 'logs/rejections.log' })
      ] : [])
    ]
  });
};

// 日志服务类
class Logger implements LoggerService {
  private winston: winston.Logger;
  private requestIdStore: Map<string, string> = new Map();

  constructor() {
    winston.addColors(logColors);
    this.winston = createWinstonLogger();
  }

  // 设置请求ID上下文
  setRequestId(requestId: string, context: string): void {
    this.requestIdStore.set(requestId, context);
  }

  // 清理请求ID上下文
  clearRequestId(requestId: string): void {
    this.requestIdStore.delete(requestId);
  }

  // 获取请求上下文
  private getContext(meta: any = {}): any {
    const requestId = meta.requestId;
    const context = requestId ? this.requestIdStore.get(requestId) : undefined;
    
    return {
      ...meta,
      ...(context && { context }),
      ...(requestId && { requestId })
    };
  }

  info(message: string, meta: any = {}): void {
    this.winston.info(message, this.getContext(meta));
  }

  warn(message: string, meta: any = {}): void {
    this.winston.warn(message, this.getContext(meta));
  }

  error(message: string, error?: Error, meta: any = {}): void {
    const errorMeta = {
      ...this.getContext(meta),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };
    this.winston.error(message, errorMeta);
  }

  debug(message: string, meta: any = {}): void {
    this.winston.debug(message, this.getContext(meta));
  }

  // 安全审计日志
  audit(action: string, userId: string, details: any): void {
    this.winston.info('AUDIT', {
      type: 'audit',
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 性能监控日志
  performance(operation: string, duration: number, meta: any = {}): void {
    this.winston.info('PERFORMANCE', {
      type: 'performance',
      operation,
      duration,
      ...meta
    });
  }

  // HTTP请求日志
  http(method: string, url: string, statusCode: number, responseTime: number, meta: any = {}): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.winston.log(level, 'HTTP', {
      type: 'http',
      method,
      url,
      statusCode,
      responseTime,
      ...meta
    });
  }

  // 数据库操作日志
  database(operation: string, table: string, duration: number, success: boolean, meta: any = {}): void {
    const level = success ? 'debug' : 'error';
    this.winston.log(level, 'DATABASE', {
      type: 'database',
      operation,
      table,
      duration,
      success,
      ...meta
    });
  }

  // AI服务日志
  ai(operation: string, model: string, tokens: number, duration: number, meta: any = {}): void {
    this.winston.info('AI_SERVICE', {
      type: 'ai',
      operation,
      model,
      tokens,
      duration,
      ...meta
    });
  }

  // 安全事件日志
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.winston.log(level, 'SECURITY', {
      type: 'security',
      event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

// 全局日志器实例
export const logger = new Logger();

// 导出Express中间件
export const requestLogger = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  logger.setRequestId(requestId, `${req.method} ${req.url}`);
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req.method, req.url, res.statusCode, duration, {
      requestId,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    logger.clearRequestId(requestId);
  });
  
  next();
};

export default logger;