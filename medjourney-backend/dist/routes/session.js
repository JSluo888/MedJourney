"use strict";
// 会话相关路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_1 = __importDefault(require("../controllers/session"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(middleware_1.authenticateToken);
// 创建新会话
router.post('/', middleware_1.validateSessionCreation, session_1.default.createSession);
// 获取会话信息
router.get('/:sessionId', (0, middleware_1.validateIdParam)('sessionId'), session_1.default.getSession);
// 更新会话状态
router.put('/:sessionId', (0, middleware_1.validateIdParam)('sessionId'), session_1.default.updateSession);
// 获取会话消息列表
router.get('/:sessionId/messages', (0, middleware_1.validateIdParam)('sessionId'), middleware_1.validatePagination, session_1.default.getSessionMessages);
// 发送消息到会话
router.post('/:sessionId/messages', (0, middleware_1.validateIdParam)('sessionId'), middleware_1.validateMessageSend, session_1.default.sendMessage);
// 获取患者的会话列表
router.get('/patient/:patientId', (0, middleware_1.validateIdParam)('patientId'), middleware_1.validatePatientAccess, middleware_1.validatePagination, session_1.default.getPatientSessions);
exports.default = router;
//# sourceMappingURL=session.js.map