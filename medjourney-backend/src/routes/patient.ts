// 患者相关路由

import { Router } from 'express';
import patientController from '../controllers/patient';
import {
  validatePatientCreation,
  validatePatientUpdate,
  validateIdParam,
  validatePagination,
  validateSearch,
  authenticateToken,
  authorize,
  validatePatientAccess
} from '../middleware';

const router = Router();

// 公开路由（无需认证）
router.post('/', validatePatientCreation, patientController.createPatient);
router.post('/login', patientController.login);

// 需要认证的路由
router.use(authenticateToken);

// 获取当前患者信息
router.get('/me', patientController.getCurrentPatient);

// 患者管理路由（需要适当权限）
router.get(
  '/',
  authorize(['admin', 'doctor']),
  validatePagination,
  validateSearch,
  patientController.listPatients
);

router.get(
  '/:patientId',
  validateIdParam('patientId'),
  validatePatientAccess,
  patientController.getPatient
);

router.put(
  '/:patientId',
  validateIdParam('patientId'),
  validatePatientUpdate,
  validatePatientAccess,
  patientController.updatePatient
);

router.delete(
  '/:patientId',
  validateIdParam('patientId'),
  authorize(['admin']),
  patientController.deletePatient
);

export default router;