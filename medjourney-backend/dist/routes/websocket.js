"use strict";
// WebSocket路由和状态管理
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// WebSocket状态查询
router.get('/status', async (req, res) => {
    try {
        // 这里需要从服务器实例获取WebSocket统计信息
        // 目前返回基本状态
        const status = {
            service: 'WebSocket Server',
            endpoint: '/ws',
            status: 'running',
            timestamp: new Date().toISOString()
        };
        logger_1.logger.info('WebSocket状态查询', {
            endpoint: req.originalUrl,
            ip: req.ip
        });
        res.json((0, response_1.successResponse)(status, 'WebSocket服务状态'));
    }
    catch (error) {
        logger_1.logger.error('WebSocket状态查询失败', error);
        res.status(500).json((0, response_1.errorResponse)('WebSocket状态查询失败', 'WEBSOCKET_STATUS_ERROR'));
    }
});
// WebSocket连接测试
router.post('/test', async (req, res) => {
    try {
        const { message } = req.body;
        // 模拟WebSocket测试
        const testResult = {
            success: true,
            message: message || 'WebSocket测试消息',
            timestamp: new Date().toISOString(),
            endpoint: 'ws://localhost:3001/ws'
        };
        logger_1.logger.info('WebSocket连接测试', {
            message,
            ip: req.ip
        });
        res.json((0, response_1.successResponse)(testResult, 'WebSocket测试成功'));
    }
    catch (error) {
        logger_1.logger.error('WebSocket测试失败', error);
        res.status(500).json((0, response_1.errorResponse)('WebSocket测试失败', 'WEBSOCKET_TEST_ERROR'));
    }
});
exports.default = router;
//# sourceMappingURL=websocket.js.map