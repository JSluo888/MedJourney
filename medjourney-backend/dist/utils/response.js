"use strict";
// API响应工具类
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class ResponseHelper {
    // 成功响应
    static success(res, data, message = 'Success') {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    // 分页响应
    static paginated(res, data, pagination, message = 'Success') {
        const response = {
            success: true,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    // 创建成功响应
    static created(res, data, message = 'Created successfully') {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        res.status(201).json(response);
    }
    // 无内容响应
    static noContent(res) {
        res.status(204).send();
    }
    // 错误响应
    static error(res, message = 'Internal server error', statusCode = 500, details) {
        const response = {
            success: false,
            message,
            data: null,
            error: details ? { details } : undefined,
            timestamp: new Date().toISOString()
        };
        res.status(statusCode).json(response);
    }
    // 验证错误响应
    static validationError(res, message = 'Validation failed', errors = []) {
        const response = {
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
    static unauthorized(res, message = 'Unauthorized') {
        const response = {
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
    static forbidden(res, message = 'Forbidden') {
        const response = {
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
    static notFound(res, message = 'Not found') {
        const response = {
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
    static conflict(res, message = 'Conflict') {
        const response = {
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
    static tooManyRequests(res, message = 'Too many requests') {
        const response = {
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
    static internalError(res, message = 'Internal server error') {
        const response = {
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
    static stream(res, stream, contentType, filename) {
        res.setHeader('Content-Type', contentType);
        if (filename) {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        stream.pipe(res);
        stream.on('error', (error) => {
            logger_1.logger.error('Stream error', error);
            if (!res.headersSent) {
                ResponseHelper.internalError(res, 'Stream error');
            }
        });
    }
    // 文件下载响应
    static download(res, filePath, filename) {
        try {
            if (filename) {
                res.download(filePath, filename);
            }
            else {
                res.download(filePath);
            }
        }
        catch (error) {
            logger_1.logger.error('File download error', error);
            ResponseHelper.internalError(res, 'File download failed');
        }
    }
    // Server-Sent Events响应
    static sse(res, data, event) {
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
    static health(res, status = 'healthy', details) {
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
exports.default = ResponseHelper;
//# sourceMappingURL=response.js.map