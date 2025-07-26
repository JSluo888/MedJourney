// 分级问诊路由

import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();
const assessmentController = new AssessmentController();

// 请求验证中间件
const validateAnalyzeAssessment = [
  body('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
  body('assessmentType').isIn(['basic', 'cognitive', 'emotional', 'comprehensive']).optional(),
  body('includeRecommendations').isBoolean().optional(),
  handleValidationErrors
];

const validateSubmitAssessmentData = [
  body('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
  body('assessmentData').isObject().withMessage('评估数据必须是对象'),
  body('assessmentType').isString().notEmpty().withMessage('评估类型是必填项'),
  handleValidationErrors
];

// 分级问诊分析
router.post('/analyze',
  authenticateToken,
  validateAnalyzeAssessment,
  assessmentController.analyzeAssessment.bind(assessmentController)
);

// 提交问诊数据
router.post('/submit',
  authenticateToken,
  validateSubmitAssessmentData,
  assessmentController.submitAssessmentData.bind(assessmentController)
);

// 获取问诊历史
router.get('/history/:patientId',
  authenticateToken,
  assessmentController.getAssessmentHistory.bind(assessmentController)
);

// 获取问诊报告
router.get('/report/:sessionId',
  authenticateToken,
  assessmentController.getAssessmentReport.bind(assessmentController)
);

export default router;
