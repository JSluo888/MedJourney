// 认证中间件

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JWTPayload } from '../types';
import ResponseHelper from '../utils/response';

// 扩展Request类型
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      patient_id?: string;
      requestId?: string;
    }
  }
}

// JWT认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      logger.warn('认证失败：缺少令牌', {
        requestId: req.requestId,
        url: req.url,
        method: req.method
      });
      ResponseHelper.unauthorized(res, '缺少访问令牌');
      return;
    }

    // 验证JWT令牌
    const payload = jwt.verify(token, config.security.jwt_secret) as JWTPayload;
    
    // 检查令牌是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      logger.warn('认证失败：令牌已过期', {
        requestId: req.requestId,
        patientId: payload.patient_id,
        exp: payload.exp,
        now
      });
      ResponseHelper.unauthorized(res, '访问令牌已过期');
      return;
    }

    // 将用户信息添加到请求对象
    req.user = payload;
    req.patient_id = payload.patient_id;

    logger.debug('认证成功', {
      requestId: req.requestId,
      patientId: payload.patient_id,
      role: payload.role
    });

    next();
  } catch (error) {
    logger.warn('认证失败：令牌无效', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    ResponseHelper.unauthorized(res, '无效的访问令牌');
  }
};

// 角色授权中间件
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ResponseHelper.unauthorized(res, '用户未认证');
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('授权失败：角色权限不足', {
          requestId: req.requestId,
          patientId: req.user.patient_id,
          userRole: req.user.role,
          requiredRoles: allowedRoles
        });
        ResponseHelper.forbidden(res, '权限不足，无法访问此资源');
        return;
      }

      logger.debug('授权成功', {
        requestId: req.requestId,
        patientId: req.user.patient_id,
        role: req.user.role
      });

      next();
    } catch (error) {
      logger.error('授权检查失败', error as Error, {
        requestId: req.requestId
      });
      ResponseHelper.forbidden(res, '授权检查失败');
    }
  };
};

// 可选认证中间件（允许匿名访问）
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      try {
        const payload = jwt.verify(token, config.security.jwt_secret) as JWTPayload;
        
        // 检查令牌是否过期
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp >= now) {
          req.user = payload;
          req.patient_id = payload.patient_id;
          
          logger.debug('可选认证成功', {
            requestId: req.requestId,
            patientId: payload.patient_id
          });
        }
      } catch (error) {
        // 忽略令牌验证失败，继续匿名访问
        logger.debug('可选认证令牌无效，继续匿名访问', {
          requestId: req.requestId
        });
      }
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误', error as Error, {
      requestId: req.requestId
    });
    next(); // 继续执行，允许匿名访问
  }
};

// 患者ID验证中间件
export const validatePatientAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, '用户未认证');
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
      logger.warn('患者访问权限违规', {
        requestId: req.requestId,
        userPatientId,
        requestedPatientId,
        url: req.url
      });
      ResponseHelper.forbidden(res, '只能访问自己的数据');
      return;
    }

    // 家属可以访问关联患者的数据（这里简化处理）
    if (req.user.role === 'family') {
      // 在实际应用中，这里需要查询数据库验证家属与患者的关联关系
      next();
      return;
    }

    next();
  } catch (error) {
    logger.error('患者访问验证失败', error as Error, {
      requestId: req.requestId
    });
    ResponseHelper.forbidden(res, '访问验证失败');
  }
};

// 生成JWT令牌
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = config.security.jwt_expires_in;
  
  // 将过期时间字符串转换为秒数
  let expirationTime: number;
  if (expiresIn.endsWith('d')) {
    expirationTime = parseInt(expiresIn) * 24 * 60 * 60;
  } else if (expiresIn.endsWith('h')) {
    expirationTime = parseInt(expiresIn) * 60 * 60;
  } else if (expiresIn.endsWith('m')) {
    expirationTime = parseInt(expiresIn) * 60;
  } else {
    expirationTime = parseInt(expiresIn); // 假设是秒
  }

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expirationTime
  };

  const token = jwt.sign(fullPayload, config.security.jwt_secret);
  
  logger.debug('JWT令牌生成成功', {
    patientId: payload.patient_id,
    role: payload.role,
    expiresIn: expirationTime
  });

  return token;
};

// 验证JWT令牌
export const verifyToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, config.security.jwt_secret) as JWTPayload;
    
    // 检查令牌是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new UnauthorizedError('令牌已过期');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('无效的令牌');
    }
    throw error;
  }
};

// 刷新令牌
export const refreshToken = (oldToken: string): string => {
  try {
    // 验证旧令牌（忽略过期）
    const payload = jwt.verify(oldToken, config.security.jwt_secret, {
      ignoreExpiration: true
    }) as JWTPayload;

    // 检查令牌是否太旧（超过刷新期限）
    const now = Math.floor(Date.now() / 1000);
    const maxRefreshTime = 30 * 24 * 60 * 60; // 30天
    if (now - payload.iat > maxRefreshTime) {
      throw new UnauthorizedError('令牌过期太久，需要重新登录');
    }

    // 生成新令牌
    return generateToken({
      patient_id: payload.patient_id,
      email: payload.email,
      role: payload.role
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('无效的令牌');
    }
    throw error;
  }
};

// 注销令牌（在实际应用中，应该将令牌加入黑名单）
export const revokeToken = (token: string): void => {
  try {
    const payload = jwt.verify(token, config.security.jwt_secret) as JWTPayload;
    
    logger.info('令牌已注销', {
      patientId: payload.patient_id,
      role: payload.role
    });
    
    // 在实际应用中，这里应该将令牌加入Redis黑名单
    // 或者在数据库中记录已注销的令牌
  } catch (error) {
    logger.warn('注销无效令牌', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export default {
  authenticateToken,
  authorize,
  optionalAuth,
  validatePatientAccess,
  generateToken,
  verifyToken,
  refreshToken,
  revokeToken
};