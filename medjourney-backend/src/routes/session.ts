// 会话相关路由

import { Router } from 'express';
import sessionController from '../controllers/session';
import {
  validateSessionCreation,
  validateMessageSend,
  validateIdParam,
  validatePagination,
  authenticateToken,
  validatePatientAccess
} from '../middleware';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 创建新会话
router.post('/', validateSessionCreation, sessionController.createSession);

// 获取会话信息
router.get('/:sessionId', validateIdParam('sessionId'), sessionController.getSession);

// 更新会话状态
router.put('/:sessionId', validateIdParam('sessionId'), sessionController.updateSession);

// 获取会话消息列表
router.get(
  '/:sessionId/messages',
  validateIdParam('sessionId'),
  validatePagination,
  sessionController.getSessionMessages
);

// 发送消息到会话
router.post(
  '/:sessionId/messages',
  validateIdParam('sessionId'),
  validateMessageSend,
  sessionController.sendMessage
);

// 获取患者的会话列表
router.get(
  '/patient/:patientId',
  validateIdParam('patientId'),
  validatePatientAccess,
  validatePagination,
  sessionController.getPatientSessions
);

export default router;