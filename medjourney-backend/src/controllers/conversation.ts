// 对话控制器 - 更新版

import { Request, Response } from 'express';
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { StepfunServiceFactory } from '../services/stepfun';
import { TENFrameworkServiceFactory } from '../services/ten-framework';
import { localDatabaseService } from '../services/local-database';
import { ConversationAnalyzerFactory } from '../services/conversation-analyzer';
import { reportGeneratorService } from '../services/report-generator';

interface AuthenticatedRequest extends Request {
  user?: {
    patient_id: string;
    role: string;
    iat: number;
    exp: number;
  };
}

export class ConversationController {
  private stepfunService = StepfunServiceFactory.getInstance();
  private tenService = TENFrameworkServiceFactory.getInstance();
  private conversationAnalyzer = ConversationAnalyzerFactory.create();
  private activeConnections: Map<string, WebSocket> = new Map();

  constructor() {
    logger.info('对话控制器初始化完成');
  }

  // 启动对话会话
  async startConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId, sessionType } = req.body;
      const userId = req.user?.patient_id || 'test-user';
      
      logger.info('启动对话会话', {
        patientId,
        sessionType,
        userId
      });

      // 检查或创建患者
      let patient = await localDatabaseService.getPatient(patientId);
      if (!patient) {
        patient = await localDatabaseService.createPatient({
          name: `患者_${patientId}`,
          age: 70,
          medical_history: 'Alzheimer早期症状'
        });
      }

      // 创建对话会话
      const session = await localDatabaseService.createConversationSession({
        patient_id: patient.id,
        session_type: sessionType || 'consultation',
        status: 'active',
        metadata: JSON.stringify({
          agora_app_id: process.env.AGORA_APP_ID,
          user_id: userId,
          started_by: 'patient'
        })
      });
      
      // 生成Agora配置
      const agoraChannelName = `medjourney_${session.id}`;
      const agoraUid = `user_${patientId}`;
      
      logger.info('对话会话创建成功', {
        sessionId: session.id,
        patientId: patient.id,
        channelName: agoraChannelName
      });
      
      return successResponse(res, {
        sessionId: session.id,
        patientId: patient.id,
        agoraConfig: {
          appId: process.env.AGORA_APP_ID || 'd83b679bc7b3406c83f63864cb74aa99',
          channelName: agoraChannelName,
          uid: agoraUid,
          token: null // 在此项目中使用简化的验证
        },
        websocketUrl: `/api/conversation/ws/${session.id}`,
        status: 'active'
      }, '对话会话创建成功');
      
    } catch (error: any) {
      logger.error('启动对话会话失败', error);
      return errorResponse(res, null, `启动对话会话失败: ${error.message}`, 'CONVERSATION_START_ERROR', 500);
    }
  }

  // 发送多模态消息
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { type, content, metadata } = req.body;
      const userId = req.user?.patient_id || 'test-user';
      
      logger.info('接收对话消息', {
        sessionId,
        type,
        contentLength: content?.length || 0,
        userId
      });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 保存用户消息
      const userMessage = await localDatabaseService.addConversationMessage({
        session_id: sessionId,
        role: 'user',
        content: content,
        message_type: type || 'text',
        metadata: metadata ? JSON.stringify(metadata) : null
      });

      // 情感分析
      let emotionAnalysis = null;
      try {
        emotionAnalysis = await this.stepfunService.analyzeEmotion(content);
        
        // 更新消息的情感分析结果
        await localDatabaseService.addConversationMessage({
          session_id: sessionId,
          role: 'user',
          content: content,
          message_type: type || 'text',
          emotion_analysis: JSON.stringify(emotionAnalysis),
          metadata: metadata ? JSON.stringify(metadata) : null
        });
      } catch (emotionError) {
        logger.warn('情感分析失败', emotionError);
      }

      // 生成AI回复
      const aiResponse = await this.generateAIResponse(sessionId, content, session);

      // 保存AI回复
      const assistantMessage = await localDatabaseService.addConversationMessage({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse.response,
        message_type: 'text',
        metadata: JSON.stringify({
          confidence: aiResponse.confidence,
          tokens_used: aiResponse.usage.total_tokens,
          emotion_detected: emotionAnalysis?.primary_emotion
        })
      });

      logger.info('对话消息处理完成', {
        sessionId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        tokensUsed: aiResponse.usage.total_tokens
      });

      return successResponse(res, {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          emotion_analysis: emotionAnalysis
        },
        assistantMessage: {
          id: assistantMessage.id,
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp,
          confidence: aiResponse.confidence
        },
        usage: aiResponse.usage
      }, '消息处理成功');
      
    } catch (error: any) {
      logger.error('发送消息失败', error);
      return errorResponse(res, null, `发送消息失败: ${error.message}`, 'MESSAGE_SEND_ERROR', 500);
    }
  }

  // 获取对话分析
  async getConversationAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      logger.info('获取对话分析', { sessionId });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 获取会话消息
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      
      // 执行对话分析
      const analysis = await this.conversationAnalyzer.analyzeConversation({
        sessionId,
        messages,
        patientInfo: await localDatabaseService.getPatient(session.patient_id)
      });

      // 计算健康评分
      const healthScore = await this.calculateHealthScore(messages);

      logger.info('对话分析完成', {
        sessionId,
        messageCount: messages.length,
        healthScore: healthScore.overall_score
      });

      return successResponse(res, {
        sessionId,
        analysis: {
          message_count: messages.length,
          conversation_quality: analysis.quality_score,
          emotional_state: analysis.emotional_analysis,
          cognitive_indicators: analysis.cognitive_assessment,
          behavioral_patterns: analysis.behavioral_patterns
        },
        health_score: healthScore,
        summary: {
          key_insights: analysis.key_insights,
          risk_factors: analysis.risk_factors,
          recommendations: analysis.recommendations
        },
        timestamp: new Date().toISOString()
      }, '对话分析完成');
      
    } catch (error: any) {
      logger.error('获取对话分析失败', error);
      return errorResponse(res, null, `获取对话分析失败: ${error.message}`, 'ANALYSIS_ERROR', 500);
    }
  }

  // WebSocket处理
  handleWebSocket(ws: WebSocket, req: Request): void {
    const sessionId = req.url?.split('/').pop();
    
    if (!sessionId) {
      ws.close(4000, '无效的会话 ID');
      return;
    }

    logger.info('WebSocket连接建立', { sessionId });
    
    // 存储连接
    this.activeConnections.set(sessionId, ws);

    // 监听消息
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug('WebSocket消息', { sessionId, type: message.type });

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;
            
          case 'audio_chunk':
            // 处理音频数据块
            await this.handleAudioChunk(sessionId, message.data);
            break;
            
          case 'text_message':
            // 处理文本消息
            const response = await this.processTextMessage(sessionId, message.content);
            ws.send(JSON.stringify({
              type: 'ai_response',
              content: response.response,
              confidence: response.confidence,
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            logger.warn('未知的WebSocket消息类型', { type: message.type });
        }
      } catch (error) {
        logger.error('WebSocket消息处理失败', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '消息处理失败',
          timestamp: new Date().toISOString()
        }));
      }
    });

    // 处理连接关闭
    ws.on('close', () => {
      logger.info('WebSocket连接关闭', { sessionId });
      this.activeConnections.delete(sessionId);
    });

    // 处理错误
    ws.on('error', (error) => {
      logger.error('WebSocket错误', error, { sessionId });
      this.activeConnections.delete(sessionId);
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      message: '对话连接建立成功',
      sessionId,
      timestamp: new Date().toISOString()
    }));
  }

  // 生成AI回复
  private async generateAIResponse(sessionId: string, userInput: string, session: any): Promise<{
    response: string;
    confidence: number;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number; };
  }> {
    try {
      // 获取会话历史
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      const recentMessages = messages.slice(-5); // 最近5条消息
      
      // 获取患者信息
      const patient = await localDatabaseService.getPatient(session.patient_id);
      
      // 构建上下文
      const context = {
        patient_info: patient,
        recent_messages: recentMessages,
        session_type: session.session_type,
        medical_focus: 'alzheimer_care'
      };

      // 构建医疗场景的提示词
      const medicalPrompt = `作为MedJourney的专业医疗AI助手，您正在与一位患有Alzheimer病的患者进行对话。

患者信息：
- 姓名：${patient?.name || '患者'}
- 年龄：${patient?.age || '70'}岁
- 病史：${patient?.medical_history || 'Alzheimer早期症状'}

请用温馨、耐心、专业的语气回复患者的问题。回复应该：
1. 简洁易懂，避免复杂的医学术语
2. 充满关爱和同理心
3. 提供实用的建议和安慰
4. 鼓励患者继续交流

患者说："${userInput}"

请回复：`;

      logger.debug('发送Stepfun API请求', {
        sessionId,
        promptLength: medicalPrompt.length,
        userInputLength: userInput.length
      });

      // 调用Stepfun AI
      const aiResponse = await this.stepfunService.generateResponse(medicalPrompt, context);
      
      logger.info('AI回复生成成功', {
        sessionId,
        responseLength: aiResponse.response.length,
        tokensUsed: aiResponse.usage.total_tokens,
        confidence: aiResponse.confidence
      });

      return aiResponse;
    } catch (error) {
      logger.error('AI回复生成失败', error);
      // 返回默认回复
      return {
        response: '抱歉，我现在没法给出合适的回复。请稍后再试或联系医疗专业人员。',
        confidence: 0.5,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
  }

  // 计算健康评分
  private async calculateHealthScore(messages: any[]): Promise<{
    overall_score: number;
    cognitive_score: number;
    emotional_score: number;
    communication_score: number;
    details: any;
  }> {
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      return {
        overall_score: 50,
        cognitive_score: 50,
        emotional_score: 50,
        communication_score: 50,
        details: { message: '数据不足，无法评估' }
      };
    }

    // 认知评分（基于消息复杂度和一致性）
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const cognitiveScore = Math.min(100, Math.max(20, avgMessageLength * 2));
    
    // 情绪评分（基于情感分析结果）
    let emotionalScore = 70; // 默认值
    try {
      const lastMessage = userMessages[userMessages.length - 1];
      const emotionAnalysis = await this.stepfunService.analyzeEmotion(lastMessage.content);
      emotionalScore = this.getEmotionScore(emotionAnalysis.emotion);
    } catch (error) {
      logger.warn('情绪评分计算失败', error);
    }
    
    // 交流评分（基于交互频率和质量）
    const communicationScore = Math.min(100, userMessages.length * 15);
    
    // 综合评分
    const overallScore = Math.round(
      cognitiveScore * 0.4 +
      emotionalScore * 0.3 +
      communicationScore * 0.3
    );

    return {
      overall_score: overallScore,
      cognitive_score: Math.round(cognitiveScore),
      emotional_score: Math.round(emotionalScore),
      communication_score: Math.round(communicationScore),
      details: {
        message_count: userMessages.length,
        avg_message_length: Math.round(avgMessageLength),
        assessment_date: new Date().toISOString()
      }
    };
  }

  private getEmotionScore(emotion: string): number {
    const emotionScores: Record<string, number> = {
      'happiness': 90,
      'neutral': 70,
      'sadness': 40,
      'anger': 30,
      'fear': 25,
      'surprise': 60
    };
    return emotionScores[emotion] || 50;
  }

  // 处理音频数据块
  private async handleAudioChunk(sessionId: string, audioData: any): Promise<void> {
    try {
      logger.debug('处理音频数据块', { sessionId, dataSize: audioData?.length });
      
      // 这里可以集成语音识别服务
      // 现在只是记录日志
      
      // 发送确认消息给客户端
      const ws = this.activeConnections.get(sessionId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'audio_received',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      logger.error('处理音频数据块失败', error);
    }
  }

  // 处理文本消息
  private async processTextMessage(sessionId: string, content: string): Promise<{
    response: string;
    confidence: number;
  }> {
    try {
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      const aiResponse = await this.generateAIResponse(sessionId, content, session);
      
      // 保存消息到数据库
      await localDatabaseService.addConversationMessage({
        session_id: sessionId,
        role: 'user',
        content: content,
        message_type: 'text'
      });

      await localDatabaseService.addConversationMessage({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse.response,
        message_type: 'text',
        metadata: JSON.stringify({
          confidence: aiResponse.confidence,
          tokens_used: aiResponse.usage.total_tokens
        })
      });

      return {
        response: aiResponse.response,
        confidence: aiResponse.confidence
      };
    } catch (error) {
      logger.error('处理文本消息失败', error);
      return {
        response: '抱歉，我现在没法理解您的消息。请稍后再试。',
        confidence: 0.1
      };
    }
  }

  // 获取活跃连接数
  getActiveConnectionsCount(): number {
    return this.activeConnections.size;
  }

  // 关闭所有连接
  closeAllConnections(): void {
    this.activeConnections.forEach((ws, sessionId) => {
      ws.close(1001, '服务器关闭');
      logger.info('WebSocket连接已关闭', { sessionId });
    });
    this.activeConnections.clear();
  }

  // 获取对话分析 (路由方法)
  async getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.getConversationAnalysis(req, res);
  }

  // 获取对话消息
  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      logger.info('获取对话消息', {
        sessionId,
        limit,
        offset
      });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 获取消息列表
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      
      // 分页处理
      const startIndex = parseInt(offset as string);
      const pageSize = parseInt(limit as string);
      const paginatedMessages = messages.slice(startIndex, startIndex + pageSize);
      
      return successResponse(res, {
        session_id: sessionId,
        messages: paginatedMessages,
        pagination: {
          total: messages.length,
          limit: pageSize,
          offset: startIndex,
          has_more: startIndex + pageSize < messages.length
        }
      }, '获取消息成功');
      
    } catch (error: any) {
      logger.error('获取对话消息失败', error);
      return errorResponse(res, null, `获取消息失败: ${error.message}`, 'GET_MESSAGES_ERROR', 500);
    }
  }

  // 获取会话状态
  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      logger.info('获取会话状态', { sessionId });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 获取消息统计
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      const isActive = this.activeConnections.has(sessionId);
      
      return successResponse(res, {
        session_id: sessionId,
        status: session.status,
        is_active: isActive,
        message_count: messages.length,
        last_activity: session.updated_at,
        session_type: session.session_type,
        created_at: session.created_at
      }, '获取会话状态成功');
      
    } catch (error: any) {
      logger.error('获取会话状态失败', error);
      return errorResponse(res, null, `获取状态失败: ${error.message}`, 'GET_STATUS_ERROR', 500);
    }
  }

  // 结束对话会话
  async endConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reason = 'user_ended' } = req.body;
      
      logger.info('结束对话会话', {
        sessionId,
        reason
      });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 更新会话状态
      await localDatabaseService.updateConversationSession(sessionId, {
        status: 'completed',
        end_reason: reason,
        updated_at: new Date().toISOString()
      });

      // 关闭WebSocket连接
      const ws = this.activeConnections.get(sessionId);
      if (ws) {
        ws.close(1000, '会话结束');
        this.activeConnections.delete(sessionId);
      }
      
      // 生成会话摘要
      const summary = await this.generateSessionSummary(sessionId);
      
      return successResponse(res, {
        session_id: sessionId,
        end_time: new Date().toISOString(),
        reason,
        summary
      }, '会话结束成功');
      
    } catch (error: any) {
      logger.error('结束对话会话失败', error);
      return errorResponse(res, null, `结束会话失败: ${error.message}`, 'END_CONVERSATION_ERROR', 500);
    }
  }

  // 处理WebSocket连接 (简化版)
  async handleWebSocket(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      logger.info('WebSocket连接请求', { sessionId });
      
      // 这里需要WebSocket服务器的支持
      // 在实际实现中，这应该通过WebSocket服务器处理
      return successResponse(res, {
        websocket_url: `ws://localhost:3001/api/conversation/ws/${sessionId}`,
        session_id: sessionId,
        supported_events: ['message', 'audio_chunk', 'status_change']
      }, 'WebSocket信息获取成功');
      
    } catch (error: any) {
      logger.error('WebSocket处理失败', error);
      return errorResponse(res, null, `WebSocket处理失败: ${error.message}`, 'WEBSOCKET_ERROR', 500);
    }
  }

  // 生成会话摘要
  private async generateSessionSummary(sessionId: string): Promise<any> {
    try {
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      
      return {
        total_messages: messages.length,
        user_messages: messages.filter(m => m.role === 'user').length,
        ai_messages: messages.filter(m => m.role === 'assistant').length,
        session_duration: '估算时长',
        key_topics: ['示例话题1', '示例话题2']
      };
    } catch (error) {
      logger.error('生成会话摘要失败', error);
      return null;
    }
  }
}

export const conversationController = new ConversationController();
