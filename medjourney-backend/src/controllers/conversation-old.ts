// 对话控制器

import { Request, Response } from 'express';
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { ApiResponse, RequestContext } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import TENFrameworkServiceFactory from '../services/ten-framework';
import ConversationAnalyzerFactory from '../services/conversation-analyzer';
import DatabaseServiceFactory from '../services/database';

interface AuthenticatedRequest extends Request {
  user?: {
    patient_id: string;
    role: string;
    iat: number;
    exp: number;
  };
}

export class ConversationController {
  private tenService: any;
  private analyzerService: any;
  private databaseService: any;
  private activeConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.tenService = TENFrameworkServiceFactory.create();
    this.analyzerService = ConversationAnalyzerFactory.create();
    this.databaseService = DatabaseServiceFactory.create();
    
    // 初始化 TEN Framework 连接
    this.initializeTENFramework();
  }

  // 启动对话会话
  async startConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId, sessionType } = req.body;
      const userId = req.user?.patient_id;
      
      logger.info('启动TEN Framework对话会话', {
        patientId,
        sessionType,
        userId
      });

      // 创建会话会话
      const session = await this.createSession(patientId, sessionType);
      
      // 创建 TEN Framework 会话
      const agoraChannelName = `medjourney_${session.sessionId}`;
      const agoraUid = `user_${patientId}`;
      
      const tenSession = await this.tenService.createSession({
        patientId,
        agoraChannelName,
        agoraUid
      });
      
      // 更新会话信息
      await this.updateSession(session.sessionId, {
        ten_session_id: tenSession.sessionId,
        agora_channel: agoraChannelName,
        agora_token: tenSession.agoraToken,
        agora_uid: agoraUid
      });
      
      const response: ApiResponse = successResponse({
        sessionId: session.sessionId,
        tenSessionId: tenSession.sessionId,
        agoraConfig: {
          appId: process.env.AGORA_APP_ID,
          channelName: agoraChannelName,
          token: tenSession.agoraToken,
          uid: agoraUid
        },
        websocketUrl: `/api/v1/conversation/ws/${session.sessionId}`
      }, '对话会话创建成功');
      
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('启动对话会话失败', error);
      const response: ApiResponse = errorResponse(
        '启动对话会话失败',
        'CONVERSATION_START_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 发送多模态消息
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { type, content, metadata } = req.body;
      const userId = req.user?.patient_id;
      
      logger.debug('发送多模态消息', {
        sessionId,
        type,
        contentLength: content.length,
        userId
      });

      // 验证会话是否存在
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = errorResponse(
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 发送消息到 TEN Framework
      const messageResult = await this.tenService.sendMessage({
        type,
        content,
        sessionId: session.ten_session_id
      });
      
      // 保存消息到数据库
      const savedMessage = await this.saveMessage({
        session_id: sessionId,
        type,
        content,
        sender: 'user',
        metadata: {
          ...metadata,
          ten_message_id: messageResult.messageId
        }
      });
      
      const response: ApiResponse = successResponse({
        messageId: savedMessage.id,
        tenMessageId: messageResult.messageId,
        status: messageResult.status,
        timestamp: savedMessage.created_at
      }, '消息发送成功');
      
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('发送消息失败', error);
      const response: ApiResponse = errorResponse(
        '发送消息失败',
        'MESSAGE_SEND_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取实时对话分析
  async getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { includeRecommendations, analysisType } = req.query;
      
      logger.debug('获取对话分析', {
        sessionId,
        analysisType,
        includeRecommendations
      });

      // 验证会话是否存在
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = errorResponse(
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 执行对话分析
      const analysis = await this.analyzerService.analyzeSession(sessionId);
      
      // 根据分析类型返回不同级别的结果
      let result = analysis;
      if (analysisType === 'basic') {
        result = {
          emotional_summary: analysis.emotional_summary,
          cognitive_score: this.calculateOverallCognitiveScore(analysis.cognitive_indicators),
          social_engagement_score: analysis.social_engagement.initiative_score
        };
      }
      
      if (includeRecommendations === false) {
        delete result.recommendations;
      }
      
      const response: ApiResponse = successResponse(result, '对话分析获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取对话分析失败', error);
      const response: ApiResponse = errorResponse(
        '获取对话分析失败',
        'ANALYSIS_GET_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取对话消息历史
  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 50, order = 'asc' } = req.query;
      
      // 验证会话是否存在
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = errorResponse(
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 获取消息列表
      const messages = await this.getMessagesBySessionId(sessionId, {
        page: Number(page),
        limit: Number(limit),
        order: order as string
      });
      
      const response: ApiResponse = successResponse(messages, '消息历史获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取消息历史失败', error);
      const response: ApiResponse = errorResponse(
        '获取消息历史失败',
        'MESSAGES_GET_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取会话状态
  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = errorResponse(
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 获取 TEN Framework 状态
      const tenStatus = this.tenService.isConnected();
      const activeSessions = this.tenService.getActiveSessions();
      
      const status = {
        sessionId,
        status: session.status,
        tenFrameworkStatus: tenStatus ? 'connected' : 'disconnected',
        isTenSessionActive: activeSessions.includes(session.ten_session_id),
        lastActivity: session.updated_at,
        messageCount: await this.getMessageCount(sessionId)
      };
      
      const response: ApiResponse = successResponse(status, '会话状态获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取会话状态失败', error);
      const response: ApiResponse = errorResponse(
        '获取会话状态失败',
        'STATUS_GET_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 结束对话会话
  async endConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = errorResponse(
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 关闭 TEN Framework 会话
      if (session.ten_session_id) {
        await this.tenService.closeSession(session.ten_session_id);
      }
      
      // 更新会话状态
      await this.updateSession(sessionId, {
        status: 'completed',
        ended_at: new Date()
      });
      
      // 关闭 WebSocket 连接
      const wsConnection = this.activeConnections.get(sessionId);
      if (wsConnection) {
        wsConnection.close();
        this.activeConnections.delete(sessionId);
      }
      
      logger.info('对话会话已结束', { sessionId });
      
      const response: ApiResponse = successResponse({
        sessionId,
        endedAt: new Date()
      }, '对话会话已结束');
      
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('结束对话会话失败', error);
      const response: ApiResponse = errorResponse(
        '结束对话会话失败',
        'CONVERSATION_END_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 处理 WebSocket 连接
  async handleWebSocket(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      // 这里应该升级为 WebSocket 连接
      // 实际实现中需要使用 ws 库或 socket.io
      logger.info('WebSocket 连接请求', { sessionId });
      
      const response: ApiResponse = successResponse({
        message: 'WebSocket 连接点，需要使用 WebSocket 客户端连接',
        websocketUrl: `ws://localhost:3001/api/v1/conversation/ws/${sessionId}`
      });
      
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('WebSocket 连接失败', error);
      const response: ApiResponse = errorResponse(
        'WebSocket 连接失败',
        'WEBSOCKET_CONNECTION_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 私有方法
  private async initializeTENFramework(): Promise<void> {
    try {
      await this.tenService.connect();
      
      // 设置消息监听器
      this.tenService.onMessage((message: any) => {
        this.handleTENMessage(message);
      });
      
      // 设置状态监听器
      this.tenService.onStatusChange((status: any) => {
        this.handleTENStatusChange(status);
      });
      
      logger.info('TEN Framework 初始化完成');
    } catch (error) {
      logger.error('TEN Framework 初始化失败', error as Error);
    }
  }

  private async handleTENMessage(message: any): Promise<void> {
    try {
      logger.debug('接收到 TEN Framework 消息', {
        messageId: message.messageId,
        sessionId: message.sessionId,
        type: message.type
      });
      
      // 保存 AI 响应消息
      await this.saveMessage({
        session_id: await this.getSessionIdByTenSessionId(message.sessionId),
        type: message.type,
        content: message.content,
        sender: 'assistant',
        metadata: {
          ten_message_id: message.messageId,
          confidence: message.confidence,
          audio_url: message.metadata?.audio_url,
          duration_ms: message.metadata?.duration_ms
        }
      });
      
      // 通过 WebSocket 转发给前端
      this.broadcastToWebSocket(message.sessionId, {
        type: 'message',
        data: message
      });
    } catch (error) {
      logger.error('处理 TEN Framework 消息失败', error as Error);
    }
  }

  private async handleTENStatusChange(status: any): Promise<void> {
    try {
      logger.debug('TEN Framework 状态变化', status);
      
      // 通过 WebSocket 转发状态更新
      this.broadcastToWebSocket(status.sessionId, {
        type: 'status',
        data: status
      });
    } catch (error) {
      logger.error('处理 TEN Framework 状态变化失败', error as Error);
    }
  }

  private broadcastToWebSocket(tenSessionId: string, message: any): void {
    // 这里应该根据 TEN 会话 ID 找到对应的 WebSocket 连接
    // 并发送消息给前端
    logger.debug('WebSocket 广播消息', {
      tenSessionId,
      messageType: message.type
    });
  }

  private async createSession(patientId: string, sessionType: string): Promise<any> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const query = `
      INSERT INTO sessions (id, patient_id, session_type, status, started_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const now = new Date();
    const result = await this.databaseService.query(query, [
      sessionId,
      patientId,
      sessionType,
      'active',
      now,
      now,
      now
    ]);
    
    return { sessionId, ...result[0] };
  }

  private async getSessionById(sessionId: string): Promise<any> {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    const result = await this.databaseService.query(query, [sessionId]);
    return result[0] || null;
  }

  private async updateSession(sessionId: string, updates: any): Promise<void> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE sessions 
      SET ${setClause}, updated_at = $1 
      WHERE id = $${Object.keys(updates).length + 2}
    `;
    
    const values = [new Date(), ...Object.values(updates), sessionId];
    await this.databaseService.query(query, values);
  }

  private async saveMessage(messageData: any): Promise<any> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const query = `
      INSERT INTO messages (id, session_id, type, content, sender, metadata, timestamp, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const now = new Date();
    const result = await this.databaseService.query(query, [
      messageId,
      messageData.session_id,
      messageData.type,
      messageData.content,
      messageData.sender,
      JSON.stringify(messageData.metadata || {}),
      now,
      now,
      now
    ]);
    
    return result[0];
  }

  private async getMessagesBySessionId(sessionId: string, options: any): Promise<any> {
    const { page, limit, order } = options;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT * FROM messages 
      WHERE session_id = $1 
      ORDER BY created_at ${order.toUpperCase()}
      LIMIT $2 OFFSET $3
    `;
    
    const messages = await this.databaseService.query(query, [sessionId, limit, offset]);
    
    const countQuery = 'SELECT COUNT(*) as total FROM messages WHERE session_id = $1';
    const countResult = await this.databaseService.query(countQuery, [sessionId]);
    const total = parseInt(countResult[0].total);
    
    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  private async getMessageCount(sessionId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE session_id = $1';
    const result = await this.databaseService.query(query, [sessionId]);
    return parseInt(result[0].count);
  }

  private async getSessionIdByTenSessionId(tenSessionId: string): Promise<string | null> {
    const query = 'SELECT id FROM sessions WHERE ten_session_id = $1';
    const result = await this.databaseService.query(query, [tenSessionId]);
    return result[0]?.id || null;
  }

  private calculateOverallCognitiveScore(cognitiveIndicators: any): number {
    const { memory_score, attention_score, language_score } = cognitiveIndicators;
    return (memory_score + attention_score + language_score) / 3;
  }
}
