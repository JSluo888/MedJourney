// API响应工具类

import { Response } from 'express';
import { PaginatedResponse, ApiResponse } from '../types/api';
import { logger } from './logger';

class ResponseHelper {
  // 成功响应
  static success<T>(res: Response, data: T, message: string = 'Success'): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(response);
  }

  // 分页响应
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message: string = 'Success'
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(response);
  }

  // 创建成功响应
  static created<T>(res: Response, data: T, message: string = 'Created successfully'): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    res.status(201).json(response);
  }

  // 无内容响应
  static noContent(res: Response): void {
    res.status(204).send();
  }

  // 错误响应
  static error(
    res: Response, 
    message: string = 'Internal server error', 
    statusCode: number = 500,
    details?: any
  ): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: details ? { details } : undefined,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }

  // 验证错误响应
  static validationError(
    res: Response, 
    message: string = 'Validation failed', 
    errors: any[] = []
  ): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        details: errors
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(400).json(response);
  }

  // 未授权响应
  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'UNAUTHORIZED'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(401).json(response);
  }

  // 禁止访问响应
  static forbidden(res: Response, message: string = 'Forbidden'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'FORBIDDEN'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(403).json(response);
  }

  // 未找到响应
  static notFound(res: Response, message: string = 'Not found'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'NOT_FOUND'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(404).json(response);
  }

  // 冲突响应
  static conflict(res: Response, message: string = 'Conflict'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'CONFLICT'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(409).json(response);
  }

  // 请求频率过高响应
  static tooManyRequests(res: Response, message: string = 'Too many requests'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'TOO_MANY_REQUESTS'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(429).json(response);
  }

  // 内部服务器错误响应
  static internalError(res: Response, message: string = 'Internal server error'): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error: {
        code: 'INTERNAL_ERROR'
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }

  // 流式响应（用于大文件）
  static stream(res: Response, stream: NodeJS.ReadableStream, contentType: string, filename?: string): void {
    res.setHeader('Content-Type', contentType);
    
    if (filename) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    stream.pipe(res);
    
    stream.on('error', (error) => {
      logger.error('Stream error', error);
      if (!res.headersSent) {
        ResponseHelper.internalError(res, 'Stream error');
      }
    });
  }

  // 文件下载响应
  static download(res: Response, filePath: string, filename?: string): void {
    try {
      if (filename) {
        res.download(filePath, filename);
      } else {
        res.download(filePath);
      }
    } catch (error) {
      logger.error('File download error', error as Error);
      ResponseHelper.internalError(res, 'File download failed');
    }
  }

  // Server-Sent Events响应
  static sse(res: Response, data: any, event?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (event) {
      res.write(`event: ${event}\n`);
    }
    
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  // 健康检查响应
  static health(res: Response, status: 'healthy' | 'unhealthy' = 'healthy', details?: any): void {
    const response = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...details
    };
    
    const statusCode = status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  }
}

export default ResponseHelper;