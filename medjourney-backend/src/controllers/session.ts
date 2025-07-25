// 会话管理控制器

import { Request, Response, NextFunction } from 'express';
import { DatabaseServiceFactory } from '../services/database';
import { AIServiceFactory } from '../services/ai';
import RAGServiceFactory from '../services/rag';
import { logger } from '../utils/logger';
import ResponseHelper from '../utils/response';
import { CreateSessionRequest } from '../types/api';
import { NotFoundError } from '../utils/errors';

class SessionController {
  private databaseService = DatabaseServiceFactory.getInstance()!;
  private aiService = AIServiceFactory.getInstance()!;
  private ragService: any = null;

  constructor() {
    this.initializeRAGService();
  }

  private async initializeRAGService(): Promise<void> {
    try {
      this.ragService = await RAGServiceFactory.create();
    } catch (error) {
      logger.error('RAG服务初始化失败', error as Error);
    }
  }

  // 创建新会话
  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionData: CreateSessionRequest = req.body;
      const currentUserId = req.user?.patient_id;
      
      logger.info('创建会话请求', {
        requestId: req.requestId,
        patientId: sessionData.patient_id,
        sessionType: sessionData.session_type,
        currentUserId
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(sessionData.patient_id);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 创建会话
      const session = await this.databaseService.createSession({
        patient_id: sessionData.patient_id,
        session_type: sessionData.session_type || 'chat',
        status: 'active'
      });

      // 创建欢迎消息
      const welcomeMessage = await this.generateWelcomeMessage(patient.name, session.session_type);
      await this.databaseService.createMessage({
        session_id: session.id,
        content: welcomeMessage,
        message_type: 'text',
        sender_type: 'ai',
        metadata: {
          ai_response: true,
          welcome_message: true
        }
      });

      logger.info('会话创建成功', {
        requestId: req.requestId,
        sessionId: session.id,
        patientId: sessionData.patient_id
      });

      ResponseHelper.created(res, session, '会话创建成功');
    } catch (error) {
      logger.error('创建会话失败', error as Error, {
        requestId: req.requestId,
        body: req.body
      });
      next(error);
    }
  };

  // 获取会话信息
  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      
      logger.debug('获取会话信息', {
        requestId: req.requestId,
        sessionId
      });

      const session = await this.databaseService.getSession(sessionId);
      if (!session) {
        throw new NotFoundError('会话不存在');
      }

