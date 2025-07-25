// 家属功能路由

import { Router } from 'express';
import familyController from '../controllers/family';
import {
  validateFamilyScore,
  validateIdParam,
  validatePagination,
  validateDateRange,
  authenticateToken,
  authorize,
  validatePatientAccess
} from '../middleware';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取家属简报
router.get(
  '/summary/:patientId',
  validateIdParam('patientId'),
  validatePatientAccess,
  familyController.getFamilySummary
);

// 提交家属评分
router.post(
  '/score/:patientId',
  validateIdParam('patientId'),
  validateFamilyScore,
  validatePatientAccess,
  familyController.submitFamilyScore
);

// 获取家属评分历史
router.get(
  '/score/:patientId/history',
  validateIdParam('patientId'),
  validatePatientAccess,
  validatePagination,
  validateDateRange,
  familyController.getFamilyScoreHistory
);

// 获取家属评分趋势
router.get(
  '/score/:patientId/trend',
  validateIdParam('patientId'),
  validatePatientAccess,
  familyController.getFamilyScoreTrend
);

export default router;