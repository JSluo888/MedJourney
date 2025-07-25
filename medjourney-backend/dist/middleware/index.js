"use strict";
// 中间件导出模块
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.validateSearch = exports.validateDateRange = exports.validatePagination = exports.validateIdParam = exports.validateFamilyScore = exports.validateMedicalHistoryImport = exports.validateMessageSend = exports.validateSessionCreation = exports.validatePatientUpdate = exports.validatePatientCreation = exports.handleValidationErrors = exports.revokeToken = exports.refreshToken = exports.verifyToken = exports.generateToken = exports.validatePatientAccess = exports.optionalAuth = exports.authorize = exports.authenticateToken = exports.notFoundHandler = exports.errorHandler = exports.healthCheck = exports.compressionConfig = exports.apiRateLimiter = exports.rateLimiter = exports.securityHeaders = exports.corsConfig = exports.requestLogger = exports.requestId = void 0;
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
// 请求ID中间件
const requestId = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};
exports.requestId = requestId;
// 请求日志中间件
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // 记录请求开始
    logger_1.logger.http('请求开始', {
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
        logger_1.logger.http('请求完成', {
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
exports.requestLogger = requestLogger;
// CORS配置
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        // 开发环境允许所有来源
        if (config_1.config.server.env === 'development') {
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
        }
        else {
            logger_1.logger.warn('CORS阻止的来源', { origin });
            callback(new Error('CORS策略不允许此来源'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Info'],
    exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining']
});
// 安全头配置
exports.securityHeaders = (0, helmet_1.default)({
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
exports.rateLimiter = (0, express_rate_limit_1.default)({
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
    handler: (req, res) => {
        logger_1.logger.warn('速率限制触发', {
            requestId: req.requestId,
            ip: req.ip,
            url: req.url
        });
        response_1.default.tooManyRequests(res, '请求频率过高，请稍后再试');
    }
});
// API速率限制（更严格）
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
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
    handler: (req, res) => {
        logger_1.logger.warn('API速率限制触发', {
            requestId: req.requestId,
            ip: req.ip,
            url: req.url
        });
        response_1.default.tooManyRequests(res, 'API请求频率过高，请稍后再试');
    }
});
// 响应压缩
exports.compressionConfig = (0, compression_1.default)({
    filter: (req, res) => {
        // 对于图片和视频文件，不进行压缩
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    threshold: 1024 // 大于1KB的响应才压缩
});
// 健康检查中间件
const healthCheck = (req, res, next) => {
    if (req.url === '/health' || req.url === '/health/') {
        response_1.default.success(res, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: config_1.config.server.env,
            uptime: process.uptime()
        });
        return;
    }
    next();
};
exports.healthCheck = healthCheck;
// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    // 如果响应已经发送，委托给默认的Express错误处理器
    if (res.headersSent) {
        return next(err);
    }
    logger_1.logger.error('未处理的错误', err, {
        requestId: req.requestId,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    // 根据错误类型返回适当的响应
    if (err.name === 'ValidationError') {
        response_1.default.validationError(res, err.message, err.details);
    }
    else if (err.status === 404) {
        response_1.default.notFound(res, '请求的资源不存在');
    }
    else if (err.status === 401) {
        response_1.default.unauthorized(res, err.message || '认证失败');
    }
    else if (err.status === 403) {
        response_1.default.forbidden(res, err.message || '权限不足');
    }
    else if (err.status === 429) {
        response_1.default.tooManyRequests(res, err.message || '请求频率过高');
    }
    else {
        // 生产环境不暴露详细错误信息
        const message = config_1.config.server.env === 'production'
            ? '服务器内部错误'
            : err.message || '未知错误';
        response_1.default.internalError(res, message);
    }
};
exports.errorHandler = errorHandler;
// 404处理中间件
const notFoundHandler = (req, res) => {
    logger_1.logger.warn('404 - 路由未找到', {
        requestId: req.requestId,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    response_1.default.notFound(res, `路由 ${req.method} ${req.url} 不存在`);
};
exports.notFoundHandler = notFoundHandler;
// 导出所有中间件
var auth_1 = require("./auth");
Object.defineProperty(exports, "authenticateToken", { enumerable: true, get: function () { return auth_1.authenticateToken; } });
Object.defineProperty(exports, "authorize", { enumerable: true, get: function () { return auth_1.authorize; } });
Object.defineProperty(exports, "optionalAuth", { enumerable: true, get: function () { return auth_1.optionalAuth; } });
Object.defineProperty(exports, "validatePatientAccess", { enumerable: true, get: function () { return auth_1.validatePatientAccess; } });
Object.defineProperty(exports, "generateToken", { enumerable: true, get: function () { return auth_1.generateToken; } });
Object.defineProperty(exports, "verifyToken", { enumerable: true, get: function () { return auth_1.verifyToken; } });
Object.defineProperty(exports, "refreshToken", { enumerable: true, get: function () { return auth_1.refreshToken; } });
Object.defineProperty(exports, "revokeToken", { enumerable: true, get: function () { return auth_1.revokeToken; } });
var validation_1 = require("./validation");
Object.defineProperty(exports, "handleValidationErrors", { enumerable: true, get: function () { return validation_1.handleValidationErrors; } });
Object.defineProperty(exports, "validatePatientCreation", { enumerable: true, get: function () { return validation_1.validatePatientCreation; } });
Object.defineProperty(exports, "validatePatientUpdate", { enumerable: true, get: function () { return validation_1.validatePatientUpdate; } });
Object.defineProperty(exports, "validateSessionCreation", { enumerable: true, get: function () { return validation_1.validateSessionCreation; } });
Object.defineProperty(exports, "validateMessageSend", { enumerable: true, get: function () { return validation_1.validateMessageSend; } });
Object.defineProperty(exports, "validateMedicalHistoryImport", { enumerable: true, get: function () { return validation_1.validateMedicalHistoryImport; } });
Object.defineProperty(exports, "validateFamilyScore", { enumerable: true, get: function () { return validation_1.validateFamilyScore; } });
Object.defineProperty(exports, "validateIdParam", { enumerable: true, get: function () { return validation_1.validateIdParam; } });
Object.defineProperty(exports, "validatePagination", { enumerable: true, get: function () { return validation_1.validatePagination; } });
Object.defineProperty(exports, "validateDateRange", { enumerable: true, get: function () { return validation_1.validateDateRange; } });
Object.defineProperty(exports, "validateSearch", { enumerable: true, get: function () { return validation_1.validateSearch; } });
Object.defineProperty(exports, "validateFileUpload", { enumerable: true, get: function () { return validation_1.validateFileUpload; } });
exports.default = {
    requestId: exports.requestId,
    requestLogger: exports.requestLogger,
    corsConfig: exports.corsConfig,
    securityHeaders: exports.securityHeaders,
    rateLimiter: exports.rateLimiter,
    apiRateLimiter: exports.apiRateLimiter,
    compressionConfig: exports.compressionConfig,
    healthCheck: exports.healthCheck,
    errorHandler: exports.errorHandler,
    notFoundHandler: exports.notFoundHandler
};
//# sourceMappingURL=index.js.map