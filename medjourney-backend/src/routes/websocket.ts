// WebSocket路由和状态管理

import { Router } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import WebSocketServerService from '../services/websocket-server';

const router = Router();

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

    logger.info('WebSocket状态查询', {
      endpoint: req.originalUrl,
      ip: req.ip
    });

    res.json(successResponse(status, 'WebSocket服务状态'));
  } catch (error) {
    logger.error('WebSocket状态查询失败', error as Error);
    res.status(500).json(errorResponse(
      'WebSocket状态查询失败',
      'WEBSOCKET_STATUS_ERROR'
    ));
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

    logger.info('WebSocket连接测试', {
      message,
      ip: req.ip
    });

    res.json(successResponse(testResult, 'WebSocket测试成功'));
  } catch (error) {
    logger.error('WebSocket测试失败', error as Error);
    res.status(500).json(errorResponse(
      'WebSocket测试失败',
      'WEBSOCKET_TEST_ERROR'
    ));
  }
});

export default router;
