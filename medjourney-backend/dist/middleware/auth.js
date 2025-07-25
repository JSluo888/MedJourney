"use strict";
// 认证中间件
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = exports.refreshToken = exports.verifyToken = exports.generateToken = exports.validatePatientAccess = exports.optionalAuth = exports.authorize = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const response_1 = __importDefault(require("../utils/response"));
// JWT认证中间件
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!token) {
            logger_1.logger.warn('认证失败：缺少令牌', {
                requestId: req.requestId,
                url: req.url,
                method: req.method
            });
            response_1.default.unauthorized(res, '缺少访问令牌');
            return;
        }
        // 验证JWT令牌
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.security.jwt_secret);
        // 检查令牌是否过期
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            logger_1.logger.warn('认证失败：令牌已过期', {
                requestId: req.requestId,
                patientId: payload.patient_id,
                exp: payload.exp,
                now
            });
            response_1.default.unauthorized(res, '访问令牌已过期');
            return;
        }
        // 将用户信息添加到请求对象
        req.user = payload;
        req.patient_id = payload.patient_id;
        logger_1.logger.debug('认证成功', {
            requestId: req.requestId,
            patientId: payload.patient_id,
            role: payload.role
        });
        next();
    }
    catch (error) {
        logger_1.logger.warn('认证失败：令牌无效', {
            requestId: req.requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        response_1.default.unauthorized(res, '无效的访问令牌');
    }
};
exports.authenticateToken = authenticateToken;
// 角色授权中间件
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                response_1.default.unauthorized(res, '用户未认证');
                return;
            }
            if (!allowedRoles.includes(req.user.role)) {
                logger_1.logger.warn('授权失败：角色权限不足', {
                    requestId: req.requestId,
                    patientId: req.user.patient_id,
                    userRole: req.user.role,
                    requiredRoles: allowedRoles
                });
                response_1.default.forbidden(res, '权限不足，无法访问此资源');
                return;
            }
            logger_1.logger.debug('授权成功', {
                requestId: req.requestId,
                patientId: req.user.patient_id,
                role: req.user.role
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('授权检查失败', error, {
                requestId: req.requestId
            });
            response_1.default.forbidden(res, '授权检查失败');
        }
    };
};
exports.authorize = authorize;
// 可选认证中间件（允许匿名访问）
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (token) {
            try {
                const payload = jsonwebtoken_1.default.verify(token, config_1.config.security.jwt_secret);
                // 检查令牌是否过期
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp >= now) {
                    req.user = payload;
                    req.patient_id = payload.patient_id;
                    logger_1.logger.debug('可选认证成功', {
                        requestId: req.requestId,
                        patientId: payload.patient_id
                    });
                }
            }
            catch (error) {
                // 忽略令牌验证失败，继续匿名访问
                logger_1.logger.debug('可选认证令牌无效，继续匿名访问', {
                    requestId: req.requestId
                });
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('可选认证中间件错误', error, {
            requestId: req.requestId
        });
        next(); // 继续执行，允许匿名访问
    }
};
exports.optionalAuth = optionalAuth;
// 患者ID验证中间件
const validatePatientAccess = (req, res, next) => {
    try {
        if (!req.user) {
            response_1.default.unauthorized(res, '用户未认证');
            return;
        }
        const requestedPatientId = req.params.patientId || req.body.patient_id;
        const userPatientId = req.user.patient_id;
        // 管理员可以访问所有患者数据
        if (req.user.role === 'admin' || req.user.role === 'doctor') {
            next();
            return;
        }
        // 患者只能访问自己的数据
        if (req.user.role === 'patient' && requestedPatientId && requestedPatientId !== userPatientId) {
            logger_1.logger.warn('患者访问权限违规', {
                requestId: req.requestId,
                userPatientId,
                requestedPatientId,
                url: req.url
            });
            response_1.default.forbidden(res, '只能访问自己的数据');
            return;
        }
        // 家属可以访问关联患者的数据（这里简化处理）
        if (req.user.role === 'family') {
            // 在实际应用中，这里需要查询数据库验证家属与患者的关联关系
            next();
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('患者访问验证失败', error, {
            requestId: req.requestId
        });
        response_1.default.forbidden(res, '访问验证失败');
    }
};
exports.validatePatientAccess = validatePatientAccess;
// 生成JWT令牌
const generateToken = (payload) => {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = config_1.config.security.jwt_expires_in;
    // 将过期时间字符串转换为秒数
    let expirationTime;
    if (expiresIn.endsWith('d')) {
        expirationTime = parseInt(expiresIn) * 24 * 60 * 60;
    }
    else if (expiresIn.endsWith('h')) {
        expirationTime = parseInt(expiresIn) * 60 * 60;
    }
    else if (expiresIn.endsWith('m')) {
        expirationTime = parseInt(expiresIn) * 60;
    }
    else {
        expirationTime = parseInt(expiresIn); // 假设是秒
    }
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expirationTime
    };
    const token = jsonwebtoken_1.default.sign(fullPayload, config_1.config.security.jwt_secret);
    logger_1.logger.debug('JWT令牌生成成功', {
        patientId: payload.patient_id,
        role: payload.role,
        expiresIn: expirationTime
    });
    return token;
};
exports.generateToken = generateToken;
// 验证JWT令牌
const verifyToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.security.jwt_secret);
        // 检查令牌是否过期
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            throw new errors_1.UnauthorizedError('令牌已过期');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.UnauthorizedError('无效的令牌');
        }
        throw error;
    }
};
exports.verifyToken = verifyToken;
// 刷新令牌
const refreshToken = (oldToken) => {
    try {
        // 验证旧令牌（忽略过期）
        const payload = jsonwebtoken_1.default.verify(oldToken, config_1.config.security.jwt_secret, {
            ignoreExpiration: true
        });
        // 检查令牌是否太旧（超过刷新期限）
        const now = Math.floor(Date.now() / 1000);
        const maxRefreshTime = 30 * 24 * 60 * 60; // 30天
        if (now - payload.iat > maxRefreshTime) {
            throw new errors_1.UnauthorizedError('令牌过期太久，需要重新登录');
        }
        // 生成新令牌
        return (0, exports.generateToken)({
            patient_id: payload.patient_id,
            email: payload.email,
            role: payload.role
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.UnauthorizedError('无效的令牌');
        }
        throw error;
    }
};
exports.refreshToken = refreshToken;
// 注销令牌（在实际应用中，应该将令牌加入黑名单）
const revokeToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.security.jwt_secret);
        logger_1.logger.info('令牌已注销', {
            patientId: payload.patient_id,
            role: payload.role
        });
        // 在实际应用中，这里应该将令牌加入Redis黑名单
        // 或者在数据库中记录已注销的令牌
    }
    catch (error) {
        logger_1.logger.warn('注销无效令牌', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.revokeToken = revokeToken;
exports.default = {
    authenticateToken: exports.authenticateToken,
    authorize: exports.authorize,
    optionalAuth: exports.optionalAuth,
    validatePatientAccess: exports.validatePatientAccess,
    generateToken: exports.generateToken,
    verifyToken: exports.verifyToken,
    refreshToken: exports.refreshToken,
    revokeToken: exports.revokeToken
};
//# sourceMappingURL=auth.js.map