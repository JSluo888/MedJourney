"use strict";
// 医生功能路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctor_1 = __importDefault(require("../controllers/doctor"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// 所有路由都需要认证，且仅医生和管理员可访问
router.use(middleware_1.authenticateToken);
router.use((0, middleware_1.authorize)(['doctor', 'admin']));
// 获取医生仪表板
router.get('/dashboard', middleware_1.validatePagination, middleware_1.validateSearch, doctor_1.default.getDoctorDashboard);
// 获取患者详细报告
router.get('/report/:patientId', (0, middleware_1.validateIdParam)('patientId'), doctor_1.default.getPatientReport);
// 生成医生报告
router.post('/report/:patientId', (0, middleware_1.validateIdParam)('patientId'), doctor_1.default.generateDoctorReport);
// 获取医生报告列表
router.get('/reports/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePagination, doctor_1.default.getDoctorReports);
// 下载PDF报告
router.get('/report/:reportId/pdf', (0, middleware_1.validateIdParam)('reportId'), doctor_1.default.downloadReportPDF);
exports.default = router;
//# sourceMappingURL=doctor.js.map