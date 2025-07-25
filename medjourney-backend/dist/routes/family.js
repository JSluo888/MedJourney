"use strict";
// 家属功能路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const family_1 = __importDefault(require("../controllers/family"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(middleware_1.authenticateToken);
// 获取家属简报
router.get('/summary/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientAccess, family_1.default.getFamilySummary);
// 提交家属评分
router.post('/score/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validateFamilyScore, middleware_1.validatePatientAccess, family_1.default.submitFamilyScore);
// 获取家属评分历史
router.get('/score/:patientId/history', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientAccess, middleware_1.validatePagination, middleware_1.validateDateRange, family_1.default.getFamilyScoreHistory);
// 获取家属评分趋势
router.get('/score/:patientId/trend', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientAccess, family_1.default.getFamilyScoreTrend);
exports.default = router;
//# sourceMappingURL=family.js.map