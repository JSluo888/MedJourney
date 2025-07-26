// 报告生成路由

import { Router } from 'express';
import { reportsController } from '../controllers/reports';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();


// 请求验证中间件
const validateGenerateReport = [
  param('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
  body('reportType').isIn(['family', 'doctor', 'comprehensive']).optional(),
  body('format').isIn(['json', 'pdf', 'html']).optional(),
  body('includeCharts').isBoolean().optional(),
  body('dateRange').isObject().optional(),
  handleValidationErrors
];

const validateShareReport = [
  param('reportId').isString().notEmpty().withMessage('报告ID是必填项'),
  body('shareWith').isArray().withMessage('分享对象必须是数组'),
  body('permissions').isObject().optional(),
  body('expirationDate').isISO8601().optional(),
  handleValidationErrors
];

// 生成详细报告
router.post('/:sessionId/generate',
  authenticateToken,
  validateGenerateReport,
  reportsController.generateReport.bind(reportsController)
);

// 生成家属简报
router.post('/family-summary',
  authenticateToken,
  [
    body('userId').isString().notEmpty().withMessage('用户ID是必填项'),
    body('format').isIn(['json', 'pdf', 'html']).optional(),
    body('includeCharts').isBoolean().optional(),
    handleValidationErrors
  ],
  reportsController.generateFamilySummary.bind(reportsController)
);

// 获取报告列表
router.get('/list/:patientId',
  authenticateToken,
  reportsController.getReportsList.bind(reportsController)
);

// 获取特定报告
router.get('/:reportId',
  authenticateToken,
  reportsController.getReport.bind(reportsController)
);

// 分享报告
router.post('/:reportId/share',
  authenticateToken,
  validateShareReport,
  reportsController.shareReport.bind(reportsController)
);

// 下载报告
router.get('/:reportId/download',
  authenticateToken,
  reportsController.downloadReport.bind(reportsController)
);

// 获取报告分享状态
router.get('/:reportId/sharing',
  authenticateToken,
  reportsController.getReportSharing.bind(reportsController)
);

// 删除报告
router.delete('/:reportId',
  authenticateToken,
  reportsController.deleteReport.bind(reportsController)
);

export default router;
