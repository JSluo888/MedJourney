"use strict";
// 统一日志管理服务
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
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
    const transports = [
        // 控制台输出
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                let log = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta, null, 2)}`;
                }
                return log;
            }))
        })
    ];
    // 生产环境下添加文件输出
    if (config_1.config.server.env === 'production') {
        transports.push(new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json())
        }), new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json())
        }));
    }
    return winston_1.default.createLogger({
        levels: logLevels,
        level: config_1.config.server.env === 'production' ? 'info' : 'debug',
        transports,
        exceptionHandlers: [
            new winston_1.default.transports.Console(),
            ...(config_1.config.server.env === 'production' ? [
                new winston_1.default.transports.File({ filename: 'logs/exceptions.log' })
            ] : [])
        ],
        rejectionHandlers: [
            new winston_1.default.transports.Console(),
            ...(config_1.config.server.env === 'production' ? [
                new winston_1.default.transports.File({ filename: 'logs/rejections.log' })
            ] : [])
        ]
    });
};
// 日志服务类
class Logger {
    winston;
    requestIdStore = new Map();
    constructor() {
        winston_1.default.addColors(logColors);
        this.winston = createWinstonLogger();
    }
    // 设置请求ID上下文
    setRequestId(requestId, context) {
        this.requestIdStore.set(requestId, context);
    }
    // 清理请求ID上下文
    clearRequestId(requestId) {
        this.requestIdStore.delete(requestId);
    }
    // 获取请求上下文
    getContext(meta = {}) {
        const requestId = meta.requestId;
        const context = requestId ? this.requestIdStore.get(requestId) : undefined;
        return {
            ...meta,
            ...(context && { context }),
            ...(requestId && { requestId })
        };
    }
    info(message, meta = {}) {
        this.winston.info(message, this.getContext(meta));
    }
    warn(message, meta = {}) {
        this.winston.warn(message, this.getContext(meta));
    }
    error(message, error, meta = {}) {
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
    debug(message, meta = {}) {
        this.winston.debug(message, this.getContext(meta));
    }
    // 安全审计日志
    audit(action, userId, details) {
        this.winston.info('AUDIT', {
            type: 'audit',
            action,
            userId,
            details,
            timestamp: new Date().toISOString()
        });
    }
    // 性能监控日志
    performance(operation, duration, meta = {}) {
        this.winston.info('PERFORMANCE', {
            type: 'performance',
            operation,
            duration,
            ...meta
        });
    }
    // HTTP请求日志
    http(method, url, statusCode, responseTime, meta = {}) {
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
    database(operation, table, duration, success, meta = {}) {
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
    ai(operation, model, tokens, duration, meta = {}) {
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
    security(event, severity, details) {
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
exports.logger = new Logger();
// 导出Express中间件
const requestLogger = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    exports.logger.setRequestId(requestId, `${req.method} ${req.url}`);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        exports.logger.http(req.method, req.url, res.statusCode, duration, {
            requestId,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        });
        exports.logger.clearRequestId(requestId);
    });
    next();
};
exports.requestLogger = requestLogger;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map