"use strict";
// 对话管理路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_1 = require("../controllers/conversation");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// 请求验证中间件
const validateStartConversation = [
    (0, express_validator_1.body)('patientId').isString().notEmpty().withMessage('患者ID是必填项'),
    (0, express_validator_1.body)('sessionType').isIn(['chat', 'assessment', 'therapy']).optional(),
    validation_1.handleValidationErrors
];
const validateSendMessage = [
    (0, express_validator_1.param)('sessionId').isString().notEmpty().withMessage('会ID无效'),
    (0, express_validator_1.body)('type').isIn(['text', 'audio', 'image']).withMessage('消息类型无效'),
    (0, express_validator_1.body)('content').isString().notEmpty().withMessage('消息内容不能为空'),
    (0, express_validator_1.body)('metadata').isObject().optional(),
    validation_1.handleValidationErrors
];
const validateGetAnalysis = [
    (0, express_validator_1.param)('sessionId').isString().notEmpty().withMessage('会话ID无效'),
    (0, express_validator_1.query)('includeRecommendations').isBoolean().optional(),
    (0, express_validator_1.query)('analysisType').isIn(['basic', 'detailed']).optional(),
    validation_1.handleValidationErrors
];
// 启动 TEN Framework 对话会话
router.post('/start', auth_1.authenticateToken, validateStartConversation, conversation_1.conversationController.startConversation.bind(conversation_1.conversationController));
// 发送多模态消息
router.post('/:sessionId/message', auth_1.authenticateToken, validateSendMessage, conversation_1.conversationController.sendMessage.bind(conversation_1.conversationController));
// 获取实时对话分析
router.get('/:sessionId/analysis', auth_1.authenticateToken, validateGetAnalysis, conversation_1.conversationController.getAnalysis.bind(conversation_1.conversationController));
// 获取对话历史
router.get('/:sessionId/messages', auth_1.authenticateToken, conversation_1.conversationController.getMessages.bind(conversation_1.conversationController));
// 获取会话状态
router.get('/:sessionId/status', auth_1.authenticateToken, conversation_1.conversationController.getStatus.bind(conversation_1.conversationController));
// 结束对话会话
router.post('/:sessionId/end', auth_1.authenticateToken, conversation_1.conversationController.endConversation.bind(conversation_1.conversationController));
// WebSocket 连接端点（用于实时通信）
router.get('/ws/:sessionId', conversation_1.conversationController.handleWebSocket.bind(conversation_1.conversationController));
exports.default = router;
//# sourceMappingURL=conversation.js.map