// TEN Framework 集成服务

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AIServiceError } from '../utils/errors';
import { TENFrameworkService } from '../types/services';
import StepfunServiceFactory from './stepfun';
import ElevenLabsServiceFactory from './elevenlabs';

// TEN 消息类型
interface TENMessage {
  type: 'text' | 'audio' | 'image' | 'control';
  content: string | ArrayBuffer;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface TENResponse {
  messageId: string;
  type: 'text' | 'audio';
  content: string;
  confidence: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface TENStatusUpdate {
  sessionId: string;
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  metadata?: Record<string, any>;
}

// TEN Framework 服务实现类
class TENFrameworkServiceImpl extends EventEmitter implements TENFrameworkService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private endpoint: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, any> = new Map();
  private stepfunService: any;
  private elevenLabsService: any;

  constructor() {
    super();
    this.endpoint = config.ai.ten_framework_endpoint;
    this.stepfunService = StepfunServiceFactory.create();
    this.elevenLabsService = ElevenLabsServiceFactory.create();
    
    logger.info('TEN Framework 服务初始化完成', {
      endpoint: this.endpoint
    });
  }

  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.warn('TEN Framework 已经连接');
        return;
      }

      logger.info('连接到 TEN Framework', { endpoint: this.endpoint });
      
      this.ws = new WebSocket(this.endpoint);
      
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket 初始化失败'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('TEN Framework 连接超时'));
        }, 10000);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          logger.info('TEN Framework 连接成功');
          
          // 发送初始化消息
          this.sendInitMessage();
          
          // 启动心跳
          this.startHeartbeat();
          
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });

        this.ws.on('close', (code, reason) => {
          clearTimeout(timeout);
          this.isConnected = false;
          this.stopHeartbeat();
          
          logger.warn('TEN Framework 连接关闭', {
            code,
            reason: reason.toString()
          });
          
          // 自动重连
          this.handleReconnect();
        });

        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('TEN Framework 连接错误', error);
          reject(new AIServiceError(
            `TEN Framework 连接失败: ${error.message}`,
            'TEN_CONNECTION_ERROR'
          ));
        });
      });
    } catch (error: any) {
      logger.error('TEN Framework 连接失败', error);
      throw new AIServiceError(
        `TEN Framework 连接失败: ${error.message}`,
        'TEN_CONNECTION_ERROR'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.isConnected = false;
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      
      logger.info('TEN Framework 连接已断开');
    }
  }

  isConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  async sendMessage(message: {
    type: 'text' | 'audio' | 'image';
    content: string | ArrayBuffer;
    sessionId: string;
  }): Promise<{
    messageId: string;
    status: 'sent' | 'delivered' | 'failed';
  }> {
    try {
      if (!this.isConnected() || !this.ws) {
        throw new Error('TEN Framework 未连接');
      }

      const messageId = this.generateMessageId();
      
      logger.debug('TEN Framework 发送消息', {
        messageId,
        type: message.type,
        sessionId: message.sessionId,
        contentLength: typeof message.content === 'string' ? message.content.length : message.content.byteLength
      });

      // 根据消息类型处理
      await this.processMessage({
        messageId,
        ...message
      });

      return {
        messageId,
        status: 'sent'
      };
    } catch (error: any) {
      logger.error('TEN Framework 发送消息失败', error);
      throw new AIServiceError(
        `TEN Framework 消息发送失败: ${error.message}`,
        'TEN_SEND_MESSAGE_ERROR'
      );
    }
  }

  onMessage(callback: (message: {
    messageId: string;
    type: 'text' | 'audio';
    content: string;
    confidence: number;
    sessionId: string;
  }) => void): void {
    this.on('message', callback);
  }

  onStatusChange(callback: (status: {
    sessionId: string;
    status: 'idle' | 'listening' | 'processing' | 'speaking';
  }) => void): void {
    this.on('statusChange', callback);
  }

  async createSession(options: {
    patientId: string;
    agoraChannelName: string;
    agoraUid: string;
  }): Promise<{
    sessionId: string;
    agoraToken: string;
  }> {
    try {
      const sessionId = this.generateSessionId();
      
      // 创建会话上下文
      const sessionContext = {
        sessionId,
        patientId: options.patientId,
        agoraChannelName: options.agoraChannelName,
        agoraUid: options.agoraUid,
        createdAt: new Date(),
        status: 'idle' as const
      };
      
      this.activeSessions.set(sessionId, sessionContext);
      
      // 生成 Agora Token（实际应用中应该调用 Agora 的 Token 生成服务）
      const agoraToken = this.generateAgoraToken(options.agoraChannelName, options.agoraUid);
      
      logger.info('TEN Framework 会话创建成功', {
        sessionId,
        patientId: options.patientId,
        agoraChannelName: options.agoraChannelName
      });
      
      return {
        sessionId,
        agoraToken
      };
    } catch (error: any) {
      logger.error('TEN Framework 会话创建失败', error);
      throw new AIServiceError(
        `TEN Framework 会话创建失败: ${error.message}`,
        'TEN_CREATE_SESSION_ERROR'
      );
    }
  }

  // 私有方法：处理消息
  private async processMessage(message: {
    messageId: string;
    type: 'text' | 'audio' | 'image';
    content: string | ArrayBuffer;
    sessionId: string;
  }): Promise<void> {
    try {
      const session = this.activeSessions.get(message.sessionId);
      if (!session) {
        throw new Error(`会话 ${message.sessionId} 不存在`);
      }

      // 更新会话状态
      this.updateSessionStatus(message.sessionId, 'processing');

      let textContent = '';
      
      // 根据消息类型处理
      if (message.type === 'text') {
        textContent = message.content as string;
      } else if (message.type === 'audio') {
        // 音频转文本（这里需要集成 STT 服务）
        textContent = await this.audioToText(message.content as ArrayBuffer);
      } else if (message.type === 'image') {
        // 图像识别（这里需要集成视觉理解服务）
        textContent = await this.imageToText(message.content as string);
      }

      // 使用 Stepfun 生成回应
      const aiResponse = await this.stepfunService.generateResponse(textContent, {
        sessionId: message.sessionId,
        patientInfo: session.patientInfo
      });

      // 使用 ElevenLabs 合成语音
      this.updateSessionStatus(message.sessionId, 'speaking');
      const speechResponse = await this.elevenLabsService.synthesizeSpeech(aiResponse.response);

      // 发送响应
      const response: TENResponse = {
        messageId: this.generateMessageId(),
        type: 'text',
        content: aiResponse.response,
        confidence: aiResponse.confidence,
        sessionId: message.sessionId,
        metadata: {
          audio_url: speechResponse.audio_url,
          duration_ms: speechResponse.duration_ms,
          original_message_id: message.messageId
        }
      };

      this.emit('message', response);
      
      // 更新会话状态为空闲
      this.updateSessionStatus(message.sessionId, 'idle');
      
      logger.debug('TEN Framework 消息处理完成', {
        messageId: message.messageId,
        responseId: response.messageId,
        sessionId: message.sessionId
      });
    } catch (error: any) {
      logger.error('TEN Framework 消息处理失败', error);
      
      // 发送错误响应
      this.emit('message', {
        messageId: this.generateMessageId(),
        type: 'text',
        content: '抱歉，我的大脑暂时无法思考，请稍后再试。',
        confidence: 0.0,
        sessionId: message.sessionId,
        metadata: {
          error: true,
          error_message: error.message
        }
      });
      
      this.updateSessionStatus(message.sessionId, 'idle');
    }
  }

  // 私有方法：更新会话状态
  private updateSessionStatus(sessionId: string, status: 'idle' | 'listening' | 'processing' | 'speaking'): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = status;
      this.activeSessions.set(sessionId, session);
      
      this.emit('statusChange', {
        sessionId,
        status
      });
      
      logger.debug('TEN Framework 会话状态更新', {
        sessionId,
        status
      });
    }
  }

  // 私有方法：处理接收到的消息
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      logger.debug('TEN Framework 接收消息', {
        type: message.type,
        sessionId: message.sessionId
      });
      
      // 处理不同类型的消息
      if (message.type === 'ping') {
        this.sendPong();
      } else if (message.type === 'status_update') {
        this.emit('statusChange', message.data);
      } else if (message.type === 'response') {
        this.emit('message', message.data);
      }
    } catch (error) {
      logger.error('TEN Framework 消息解析失败', error as Error);
    }
  }

  // 私有方法：处理重连
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      logger.info(`TEN Framework 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          logger.error('TEN Framework 重连失败', error);
        });
      }, this.reconnectInterval);
    } else {
      logger.error('TEN Framework 重连尝试超过最大次数');
    }
  }

  // 私有方法：发送初始化消息
  private sendInitMessage(): void {
    if (this.ws && this.isConnected) {
      const initMessage = {
        type: 'init',
        data: {
          version: '1.0.0',
          capabilities: ['text', 'audio', 'image'],
          agora_app_id: config.ai.agora_app_id
        }
      };
      
      this.ws.send(JSON.stringify(initMessage));
      logger.debug('TEN Framework 初始化消息已发送');
    }
  }

  // 私有方法：启动心跳
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 每30秒发送一次心跳
  }

  // 私有方法：停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 私有方法：发送 Pong 消息
  private sendPong(): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type: 'pong' }));
    }
  }

  // 私有方法：音频转文本（模拟实现）
  private async audioToText(audioBuffer: ArrayBuffer): Promise<string> {
    // 这里应该集成真实的 STT 服务（如 Deepgram）
    logger.debug('音频转文本（模拟）', {
      audioSize: audioBuffer.byteLength
    });
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return '用户通过语音说了一句话'; // 模拟结果
  }

  // 私有方法：图像转文本（模拟实现）
  private async imageToText(imageUrl: string): Promise<string> {
    // 这里应该集成真实的视觉理解服务
    logger.debug('图像识别（模拟）', {
      imageUrl: imageUrl.substring(0, 100)
    });
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return '用户分享了一张图片'; // 模拟结果
  }

  // 私有方法：生成消息 ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 私有方法：生成会话 ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 私有方法：生成 Agora Token（模拟实现）
  private generateAgoraToken(channelName: string, uid: string): string {
    // 实际应用中应该使用 Agora 的 Token 生成算法
    const fakeToken = `agora_token_${channelName}_${uid}_${Date.now()}`;
    logger.debug('Agora Token 生成（模拟）', {
      channelName,
      uid,
      token: fakeToken.substring(0, 50)
    });
    return fakeToken;
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    return this.isConnected();
  }

  // 获取服务统计信息
  getStats(): any {
    return {
      service: 'TEN Framework',
      endpoint: this.endpoint,
      isConnected: this.isConnected(),
      activeSessions: this.activeSessions.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // 获取活跃会话
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  // 关闭会话
  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.delete(sessionId);
      logger.info('TEN Framework 会话已关闭', { sessionId });
    }
  }
}

// 服务工厂
class TENFrameworkServiceFactory {
  private static instance: TENFrameworkService | null = null;

  static create(): TENFrameworkService {
    if (TENFrameworkServiceFactory.instance) {
      return TENFrameworkServiceFactory.instance;
    }

    TENFrameworkServiceFactory.instance = new TENFrameworkServiceImpl();
    logger.info('TEN Framework 服务实例创建完成');
    
    return TENFrameworkServiceFactory.instance;
  }

  static getInstance(): TENFrameworkService | null {
    return TENFrameworkServiceFactory.instance;
  }

  static reset(): void {
    TENFrameworkServiceFactory.instance = null;
  }
}

export { TENFrameworkServiceFactory, TENFrameworkServiceImpl };
export default TENFrameworkServiceFactory;
