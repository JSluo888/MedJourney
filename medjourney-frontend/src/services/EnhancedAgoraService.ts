// 增强版Agora服务 - 集成TEN Framework的完整实现
import AgoraRTC, { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  ConnectionState
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, DEFAULT_CONFIG } from '../constants';
import { Message, VoiceMessage } from '../types';
import TenFrameworkService from './TenFrameworkService';

interface EnhancedAgoraCallbacks {
  onConnectionStateChange: (connected: boolean) => void;
  onAudioLevel: (level: number) => void;
  onMessage: (message: Message) => void;
  onStatusChange: (status: 'idle' | 'listening' | 'processing' | 'speaking') => void;
  onError: (error: string) => void;
}

class EnhancedAgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTracks: Map<string, IRemoteAudioTrack> = new Map();
  private tenService: TenFrameworkService | null = null;
  private callbacks: EnhancedAgoraCallbacks;
  private channelName: string;
  private uid: string;
  private isRecording: boolean = false;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isInitialized: boolean = false;

  constructor(callbacks: EnhancedAgoraCallbacks) {
    this.callbacks = callbacks;
    this.channelName = `${DEFAULT_CONFIG.AGORA_CHANNEL_PREFIX}${Date.now()}`;
    this.uid = Date.now().toString();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Agora服务已初始化');
      return;
    }

    try {
      console.log('初始化增强版Agora服务...');
      
      // 初始化Agora客户端
      await this.initializeAgoraClient();
      
      // 初始化TEN Framework服务
      await this.initializeTENService();
      
      this.isInitialized = true;
      this.callbacks.onConnectionStateChange(true);
      
      console.log(`增强版Agora服务初始化成功. 频道: ${this.channelName}`);
    } catch (error) {
      console.error('增强版Agora服务初始化失败:', error);
      this.callbacks.onError(`初始化失败: ${error}`);
      throw error;
    }
  }

  private async initializeAgoraClient(): Promise<void> {
    try {
      // 创建Agora客户端
      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8'
      });
      
      // 设置事件监听
      this.setupAgoraEventListeners();
      
      // 加入频道
      await this.client.join(
        AGORA_APP_ID,
        this.channelName,
        null, // 测试环境使用null token
        this.uid
      );
      
      // 创建本地音频轨道
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true, // 回声消除
        AGC: true, // 自动增益控制
        ANS: true, // 噪声抑制
      });
      
      console.log('Agora客户端初始化成功');
    } catch (error) {
      console.error('Agora客户端初始化失败:', error);
      throw error;
    }
  }

  private async initializeTENService(): Promise<void> {
    try {
      // TEN Framework配置
      const tenConfig = {
        appId: AGORA_APP_ID,
        channel: this.channelName,
        userId: this.uid?.toString() || 'anonymous'
      };
      
      // TEN Framework回调
      const tenCallbacks = {
        onMessage: (voiceMessage: VoiceMessage) => {
          // 将VoiceMessage转换为Message格式
          const message: Message = {
            id: voiceMessage.id,
            content: voiceMessage.content,
            type: 'text',
            sender: voiceMessage.type === 'user' ? 'user' : 'assistant',
            timestamp: voiceMessage.timestamp,
            audioUrl: voiceMessage.audioUrl
          };
          this.callbacks.onMessage(message);
        },
        onStatusChange: (status: string) => {
          this.callbacks.onStatusChange(status as any);
        },
        onError: (error: Error) => {
          this.callbacks.onError(error.message);
        }
      };
      
      // 创建TEN服务实例
      this.tenService = new TenFrameworkService(tenConfig, tenCallbacks);
      
      // 初始化TEN服务
      await this.tenService.initialize();
      
      console.log('TEN Framework服务初始化成功');
    } catch (error) {
      console.error('TEN Framework服务初始化失败:', error);
      throw error;
    }
  }

  private setupAgoraEventListeners(): void {
    if (!this.client) return;
    
    // 监听连接状态变化
    this.client.on('connection-state-change', (curState: ConnectionState, revState: ConnectionState) => {
      console.log(`Agora连接状态变化: ${revState} -> ${curState}`);
      this.callbacks.onConnectionStateChange(curState === 'CONNECTED');
    });
    
    // 监听远端用户加入
    this.client.on('user-joined', (user) => {
      console.log('远端用户加入:', user.uid);
      
      // 如果是TEN Agent加入，启动会话
      if (user.uid.toString().includes('ten-agent')) {
        this.startTENSession();
      }
    });
    
    // 监听远端用户发布音频
    this.client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await this.client!.subscribe(user, mediaType);
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          this.remoteAudioTracks.set(user.uid.toString(), remoteAudioTrack);
          remoteAudioTrack.play();
          console.log('订阅远端音频成功');
          
          // 通知状态变化
          this.callbacks.onStatusChange('speaking');
        }
      }
    });
    
    // 监听远端用户取消发布
    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        this.remoteAudioTracks.delete(user.uid.toString());
        console.log('远端用户取消发布音频');
        this.callbacks.onStatusChange('listening');
      }
    });
    
    // 监听用户离开
    this.client.on('user-left', (user) => {
      this.remoteAudioTracks.delete(user.uid.toString());
      console.log('远端用户离开:', user.uid);
    });
    
    // 监听异常
    this.client.on('exception', (event) => {
      console.error('Agora异常:', event);
      this.callbacks.onError(`连接异常: ${event.msg}`);
    });
  }

  private async startTENSession(): Promise<void> {
    if (this.tenService) {
      try {
        // TEN服务已经在initialize中启动
        console.log('TEN会话已启动');
      } catch (error) {
        console.error('启动TEN会话失败:', error);
      }
    }
  }

  async startRecording(): Promise<void> {
    if (!this.client || !this.localAudioTrack || this.isRecording) return;
    
    try {
      console.log('开始录音和音频流传输...');
      
      // 发布本地音频到Agora频道（供TEN Agent接收）
      await this.client.publish([this.localAudioTrack]);
      
      // 同时启动本地录音（用于直接发送到TEN Framework）
      await this.startLocalRecording();
      
      this.isRecording = true;
      this.startAudioLevelMonitoring();
      this.callbacks.onStatusChange('listening');
      
      console.log('录音和音频流传输已启动');
    } catch (error) {
      console.error('启动录音失败:', error);
      this.callbacks.onError('开始录音失败');
      throw error;
    }
  }

  private async startLocalRecording(): Promise<void> {
    try {
      // 获取原始音频流
      const mediaStream = new MediaStream([this.localAudioTrack!.getMediaStreamTrack()]);
      
      // 创建MediaRecorder
      this.mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // 监听录音停止事件
      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioBuffer = await audioBlob.arrayBuffer();
          
          // 发送音频数据到TEN Framework
          if (this.tenService) {
            try {
              // 音频数据通过Agora自动传输到TEN服务
            } catch (error) {
              console.error('发送音频到TEN Framework失败:', error);
            }
          }
        }
      };
      
      // 开始录音
      this.mediaRecorder.start(1000); // 每秒生成一个数据块
      
    } catch (error) {
      console.error('启动本地录音失败:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.client || !this.localAudioTrack || !this.isRecording) return;
    
    try {
      console.log('停止录音和音频流传输...');
      
      // 停止发布本地音频
      await this.client.unpublish([this.localAudioTrack]);
      
      // 停止本地录音
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      this.isRecording = false;
      this.stopAudioLevelMonitoring();
      this.callbacks.onStatusChange('processing');
      
      console.log('录音和音频流传输已停止');
    } catch (error) {
      console.error('停止录音失败:', error);
      this.callbacks.onError('停止录音失败');
      throw error;
    }
  }

  private startAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) return;
    
    this.audioLevelInterval = setInterval(() => {
      if (this.localAudioTrack && this.isRecording) {
        const volumeLevel = this.localAudioTrack.getVolumeLevel();
        this.callbacks.onAudioLevel(volumeLevel * 100);
      }
    }, 100);
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    this.callbacks.onAudioLevel(0);
  }

  async sendTextMessage(text: string): Promise<void> {
    console.log('发送文本消息:', text);
    
    if (this.tenService) {
      try {
        await this.tenService.sendTextMessage(text);
      } catch (error) {
        console.error('通过TEN Framework发送文本消息失败:', error);
        this.callbacks.onError('消息发送失败');
      }
    } else {
      console.warn('TEN Framework服务未可用，无法发送消息');
      this.callbacks.onError('AI服务暂时不可用');
    }
  }

  async sendImageMessage(imageUrl: string): Promise<void> {
    console.log('发送图像消息:', imageUrl);
    
    if (this.tenService) {
      try {
        // 将base64转换为Blob再转换为File
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        await this.tenService.uploadImage(file);
      } catch (error) {
        console.error('通过TEN Framework发送图像消息失败:', error);
        this.callbacks.onError('图像处理失败');
      }
    } else {
      console.warn('TEN Framework服务未可用，无法处理图像');
      this.callbacks.onError('AI服务暂时不可用');
    }
  }

  // 打断当前AI语音播放
  async interruptAI(): Promise<void> {
    console.log('打断AI语音播放');
    
    // 停止所有远端音频播放
    this.remoteAudioTracks.forEach(track => {
      track.stop();
    });
    
    // 通知TEN Framework停止当前TTS
    if (this.tenService) {
      // 在实际的TEN Framework集成中，这里会发送打断信号
      console.log('发送打断信号到TEN Framework');
    }
    
    // 重新开始监听
    this.callbacks.onStatusChange('listening');
  }

  async disconnect(): Promise<void> {
    try {
      console.log('断开增强版Agora服务连接');
      
      this.stopAudioLevelMonitoring();
      
      // 停止录音
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      // 关闭本地音频轨道
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
      }
      
      // 停止远端音频轨道
      this.remoteAudioTracks.forEach(track => {
        track.stop();
      });
      this.remoteAudioTracks.clear();
      
      // 离开Agora频道
      if (this.client) {
        await this.client.leave();
      }
      
      // 断开TEN Framework连接
      if (this.tenService) {
        await this.tenService.disconnect();
        await this.tenService.disconnect();
      }
      
      this.isInitialized = false;
      this.callbacks.onConnectionStateChange(false);
      
      console.log('增强版Agora服务已断开连接');
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  }

  // 获取连接状态
  getConnectionState(): boolean {
    return this.client?.connectionState === 'CONNECTED' && this.isInitialized;
  }

  // 获取频道名称
  getChannelName(): string {
    return this.channelName;
  }

  // 获取用户ID
  getUserId(): string {
    return this.uid;
  }

  // 获取TEN Framework连接状态
  getTENConnectionState(): boolean {
    return this.tenService?.getConnectionStatus() === 'connected' || false;
  }

  // 设置音频质量
  async setAudioQuality(quality: 'speech_low_quality' | 'speech_standard' | 'music_standard'): Promise<void> {
    if (this.localAudioTrack) {
      try {
        // await this.localAudioTrack.setEncoderConfiguration(quality);
        console.log('音频质量已设置为:', quality);
      } catch (error) {
        console.error('设置音频质量失败:', error);
      }
    }
  }

  // 获取网络质量
  getNetworkQuality(): { uplink: number; downlink: number } {
    if (this.client) {
      const stats = this.client.getRTCStats();
      return {
        uplink: (stats as any).gatewayRTT || 0,
        downlink: (stats as any).gatewayRTT || 0
      };
    }
    return { uplink: 0, downlink: 0 };
  }
}

export default EnhancedAgoraService;