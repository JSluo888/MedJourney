"use strict";
// 报告生成路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_1 = require("../controllers/reports");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// 请求验证中间件
const validateGenerateReport = [
    (0, express_validator_1.param)('sessionId').isString().notEmpty().withMessage('会话ID是必填项'),
    (0, express_validator_1.body)('reportType').isIn(['family', 'doctor', 'comprehensive']).optional(),
    (0, express_validator_1.body)('format').isIn(['json', 'pdf', 'html']).optional(),
    (0, express_validator_1.body)('includeCharts').isBoolean().optional(),
    (0, express_validator_1.body)('dateRange').isObject().optional(),
    validation_1.handleValidationErrors
];
const validateShareReport = [
    (0, express_validator_1.param)('reportId').isString().notEmpty().withMessage('报告ID是必填项'),
    (0, express_validator_1.body)('shareWith').isArray().withMessage('分享对象必须是数组'),
    (0, express_validator_1.body)('permissions').isObject().optional(),
    (0, express_validator_1.body)('expirationDate').isISO8601().optional(),
    validation_1.handleValidationErrors
];
// 生成详细报告
router.post('/:sessionId/generate', auth_1.authenticateToken, validateGenerateReport, reports_1.reportsController.generateReport.bind(reports_1.reportsController));
// 获取报告列表
router.get('/list/:patientId', auth_1.authenticateToken, reports_1.reportsController.getReportsList.bind(reports_1.reportsController));
// 获取特定报告
router.get('/:reportId', auth_1.authenticateToken, reports_1.reportsController.getReport.bind(reports_1.reportsController));
// 分享报告
router.post('/:reportId/share', auth_1.authenticateToken, validateShareReport, reports_1.reportsController.shareReport.bind(reports_1.reportsController));
// 下载报告
router.get('/:reportId/download', auth_1.authenticateToken, reports_1.reportsController.downloadReport.bind(reports_1.reportsController));
// 获取报告分享状态
router.get('/:reportId/sharing', auth_1.authenticateToken, reports_1.reportsController.getReportSharing.bind(reports_1.reportsController));
// 删除报告
router.delete('/:reportId', auth_1.authenticateToken, reports_1.reportsController.deleteReport.bind(reports_1.reportsController));
exports.default = router;
//# sourceMappingURL=reports.js.map