"use strict";
// 患者相关路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_1 = __importDefault(require("../controllers/patient"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// 公开路由（无需认证）
router.post('/', middleware_1.validatePatientCreation, patient_1.default.createPatient);
router.post('/login', patient_1.default.login);
// 需要认证的路由
router.use(middleware_1.authenticateToken);
// 获取当前患者信息
router.get('/me', patient_1.default.getCurrentPatient);
// 患者管理路由（需要适当权限）
router.get('/', (0, middleware_1.authorize)(['admin', 'doctor']), middleware_1.validatePagination, middleware_1.validateSearch, patient_1.default.listPatients);
router.get('/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientAccess, patient_1.default.getPatient);
router.put('/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientUpdate, middleware_1.validatePatientAccess, patient_1.default.updatePatient);
router.delete('/:patientId', (0, middleware_1.validateIdParam)('patientId'), (0, middleware_1.authorize)(['admin']), patient_1.default.deletePatient);
exports.default = router;
//# sourceMappingURL=patient.js.map