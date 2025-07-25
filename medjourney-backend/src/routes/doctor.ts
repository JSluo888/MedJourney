// 医生功能路由

import { Router } from 'express';
import doctorController from '../controllers/doctor';
import {
  validateIdParam,
  validatePagination,
  validateSearch,
  authenticateToken,
  authorize
} from '../middleware';

const router = Router();

// 所有路由都需要认证，且仅医生和管理员可访问
router.use(authenticateToken);
router.use(authorize(['doctor', 'admin']));

// 获取医生仪表板
router.get(
  '/dashboard',
  validatePagination,
  validateSearch,
  doctorController.getDoctorDashboard
);

// 获取患者详细报告
router.get(
  '/report/:patientId',
  validateIdParam('patientId'),
  doctorController.getPatientReport
);

// 生成医生报告
router.post(
  '/report/:patientId',
  validateIdParam('patientId'),
  doctorController.generateDoctorReport
);

// 获取医生报告列表
router.get(
  '/reports/:patientId',
  validateIdParam('patientId'),
  validatePagination,
  doctorController.getDoctorReports
);

// 下载PDF报告
router.get(
  '/report/:reportId/pdf',
  validateIdParam('reportId'),
  doctorController.downloadReportPDF
);

export default router;