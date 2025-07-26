// 对话管理路由

import { Router } from 'express';
import { conversationController } from '../controllers/conversation';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();


// 请求验证中间件
const validateStartConversation = [
  body('patientId').isString().notEmpty().withMessage('患者ID是必填项'),
  body('sessionType').isIn(['chat', 'assessment', 'therapy']).optional(),
  handleValidationErrors
];

const validateSendMessage = [
  param('sessionId').isString().notEmpty().withMessage('会ID无效'),
  body('type').isIn(['text', 'audio', 'image']).withMessage('消息类型无效'),
  body('content').isString().notEmpty().withMessage('消息内容不能为空'),
  body('metadata').isObject().optional(),
  handleValidationErrors
];

const validateGetAnalysis = [
  param('sessionId').isString().notEmpty().withMessage('会话ID无效'),
  query('includeRecommendations').isBoolean().optional(),
  query('analysisType').isIn(['basic', 'detailed']).optional(),
  handleValidationErrors
];

// 启动 TEN Framework 对话会话
router.post('/start',
  authenticateToken,
  validateStartConversation,
  conversationController.startConversation.bind(conversationController)
);

// 发送多模态消息
router.post('/:sessionId/message',
  authenticateToken,
  validateSendMessage,
  conversationController.sendMessage.bind(conversationController)
);

// 获取实时对话分析
router.get('/:sessionId/analysis',
  authenticateToken,
  validateGetAnalysis,
  conversationController.getAnalysis.bind(conversationController)
);

// 获取对话历史
router.get('/:sessionId/messages',
  authenticateToken,
  conversationController.getMessages.bind(conversationController)
);

// 获取会话状态
router.get('/:sessionId/status',
  authenticateToken,
  conversationController.getStatus.bind(conversationController)
);

// 结束对话会话
router.post('/:sessionId/end',
  authenticateToken,
  conversationController.endConversation.bind(conversationController)
);

// WebSocket 连接端点（用于实时通信）
router.get('/ws/:sessionId',
  conversationController.handleWebSocket.bind(conversationController)
);

export default router;
