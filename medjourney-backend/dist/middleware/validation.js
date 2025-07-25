"use strict";
// 请求验证中间件
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.validateSearch = exports.validateDateRange = exports.validatePagination = exports.validateIdParam = exports.validateFamilyScore = exports.validateMedicalHistoryImport = exports.validateMessageSend = exports.validateSessionCreation = exports.validatePatientUpdate = exports.validatePatientCreation = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined
        }));
        logger_1.logger.warn('请求验证失败', {
            requestId: req.requestId,
            url: req.url,
            method: req.method,
            errors: errorMessages
        });
        response_1.default.validationError(res, '请求参数验证失败', errorMessages);
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// 患者创建验证
exports.validatePatientCreation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('患者姓名是必填项，长度应为1-100个字符'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('zh-CN')
        .withMessage('请输入有效的手机号码'),
    (0, express_validator_1.body)('birth_date')
        .isISO8601()
        .withMessage('请输入有效的出生日期（YYYY-MM-DD格式）'),
    (0, express_validator_1.body)('gender')
        .isIn(['male', 'female', 'other'])
        .withMessage('性别必须是：male、female 或 other'),
    (0, express_validator_1.body)('diagnosis_date')
        .optional()
        .isISO8601()
        .withMessage('诊断日期格式应为YYYY-MM-DD'),
    (0, express_validator_1.body)('disease_stage')
        .optional()
        .isIn(['early', 'moderate', 'severe'])
        .withMessage('疾病阶段必须是：early、moderate 或 severe'),
    exports.handleValidationErrors
];
// 患者更新验证
exports.validatePatientUpdate = [
    (0, express_validator_1.param)('patientId')
        .isUUID()
        .withMessage('患者ID格式无效'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('患者姓名长度应为1-100个字符'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('zh-CN')
        .withMessage('请输入有效的手机号码'),
    (0, express_validator_1.body)('birth_date')
        .optional()
        .isISO8601()
        .withMessage('请输入有效的出生日期（YYYY-MM-DD格式）'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('性别必须是：male、female 或 other'),
    (0, express_validator_1.body)('diagnosis_date')
        .optional()
        .isISO8601()
        .withMessage('诊断日期格式应为YYYY-MM-DD'),
    (0, express_validator_1.body)('disease_stage')
        .optional()
        .isIn(['early', 'moderate', 'severe'])
        .withMessage('疾病阶段必须是：early、moderate 或 severe'),
    exports.handleValidationErrors
];
// 会话创建验证
exports.validateSessionCreation = [
    (0, express_validator_1.body)('patient_id')
        .isUUID()
        .withMessage('患者ID格式无效'),
    (0, express_validator_1.body)('session_type')
        .optional()
        .isIn(['chat', 'assessment', 'therapy'])
        .withMessage('会话类型必须是：chat、assessment 或 therapy'),
    exports.handleValidationErrors
];
// 消息发送验证
exports.validateMessageSend = [
    (0, express_validator_1.body)('session_id')
        .isUUID()
        .withMessage('会话ID格式无效'),
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('消息内容是必填项，长度应为1-5000个字符'),
    (0, express_validator_1.body)('message_type')
        .isIn(['text', 'audio', 'image'])
        .withMessage('消息类型必须是：text、audio 或 image'),
    (0, express_validator_1.body)('sender_type')
        .isIn(['patient', 'ai'])
        .withMessage('发送者类型必须是：patient 或 ai'),
    exports.handleValidationErrors
];
// 病史导入验证
exports.validateMedicalHistoryImport = [
    (0, express_validator_1.body)('patient_id')
        .isUUID()
        .withMessage('患者ID格式无效'),
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 10000 })
        .withMessage('病史内容是必填项，长度应为1-10000个字符'),
    (0, express_validator_1.body)('source')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('来源信息长度不能超过200个字符'),
    exports.handleValidationErrors
];
// 家属评分验证
exports.validateFamilyScore = [
    (0, express_validator_1.body)('patient_id')
        .isUUID()
        .withMessage('患者ID格式无效'),
    (0, express_validator_1.body)('health_score')
        .isFloat({ min: 0, max: 100 })
        .withMessage('健康评分必须是0-100之间的数值'),
    (0, express_validator_1.body)('mental_score')
        .isFloat({ min: 0, max: 100 })
        .withMessage('心理评分必须是0-100之间的数值'),
    (0, express_validator_1.body)('insight')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('洞察摘要长度不能超过500个字符'),
    exports.handleValidationErrors
];
// 通用ID参数验证
const validateIdParam = (paramName = 'id') => [
    (0, express_validator_1.param)(paramName)
        .isUUID()
        .withMessage(`${paramName}格式无效，应为UUID格式`),
    exports.handleValidationErrors
];
exports.validateIdParam = validateIdParam;
// 分页查询验证
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是大于0的整数'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须是1-100之间的整数'),
    (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['created_at', 'updated_at', 'name', 'score'])
        .withMessage('排序字段无效'),
    (0, express_validator_1.query)('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('排序方向必须是asc或desc'),
    exports.handleValidationErrors
];
// 日期范围查询验证
exports.validateDateRange = [
    (0, express_validator_1.query)('start_date')
        .optional()
        .isISO8601()
        .withMessage('开始日期格式应为YYYY-MM-DD'),
    (0, express_validator_1.query)('end_date')
        .optional()
        .isISO8601()
        .withMessage('结束日期格式应为YYYY-MM-DD'),
    exports.handleValidationErrors
];
// 搜索查询验证
exports.validateSearch = [
    (0, express_validator_1.query)('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('搜索关键词长度应为1-200个字符'),
    exports.handleValidationErrors
];
// 文件上传验证
exports.validateFileUpload = [
    (0, express_validator_1.body)('bucket')
        .optional()
        .isIn(['images', 'documents', 'audio'])
        .withMessage('存储桶类型必须是：images、documents 或 audio'),
    exports.handleValidationErrors
];
exports.default = {
    handleValidationErrors: exports.handleValidationErrors,
    validatePatientCreation: exports.validatePatientCreation,
    validatePatientUpdate: exports.validatePatientUpdate,
    validateSessionCreation: exports.validateSessionCreation,
    validateMessageSend: exports.validateMessageSend,
    validateMedicalHistoryImport: exports.validateMedicalHistoryImport,
    validateFamilyScore: exports.validateFamilyScore,
    validateIdParam: exports.validateIdParam,
    validatePagination: exports.validatePagination,
    validateDateRange: exports.validateDateRange,
    validateSearch: exports.validateSearch,
    validateFileUpload: exports.validateFileUpload
};
//# sourceMappingURL=validation.js.map