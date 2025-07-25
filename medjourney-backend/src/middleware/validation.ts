// 请求验证中间件

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import ResponseHelper from '../utils/response';

// 验证结果处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));
    
    logger.warn('请求验证失败', {
      requestId: req.requestId,
      url: req.url,
      method: req.method,
      errors: errorMessages
    });
    
    ResponseHelper.validationError(res, '请求参数验证失败', errorMessages);
    return;
  }
  
  next();
};

// 患者创建验证
export const validatePatientCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('患者姓名是必填项，长度应为1-100个字符'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('birth_date')
    .isISO8601()
    .withMessage('请输入有效的出生日期（YYYY-MM-DD格式）'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是：male、female 或 other'),
  body('diagnosis_date')
    .optional()
    .isISO8601()
    .withMessage('诊断日期格式应为YYYY-MM-DD'),
  body('disease_stage')
    .optional()
    .isIn(['early', 'moderate', 'severe'])
    .withMessage('疾病阶段必须是：early、moderate 或 severe'),
  handleValidationErrors
];

// 患者更新验证
export const validatePatientUpdate = [
  param('patientId')
    .isUUID()
    .withMessage('患者ID格式无效'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('患者姓名长度应为1-100个字符'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的出生日期（YYYY-MM-DD格式）'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是：male、female 或 other'),
  body('diagnosis_date')
    .optional()
    .isISO8601()
    .withMessage('诊断日期格式应为YYYY-MM-DD'),
  body('disease_stage')
    .optional()
    .isIn(['early', 'moderate', 'severe'])
    .withMessage('疾病阶段必须是：early、moderate 或 severe'),
  handleValidationErrors
];

// 会话创建验证
export const validateSessionCreation = [
  body('patient_id')
    .isUUID()
    .withMessage('患者ID格式无效'),
  body('session_type')
    .optional()
    .isIn(['chat', 'assessment', 'therapy'])
    .withMessage('会话类型必须是：chat、assessment 或 therapy'),
  handleValidationErrors
];

// 消息发送验证
export const validateMessageSend = [
  body('session_id')
    .isUUID()
    .withMessage('会话ID格式无效'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('消息内容是必填项，长度应为1-5000个字符'),
  body('message_type')
    .isIn(['text', 'audio', 'image'])
    .withMessage('消息类型必须是：text、audio 或 image'),
  body('sender_type')
    .isIn(['patient', 'ai'])
    .withMessage('发送者类型必须是：patient 或 ai'),
  handleValidationErrors
];

// 病史导入验证
export const validateMedicalHistoryImport = [
  body('patient_id')
    .isUUID()
    .withMessage('患者ID格式无效'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('病史内容是必填项，长度应为1-10000个字符'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('来源信息长度不能超过200个字符'),
  handleValidationErrors
];

// 家属评分验证
export const validateFamilyScore = [
  body('patient_id')
    .isUUID()
    .withMessage('患者ID格式无效'),
  body('health_score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('健康评分必须是0-100之间的数值'),
  body('mental_score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('心理评分必须是0-100之间的数值'),
  body('insight')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('洞察摘要长度不能超过500个字符'),
  handleValidationErrors
];

// 通用ID参数验证
export const validateIdParam = (paramName: string = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName}格式无效，应为UUID格式`),
  handleValidationErrors
];

// 分页查询验证
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'name', 'score'])
    .withMessage('排序字段无效'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是asc或desc'),
  handleValidationErrors
];

// 日期范围查询验证
export const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式应为YYYY-MM-DD'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式应为YYYY-MM-DD'),
  handleValidationErrors
];

// 搜索查询验证
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('搜索关键词长度应为1-200个字符'),
  handleValidationErrors
];

// 文件上传验证
export const validateFileUpload = [
  body('bucket')
    .optional()
    .isIn(['images', 'documents', 'audio'])
    .withMessage('存储桶类型必须是：images、documents 或 audio'),
  handleValidationErrors
];

export default {
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
};