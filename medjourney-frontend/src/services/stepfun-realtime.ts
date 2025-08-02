import { EventEmitter } from 'events';

export interface StepfunMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'audio';
  audioData?: string; // Base64 encoded audio
  transcript?: string;
}

export interface StepfunRealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
}

export class StepfunRealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: StepfunRealtimeConfig;
  private isConnected = false;
  private sessionId: string | null = null;
  private messageIdCounter = 0;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  constructor(config: StepfunRealtimeConfig) {
    super();
    this.config = {
      model: 'step-1o-audio',
      voice: 'linjiajiejie',
      instructions: '你是由阶跃星辰提供的AI聊天助手，你擅长中文，英文，以及多种其他语言的对话。请用温暖、关怀的语气与用户交流。',
      ...config
    };
  }

  // 连接 WebSocket
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://api.stepfun.com/v1/realtime');
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('Stepfun Realtime WebSocket 错误:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // 发送消息到 WebSocket
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket 未连接');
    }
  }

  // 处理接收到的消息
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'session.created':
          this.sessionId = message.session?.id;
          this.emit('sessionCreated', message.session);
          break;

        case 'session.updated':
          this.emit('sessionUpdated', message.session);
          break;

        case 'conversation.item.created':
          this.emit('messageCreated', message.item);
          break;

        case 'response.output_item.added':
          this.emit('responseStarted', message.item);
          break;

        case 'response.content_part.added':
          this.emit('contentPartAdded', message);
          break;

        case 'response.content_part.done':
          this.emit('contentPartDone', message);
          break;

        case 'response.output_item.done':
          this.emit('responseDone', message.item);
          break;

        case 'response.audio.delta':
          this.emit('audioDelta', message);
          break;

        case 'response.audio.done':
          this.emit('audioDone', message);
          break;

        case 'response.audio_transcript.delta':
          this.emit('transcriptDelta', message);
          break;

        case 'response.audio_transcript.done':
          this.emit('transcriptDone', message);
          break;

        case 'input_audio_buffer.speech_started':
          this.emit('speechStarted', message);
          break;

        case 'input_audio_buffer.speech_stopped':
          this.emit('speechStopped', message);
          break;

        case 'error':
          console.error('Stepfun API 错误:', message.error);
          this.emit('error', message.error);
          break;

        default:
      }
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  }

  // 初始化会话
  async initializeSession(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    // 发送 session.update 事件
    const sessionMessage = {
      event_id: `event_${Date.now()}`,
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad'
        }
      }
    };

    this.sendMessage(sessionMessage);
  }

  // 发送文本消息
  async sendTextMessage(text: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('WebSocket 未连接');
    }

    const messageId = `msg_${Date.now()}_${++this.messageIdCounter}`;
    
    // 创建用户消息
    const createMessage = {
      event_id: `event_${Date.now()}`,
      type: 'conversation.item.create',
      item: {
        id: messageId,
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    this.sendMessage(createMessage);

    // 创建响应
    const responseMessage = {
      event_id: `event_${Date.now()}`,
      type: 'response.create'
    };

    this.sendMessage(responseMessage);

    return messageId;
  }

  // 开始录音
  async startVoiceRecording(): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAudioRecording();
      };

      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.emit('recordingStarted');
    } catch (error) {
      console.error('开始录音失败:', error);
      throw error;
    }
  }

  // 停止录音
  async stopVoiceRecording(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.emit('recordingStopped');
    }
  }

  // 处理录音数据
  private async processAudioRecording(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // 转换为 PCM16 格式
      const pcmData = await this.convertToPCM16(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData)));

      // 发送音频数据
      await this.sendAudioMessage(base64Audio);
    } catch (error) {
      console.error('处理录音数据失败:', error);
    }
  }

  // 发送音频消息
  private async sendAudioMessage(audioData: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('WebSocket 未连接');
    }

    const messageId = `msg_${Date.now()}_${++this.messageIdCounter}`;

    // 追加音频数据
    const appendAudioMessage = {
      event_id: `event_${Date.now()}`,
      type: 'input_audio_buffer.append',
      audio: audioData
    };

    this.sendMessage(appendAudioMessage);

    // 提交音频缓冲区
    const commitAudioMessage = {
      event_id: `event_${Date.now()}`,
      type: 'input_audio_buffer.commit'
    };

    this.sendMessage(commitAudioMessage);

    return messageId;
  }

  // 转换音频格式为 PCM16
  private async convertToPCM16(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    // 这里需要实现音频格式转换
    // 简化实现，实际项目中可能需要使用 Web Audio API 进行更复杂的转换
    return arrayBuffer;
  }

  // 播放音频
  async playAudio(audioData: string): Promise<void> {
    try {
      const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      await audio.play();
      
      // 清理 URL
      setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  }

  // 获取连接状态
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 获取录音状态
  getRecordingStatus(): boolean {
    return this.isRecording;
  }
}

// 创建单例实例
let stepfunService: StepfunRealtimeService | null = null;

export const createStepfunService = (config: StepfunRealtimeConfig): StepfunRealtimeService => {
  if (!stepfunService) {
    stepfunService = new StepfunRealtimeService(config);
  }
  return stepfunService;
};

export const getStepfunService = (): StepfunRealtimeService | null => {
  return stepfunService;
}; 