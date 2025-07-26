// WebSocket 服务 - 用于与TEN Framework通信

import { TEN_FRAMEWORK_CONFIG } from '../utils/constants';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
  sessionId?: string;
}

interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onAgentStatus?: (status: string) => void;
  onTextResponse?: (text: string) => void;
  onAudioControl?: (action: string, audioUrl?: string) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private callbacks: WebSocketCallbacks = {};
  private sessionId: string | null = null;

  constructor() {
    this.setupHeartbeat();
  }

  // 设置回调函数
  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // 连接WebSocket
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        const wsUrl = `${TEN_FRAMEWORK_CONFIG.WS_URL}/conversation/${sessionId}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket连接成功');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.callbacks.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason);
          this.isConnected = false;
          this.callbacks.onDisconnect?.();
          
          // 自动重连
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.callbacks.onError?.(error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage) {
    console.log('收到WebSocket消息:', message);
    
    this.callbacks.onMessage?.(message);

    // 根据消息类型进行特定处理
    switch (message.type) {
      case 'agent_status':
        this.callbacks.onAgentStatus?.(message.data.status);
        break;
      
      case 'text_response':
        this.callbacks.onTextResponse?.(message.data.text);
        break;
      
      case 'audio_control':
        this.callbacks.onAudioControl?.(message.data.action, message.data.audioUrl);
        break;
      
      case 'error':
        console.error('TEN Framework错误:', message.data);
        break;
      
      default:
        console.log('未知消息类型:', message.type);
    }
  }

  // 发送消息
  sendMessage(type: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket未连接'));
        return;
      }

      try {
        const message: WebSocketMessage = {
          type,
          data,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId || undefined,
        };

        this.ws.send(JSON.stringify(message));
        console.log('发送WebSocket消息:', message);
        resolve();
      } catch (error) {
        console.error('发送消息失败:', error);
        reject(error);
      }
    });
  }

  // 发送文本消息
  async sendTextMessage(text: string): Promise<void> {
    await this.sendMessage('text_message', { text });
  }

  // 发送音频数据
  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
    // 将ArrayBuffer转换为Base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioData))
    );
    
    await this.sendMessage('audio_chunk', {
      audio: base64Audio,
      format: 'wav',
      sampleRate: 16000,
    });
  }

  // 发送图像数据
  async sendImageData(imageUrl: string): Promise<void> {
    await this.sendMessage('image_upload', { imageUrl });
  }

  // 开始会话
  async startSession(userId: string): Promise<void> {
    await this.sendMessage('start_session', { userId });
  }

  // 结束会话
  async endSession(): Promise<void> {
    await this.sendMessage('end_session', {});
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close(1000, '客户端主动断开');
      this.ws = null;
    }
  }

  // 自动重连
  private scheduleReconnect() {
    this.reconnectAttempts++;
    console.log(`${this.reconnectInterval / 1000}秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId).catch(console.error);
      }
    }, this.reconnectInterval);
  }

  // 心跳检测
  private setupHeartbeat() {
    setInterval(() => {
      if (this.isConnected && this.ws) {
        this.sendMessage('ping', {}).catch(() => {
          // 心跳失败，触发重连
          console.log('心跳失败，触发重连');
          this.disconnect();
        });
      }
    }, 30000); // 30秒心跳
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
    };
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService();
