"use strict";
// 分级问诊路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assessment_1 = require("../controllers/assessment");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const assessmentController = new assessment_1.AssessmentController();
// 请求验证中间件
const validateAnalyzeAssessment = [
    (0, express_validator_1.body)('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
    (0, express_validator_1.body)('assessmentType').isIn(['basic', 'cognitive', 'emotional', 'comprehensive']).optional(),
    (0, express_validator_1.body)('includeRecommendations').isBoolean().optional(),
    validation_1.handleValidationErrors
];
const validateSubmitAssessmentData = [
    (0, express_validator_1.body)('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
    (0, express_validator_1.body)('assessmentData').isObject().withMessage('评估数据必须是对象'),
    (0, express_validator_1.body)('assessmentType').isString().notEmpty().withMessage('评估类型是必填项'),
    validation_1.handleValidationErrors
];
// 分级问诊分析
router.post('/analyze', auth_1.authenticateToken, validateAnalyzeAssessment, assessmentController.analyzeAssessment.bind(assessmentController));
// 提交问诊数据
router.post('/submit', auth_1.authenticateToken, validateSubmitAssessmentData, assessmentController.submitAssessmentData.bind(assessmentController));
// 获取问诊历史
router.get('/history/:patientId', auth_1.authenticateToken, assessmentController.getAssessmentHistory.bind(assessmentController));
// 获取问诊报告
router.get('/report/:sessionId', auth_1.authenticateToken, assessmentController.getAssessmentReport.bind(assessmentController));
exports.default = router;
//# sourceMappingURL=assessment.js.map