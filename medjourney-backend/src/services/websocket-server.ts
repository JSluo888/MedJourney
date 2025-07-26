// WebSocket服务器集成 - 提供TEN Framework连接

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { TENFrameworkServiceFactory } from './ten-framework';
import StepfunServiceFactory from './stepfun';
import ElevenLabsServiceFactory from './elevenlabs';

interface ClientSession {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  channel: string;
  lastActivity: Date;
  status: 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking' | 'disconnected';
}

interface TENMessage {
  type: 'initialize' | 'text_message' | 'start_voice_recording' | 'stop_voice_recording' | 'image_upload' | 'ping' | 'pong';
  text?: string;
  imageData?: string;
  fileName?: string;
  userId?: string;
  config?: any;
}

class WebSocketServerService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientSession> = new Map();
  private stepfunService: any;
  private elevenLabsService: any;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.stepfunService = StepfunServiceFactory.create();
    this.elevenLabsService = ElevenLabsServiceFactory.create();
  }

  initialize(httpServer: HttpServer): void {
    try {
      this.wss = new WebSocketServer({ 
        server: httpServer,
        path: '/ws'
      });

      this.wss.on('connection', (ws: WebSocket, request) => {
        this.handleConnection(ws, request);
      });

      // 启动清理任务，每分钟清理不活跃的连接
      this.cleanupInterval = setInterval(() => {
        this.cleanupInactiveClients();
      }, 60000);

      logger.info('WebSocket服务器初始化完成', {
        path: '/ws',
        activeClients: this.clients.size
      });
    } catch (error) {
      logger.error('WebSocket服务器初始化失败', error as Error);
      throw error;
    }
  }

  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    
    logger.info('新的WebSocket连接', {
      clientId,
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent']
    });

    // 创建客户端会话
    const session: ClientSession = {
      ws,
      sessionId: clientId,
      userId: '',
      channel: '',
      lastActivity: new Date(),
      status: 'connecting'
    };

    this.clients.set(clientId, session);

    // 设置消息处理器
    ws.on('message', async (data: Buffer) => {
      try {
        await this.handleMessage(clientId, data);
      } catch (error) {
        logger.error('WebSocket消息处理失败', error as Error, {
          clientId
        });
        this.sendError(clientId, '消息处理失败');
      }
    });

    // 设置关闭处理器
    ws.on('close', (code: number, reason: Buffer) => {
      logger.info('WebSocket连接关闭', {
        clientId,
        code,
        reason: reason.toString()
      });
      this.clients.delete(clientId);
    });

    // 设置错误处理器
    ws.on('error', (error: Error) => {
      logger.error('WebSocket连接错误', error, {
        clientId
      });
      this.clients.delete(clientId);
    });

    // 发送连接确认
    this.sendMessage(clientId, {
      type: 'connection_established',
      sessionId: clientId,
      status: 'connected'
    });
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session) {
      logger.warn('收到未知客户端的消息', { clientId });
      return;
    }

    session.lastActivity = new Date();

    try {
      const message: TENMessage = JSON.parse(data.toString());
      
      logger.debug('收到WebSocket消息', {
        clientId,
        type: message.type,
        userId: message.userId
      });

      switch (message.type) {
        case 'initialize':
          await this.handleInitialize(clientId, message);
          break;
        
        case 'text_message':
          await this.handleTextMessage(clientId, message);
          break;
        
        case 'start_voice_recording':
          await this.handleStartVoiceRecording(clientId, message);
          break;
        
        case 'stop_voice_recording':
          await this.handleStopVoiceRecording(clientId, message);
          break;
        
        case 'image_upload':
          await this.handleImageUpload(clientId, message);
          break;
        
        case 'ping':
          this.sendMessage(clientId, { type: 'pong' });
          break;
        
        default:
          logger.warn('未知的消息类型', {
            clientId,
            type: message.type
          });
      }
    } catch (error) {
      logger.error('消息解析失败', error as Error, {
        clientId,
        data: data.toString().substring(0, 100)
      });
      this.sendError(clientId, '消息格式错误');
    }
  }

  private async handleInitialize(clientId: string, message: TENMessage): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session) return;

    session.userId = message.config?.userId || '';
    session.channel = message.config?.channel || '';
    session.status = 'connected';

    this.sendMessage(clientId, {
      type: 'initialized',
      sessionId: clientId,
      status: 'connected'
    });

    logger.info('客户端初始化完成', {
      clientId,
      userId: session.userId,
      channel: session.channel
    });
  }

  private async handleTextMessage(clientId: string, message: TENMessage): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session || !message.text) return;

    try {
      // 更新状态为处理中
      session.status = 'processing';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'processing'
      });

      // 使用Stepfun生成回应
      const aiResponse = await this.stepfunService.generateResponse(message.text, {
        sessionId: clientId,
        userId: session.userId
      });

      // 更新状态为说话中
      session.status = 'speaking';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'speaking'
      });

      // 使用ElevenLabs合成语音
      let audioUrl = null;
      let duration = 3000;
      
      try {
        const speechResponse = await this.elevenLabsService.synthesizeSpeech(aiResponse.response);
        audioUrl = speechResponse.audio_url;
        duration = speechResponse.duration_ms || 3000;
      } catch (speechError) {
        logger.warn('语音合成失败，仅返回文本', speechError as Error);
      }

      // 发送AI回应
      this.sendMessage(clientId, {
        type: 'agent_response',
        text: aiResponse.response,
        audioUrl,
        duration
      });

      // 更新状态为已连接
      session.status = 'connected';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'connected'
      });

      logger.info('文本消息处理完成', {
        clientId,
        inputLength: message.text.length,
        responseLength: aiResponse.response.length,
        hasAudio: !!audioUrl
      });
    } catch (error) {
      logger.error('文本消息处理失败', error as Error, { clientId });
      this.sendError(clientId, '文本处理失败，请稍后重试');
      session.status = 'connected';
    }
  }

  private async handleStartVoiceRecording(clientId: string, message: TENMessage): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session) return;

    session.status = 'listening';
    this.sendMessage(clientId, {
      type: 'agent_status',
      status: 'listening'
    });

    logger.debug('开始语音录制', { clientId });
  }

  private async handleStopVoiceRecording(clientId: string, message: TENMessage): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session) return;

    try {
      // 更新状态为处理中
      session.status = 'processing';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'processing'
      });

      // 模拟语音转文本（在实际环境中应该集成真实的STT服务）
      const voiceText = '用户通过语音询问了一个问题';
      
      // 使用Stepfun生成回应
      const aiResponse = await this.stepfunService.generateResponse(voiceText, {
        sessionId: clientId,
        userId: session.userId,
        isVoiceInput: true
      });

      // 更新状态为说话中
      session.status = 'speaking';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'speaking'
      });

      // 使用ElevenLabs合成语音
      let audioUrl = null;
      let duration = 3000;
      
      try {
        const speechResponse = await this.elevenLabsService.synthesizeSpeech(aiResponse.response);
        audioUrl = speechResponse.audio_url;
        duration = speechResponse.duration_ms || 3000;
      } catch (speechError) {
        logger.warn('语音合成失败', speechError as Error);
      }

      // 发送AI回应
      this.sendMessage(clientId, {
        type: 'agent_response',
        text: aiResponse.response,
        audioUrl,
        duration
      });

      // 更新状态为已连接
      session.status = 'connected';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'connected'
      });

      logger.info('语音消息处理完成', {
        clientId,
        responseLength: aiResponse.response.length,
        hasAudio: !!audioUrl
      });
    } catch (error) {
      logger.error('语音消息处理失败', error as Error, { clientId });
      this.sendError(clientId, '语音处理失败，请稍后重试');
      session.status = 'connected';
    }
  }

  private async handleImageUpload(clientId: string, message: TENMessage): Promise<void> {
    const session = this.clients.get(clientId);
    if (!session || !message.imageData) return;

    try {
      // 更新状态为处理中
      session.status = 'processing';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'processing'
      });

      // 模拟图像分析（在实际环境中应该集成真实的视觉理解服务）
      const imageAnalysis = '用户分享了一张图片，显示了一些有趣的内容';
      
      // 使用Stepfun生成回应
      const aiResponse = await this.stepfunService.generateResponse(
        `用户上传了一张图片：${imageAnalysis}`,
        {
          sessionId: clientId,
          userId: session.userId,
          isImageInput: true
        }
      );

      // 发送AI回应
      this.sendMessage(clientId, {
        type: 'agent_response',
        text: aiResponse.response,
        audioUrl: null,
        duration: 3000
      });

      // 更新状态为已连接
      session.status = 'connected';
      this.sendMessage(clientId, {
        type: 'agent_status',
        status: 'connected'
      });

      logger.info('图片上传处理完成', {
        clientId,
        fileName: message.fileName,
        responseLength: aiResponse.response.length
      });
    } catch (error) {
      logger.error('图片处理失败', error as Error, { clientId });
      this.sendError(clientId, '图片处理失败，请稍后重试');
      session.status = 'connected';
    }
  }

  private sendMessage(clientId: string, message: any): void {
    const session = this.clients.get(clientId);
    if (!session || session.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      session.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error('发送WebSocket消息失败', error as Error, {
        clientId
      });
    }
  }

  private sendError(clientId: string, errorMessage: string): void {
    this.sendMessage(clientId, {
      type: 'error',
      error: errorMessage
    });
  }

  private cleanupInactiveClients(): void {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5分钟

    for (const [clientId, session] of this.clients.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
        logger.info('清理不活跃的客户端连接', {
          clientId,
          lastActivity: session.lastActivity
        });
        
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.close();
        }
        
        this.clients.delete(clientId);
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getStats(): any {
    return {
      service: 'WebSocket Server',
      activeClients: this.clients.size,
      clients: Array.from(this.clients.values()).map(session => ({
        sessionId: session.sessionId,
        userId: session.userId,
        status: session.status,
        lastActivity: session.lastActivity
      }))
    };
  }

  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    logger.info('WebSocket服务器已关闭');
  }
}

export default WebSocketServerService;
export { WebSocketServerService };
