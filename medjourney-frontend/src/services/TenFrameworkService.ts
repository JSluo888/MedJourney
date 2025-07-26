import { TEN_CONFIG } from '../constants';

export interface TenFrameworkConfig {
  appId: string;
  token?: string;
  channel: string;
  userId: string;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
}

export interface TenFrameworkCallbacks {
  onMessage?: (message: VoiceMessage) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'listening' | 'speaking' | 'processing' | 'disconnected') => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

export class TenFrameworkService {
  private config: TenFrameworkConfig;
  private callbacks: TenFrameworkCallbacks;
  private websocket: WebSocket | null = null;
  private agoraClient: any = null;
  private localAudioTrack: any = null;
  private isListening = false;
  private isConnected = false;
  private currentStatus: string = 'disconnected';

  constructor(config: TenFrameworkConfig, callbacks: TenFrameworkCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async initialize(): Promise<void> {
    try {
      this.updateStatus('connecting');
      
      // 初始化WebSocket连接到TEN Agent
      await this.initializeWebSocket();
      
      // 初始化Agora客户端
      await this.initializeAgora();
      
      this.isConnected = true;
      this.updateStatus('connected');
      
    } catch (error) {
      console.error('TEN Framework initialization failed:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 在实际环境中，这将连接到部署的TEN Agent
        const wsUrl = TEN_CONFIG.WS_ENDPOINT || 'ws://localhost:8080/ws';
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('TEN Framework WebSocket connected');
          // 发送初始化消息
          this.sendWebSocketMessage({
            type: 'initialize',
            config: {
              userId: this.config.userId,
              channel: this.config.channel
            }
          });
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(JSON.parse(event.data));
        };
        
        this.websocket.onerror = (error) => {
          console.error('TEN Framework WebSocket error:', error);
          reject(error);
        };
        
        this.websocket.onclose = () => {
          console.log('TEN Framework WebSocket disconnected');
          this.isConnected = false;
          this.updateStatus('disconnected');
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private async initializeAgora(): Promise<void> {
    try {
      // 在实际环境中，这将使用真实的Agora SDK
      // 这里我们模拟Agora的初始化过程
      console.log('Initializing Agora with config:', {
        appId: this.config.appId,
        channel: this.config.channel
      });
      
      // 模拟成功初始化
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Agora initialized successfully');
    } catch (error) {
      console.error('Agora initialization failed:', error);
      throw error;
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'agent_status':
        this.updateStatus(message.status);
        break;
        
      case 'agent_response':
        const voiceMessage: VoiceMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: message.text,
          timestamp: new Date(),
          audioUrl: message.audioUrl,
          duration: message.duration
        };
        this.callbacks.onMessage?.(voiceMessage);
        break;
        
      case 'error':
        this.callbacks.onError?.(new Error(message.error));
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendWebSocketMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  private updateStatus(status: string): void {
    this.currentStatus = status;
    this.callbacks.onStatusChange?.(status as any);
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('TEN Framework not connected');
    }
    
    try {
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        timestamp: new Date()
      };
      
      // 通知UI显示用户消息
      this.callbacks.onMessage?.(userMessage);
      
      // 发送到TEN Agent
      this.sendWebSocketMessage({
        type: 'text_message',
        text: text,
        userId: this.config.userId
      });
      
      this.updateStatus('processing');
      
    } catch (error) {
      console.error('Failed to send text message:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  async startVoiceRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('TEN Framework not connected');
    }
    
    if (this.isListening) {
      return;
    }
    
    try {
      this.isListening = true;
      this.updateStatus('listening');
      
      // 在实际环境中，这将启动语音录制
      console.log('Starting voice recording...');
      
      // 模拟语音录制过程
      this.sendWebSocketMessage({
        type: 'start_voice_recording',
        userId: this.config.userId
      });
      
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      this.isListening = false;
      this.callbacks.onError?.(error as Error);
    }
  }

  async stopVoiceRecording(): Promise<void> {
    if (!this.isListening) {
      return;
    }
    
    try {
      this.isListening = false;
      this.updateStatus('processing');
      
      console.log('Stopping voice recording...');
      
      this.sendWebSocketMessage({
        type: 'stop_voice_recording',
        userId: this.config.userId
      });
      
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  async uploadImage(imageFile: File): Promise<string> {
    if (!this.isConnected) {
      throw new Error('TEN Framework not connected');
    }
    
    try {
      // 转换图片为base64
      const base64 = await this.fileToBase64(imageFile);
      
      this.sendWebSocketMessage({
        type: 'image_upload',
        imageData: base64,
        fileName: imageFile.name,
        userId: this.config.userId
      });
      
      this.updateStatus('processing');
      
      return 'Image uploaded successfully';
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // 移除data:image/...;base64,前缀
      };
      reader.onerror = error => reject(error);
    });
  }

  getConnectionStatus(): string {
    return this.currentStatus;
  }

  checkIsConnected(): boolean {
    return this.isConnected;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  async disconnect(): Promise<void> {
    try {
      this.isListening = false;
      this.isConnected = false;
      
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      
      if (this.agoraClient) {
        // 在实际环境中离开Agora频道
        this.agoraClient = null;
      }
      
      this.updateStatus('disconnected');
      
    } catch (error) {
      console.error('Disconnect failed:', error);
      this.callbacks.onError?.(error as Error);
    }
  }
}

export default TenFrameworkService;