      ResponseHelper.success(res, session);
    } catch (error) {
      logger.error('获取会话信息失败', error as Error, {
        requestId: req.requestId,
        sessionId: req.params.sessionId
      });
      next(error);
    }
  };

  // 更新会话状态
  updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { status, notes } = req.body;
      
      logger.info('更新会话状态', {
        requestId: req.requestId,
        sessionId,
        status,
        notes
      });

      const existingSession = await this.databaseService.getSession(sessionId);
      if (!existingSession) {
        throw new NotFoundError('会话不存在');
      }

      const updatedSession = await this.databaseService.updateSession(sessionId, {
        status,
        notes,
        ended_at: status === 'completed' ? new Date() : undefined
      });

      logger.info('会话状态更新成功', {
        requestId: req.requestId,
        sessionId
      });

      ResponseHelper.success(res, updatedSession, '会话状态更新成功');
    } catch (error) {
      logger.error('更新会话状态失败', error as Error, {
        requestId: req.requestId,
        sessionId: req.params.sessionId,
        body: req.body
      });
      next(error);
    }
  };

  // 获取患者的会话列表
  getPatientSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const sessionType = req.query.session_type as string;
      
      logger.debug('获取患者会话列表', {
        requestId: req.requestId,
        patientId,
        page,
        limit,
        status,
        sessionType
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 构建查询选项
      const options: any = {
        patient_id: patientId,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      };

      if (status) {
        options.status = status;
      }
      if (sessionType) {
        options.session_type = sessionType;
      }

      const result = await this.databaseService.listSessions(options);

      ResponseHelper.paginated(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      logger.error('获取患者会话列表失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId,
        query: req.query
      });
      next(error);
    }
  };

  // 获取会话消息列表
  getSessionMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      logger.debug('获取会话消息列表', {
        requestId: req.requestId,
        sessionId,
        page,
        limit
      });

      // 验证会话是否存在
      const session = await this.databaseService.getSession(sessionId);
      if (!session) {
        throw new NotFoundError('会话不存在');
      }

      const result = await this.databaseService.listMessages({
        session_id: sessionId,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'asc'
      });

      ResponseHelper.paginated(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      logger.error('获取会话消息列表失败', error as Error, {
        requestId: req.requestId,
        sessionId: req.params.sessionId,
        query: req.query
      });
      next(error);
    }
  };

  // 发送消息并获取AI回复
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { content, message_type, attachments } = req.body;
      const currentUserId = req.user?.patient_id;
      
      logger.info('发送消息请求', {
        requestId: req.requestId,
        sessionId,
        messageType: message_type,
        contentLength: content?.length,
        attachments: attachments?.length,
        currentUserId
      });

      // 验证会话是否存在
      const session = await this.databaseService.getSession(sessionId);
      if (!session) {
        throw new NotFoundError('会话不存在');
      }

      // 创建用户消息
      const userMessage = await this.databaseService.createMessage({
        session_id: sessionId,
        content,
        message_type: message_type || 'text',
        sender_type: 'patient',
        attachments,
        metadata: {
          user_id: currentUserId
        }
      });

      // 生成AI回复
      const aiResponse = await this.generateAIResponse(session, content, message_type);
      
      // 创建AI回复消息
      const aiMessage = await this.databaseService.createMessage({
        session_id: sessionId,
        content: aiResponse.content,
        message_type: 'text',
        sender_type: 'ai',
        metadata: {
          ai_response: true,
          confidence: aiResponse.confidence,
          sources: aiResponse.sources
        }
      });

      logger.info('消息发送成功', {
        requestId: req.requestId,
        sessionId,
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id
      });

      ResponseHelper.success(res, {
        userMessage,
        aiMessage
      }, '消息发送成功');
    } catch (error) {
      logger.error('发送消息失败', error as Error, {
        requestId: req.requestId,
        sessionId: req.params.sessionId,
        body: req.body
      });
      next(error);
    }
  };

  // 生成欢迎消息
  private async generateWelcomeMessage(patientName: string, sessionType: string): Promise<string> {
    const welcomeMessages = {
      chat: `你好，${patientName}！我是您的AI陪伴助手。今天感觉怎么样？有什么想聊的吗？`,
      assessment: `你好，${patientName}！让我们开始今天的认知评估。请放轻松，我会一步步引导您完成。`,
      therapy: `你好，${patientName}！欢迎来到认知训练时间。今天我们将进行一些有趣的大脑练习。`
    };

    return welcomeMessages[sessionType as keyof typeof welcomeMessages] || welcomeMessages.chat;
  }

  // 生成AI回复
  private async generateAIResponse(session: any, userMessage: string, messageType: string): Promise<{
    content: string;
    confidence: number;
    sources: any[];
  }> {
    try {
      // 获取会话历史
      const recentMessages = await this.databaseService.listMessages({
        session_id: session.id,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // 构建上下文
      const context = recentMessages.data
        .reverse()
        .map(msg => `${msg.sender_type}: ${msg.content}`)
        .join('\n');

      // 使用RAG服务生成回复（如果可用）
      if (this.ragService && messageType === 'text') {
        const ragResponse = await this.ragService.query(userMessage, {
          topK: 3,
          threshold: 0.7
        });

        return {
          content: ragResponse.answer,
          confidence: ragResponse.confidence,
          sources: ragResponse.sources
        };
      } else {
        // 使用基础AI服务
        const aiResponse = await this.aiService.generateResponse(
          userMessage,
          context,
          session.patient_id
        );

        return {
          content: aiResponse,
          confidence: 0.8,
          sources: []
        };
      }
    } catch (error) {
      logger.error('生成AI回复失败', error as Error);
      
      // 回退到默认回复
      return {
        content: '抱歉，我现在无法理解您的问题。您能换个方式问我吗？',
        confidence: 0.1,
        sources: []
      };
    }
  }
}

export default new SessionController();