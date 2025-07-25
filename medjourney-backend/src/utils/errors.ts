// 错误处理工具类

import { AppError } from '../types';

// 自定义错误类
export class CustomError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 常见错误类型
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    if (details) {
      (this as any).details = details;
    }
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string) {
    super(`${resource} 未找到`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor() {
    super('请求频率过高，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(service: string) {
    super(`${service} 服务不可用`, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(`数据库错误: ${message}`, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    if (originalError) {
      (this as any).originalError = originalError;
    }
  }
}

export class AIServiceError extends CustomError {
  constructor(message: string, service: string = 'AI') {
    super(`${service}服务错误: ${message}`, 500, 'AI_SERVICE_ERROR');
    this.name = 'AIServiceError';
  }
}

export class FileUploadError extends CustomError {
  constructor(message: string) {
    super(`文件上传错误: ${message}`, 400, 'FILE_UPLOAD_ERROR');
    this.name = 'FileUploadError';
  }
}

// 错误处理工具函数
export class ErrorHandler {
  
  // 判断是否为可操作错误
  static isOperationalError(error: Error): boolean {
    if (error instanceof CustomError) {
      return error.isOperational;
    }
    return false;
  }

  // 将错误转换为API响应格式
  static toApiResponse(error: Error, requestId?: string) {
    if (error instanceof CustomError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error as any).details && { details: (error as any).details },
          timestamp: new Date(),
          ...(requestId && { request_id: requestId })
        }
      };
    }

    // 未知错误
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
        timestamp: new Date(),
        ...(requestId && { request_id: requestId })
      }
    };
  }

  // 获取HTTP状态码
  static getStatusCode(error: Error): number {
    if (error instanceof CustomError) {
      return error.statusCode;
    }
    return 500;
  }

  // 错误日志记录
  static logError(error: Error, context?: any): void {
    const logger = require('./logger').logger;
    
    if (ErrorHandler.isOperationalError(error)) {
      logger.warn(`Operational Error: ${error.message}`, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      });
    } else {
      logger.error(`Unexpected Error: ${error.message}`, error, { context });
    }
  }

  // 处理异步错误
  static handleAsyncError(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Express错误处理中间件
  static expressErrorHandler() {
    return (error: Error, req: any, res: any, next: any) => {
      const requestId = req.requestId;
      
      // 记录错误
      ErrorHandler.logError(error, {
        requestId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      });

      // 返回错误响应
      const statusCode = ErrorHandler.getStatusCode(error);
      const apiResponse = ErrorHandler.toApiResponse(error, requestId);
      
      res.status(statusCode).json(apiResponse);
    };
  }

  // 全局未捕获异常处理
  static setupGlobalHandlers(): void {
    const logger = require('./logger').logger;

    // 未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      
      // 在生产环境中优雅关闭
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

    // 未处理的Promise拒绝
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', new Error(reason), { promise });
      
      // 在生产环境中优雅关闭
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

    // 优雅关闭信号
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }
}

// 验证工具
export class ValidationHelper {
  
  // 验证必填字段
  static required(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} 为必填字段`);
    }
  }

  // 验证字符串长度
  static stringLength(value: string, min: number, max: number, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} 必须为字符串`);
    }
    if (value.length < min || value.length > max) {
      throw new ValidationError(`${fieldName} 长度必须在2${min}-${max}个字符之间`);
    }
  }

  // 验证邮箱格式
  static email(value: string, fieldName: string = '邮箱'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} 格式不正确`);
    }
  }

  // 验证数字范围
  static numberRange(value: number, min: number, max: number, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} 必须为数字`);
    }
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} 必须在2${min}-${max}之间`);
    }
  }

  // 验证UUID格式
  static uuid(value: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} 必须为有效的UUID格式`);
    }
  }

  // 验证数组
  static array(value: any, fieldName: string, minLength: number = 0, maxLength?: number): void {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} 必须为数组`);
    }
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} 至少包含${minLength}个元素`);
    }
    if (maxLength && value.length > maxLength) {
      throw new ValidationError(`${fieldName} 最多包含${maxLength}个元素`);
    }
  }
}

export default ErrorHandler;