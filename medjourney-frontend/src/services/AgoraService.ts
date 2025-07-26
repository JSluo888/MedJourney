import AgoraRTC, { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  ConnectionState
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID, DEFAULT_CONFIG } from '../constants';
import { Message } from '../types';

interface AgoraServiceCallbacks {
  onConnectionStateChange: (connected: boolean) => void;
  onAudioLevel: (level: number) => void;
  onMessage: (message: Message) => void;
  onError: (error: string) => void;
}

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTracks: Map<string, IRemoteAudioTrack> = new Map();
  private callbacks: AgoraServiceCallbacks;
  private channelName: string;
  private uid: string;
  private isRecording: boolean = false;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  
  constructor(callbacks: AgoraServiceCallbacks) {
    this.callbacks = callbacks;
    this.channelName = `${DEFAULT_CONFIG.AGORA_CHANNEL_PREFIX}${Date.now()}`;
    this.uid = Date.now().toString();
  }
  
  async initialize(): Promise<void> {
    try {
      // 创建Agora客户端
      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' // 视频编解码器，虽然我们主要使用音频
      });
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 加入频道
      await this.client.join(
        AGORA_APP_ID,
        this.channelName,
        null, // 使用测试token，生产环境需要从服务器获取
        this.uid
      );
      
      // 创建本地音频轨道
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard', // 优化语音编码
        AEC: true, // 回声消除
        AGC: true, // 自动增益控制
        ANS: true, // 噪声抑制
      });
      
      this.callbacks.onConnectionStateChange(true);
      
      console.log(`Agora initialized successfully. Channel: ${this.channelName}`);
    } catch (error) {
      console.error('Agora initialization failed:', error);
      this.callbacks.onError(`初始化失败: ${error}`);
      throw error;
    }
  }
  
  private setupEventListeners(): void {
    if (!this.client) return;
    
    // 监听连接状态变化
    this.client.on('connection-state-change', (curState: ConnectionState, revState: ConnectionState) => {
      console.log(`Connection state changed from ${revState} to ${curState}`);
      this.callbacks.onConnectionStateChange(curState === 'CONNECTED');
    });
    
    // 监听远端用户加入
    this.client.on('user-joined', (user) => {
      console.log('Remote user joined:', user.uid);
    });
    
    // 监听远端用户发布音频
    this.client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await this.client!.subscribe(user, mediaType);
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          this.remoteAudioTracks.set(user.uid.toString(), remoteAudioTrack);
          remoteAudioTrack.play();
          console.log('Subscribed to remote audio track');
          
          // 模拟AI席复消息
          this.simulateAIResponse();
        }
      }
    });
    
    // 监听远端用户取消发布
    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        this.remoteAudioTracks.delete(user.uid.toString());
        console.log('Remote user unpublished audio');
      }
    });
    
    // 监听用户离开
    this.client.on('user-left', (user) => {
      this.remoteAudioTracks.delete(user.uid.toString());
      console.log('Remote user left:', user.uid);
    });
    
    // 监听错误
    this.client.on('exception', (event) => {
      console.error('Agora exception:', event);
      this.callbacks.onError(`连接异常: ${event.msg}`);
    });
  }
  
  async startRecording(): Promise<void> {
    if (!this.client || !this.localAudioTrack || this.isRecording) return;
    
    try {
      // 发布本地音频轨道
      await this.client.publish([this.localAudioTrack]);
      this.isRecording = true;
      
      // 开始音频级别监测
      this.startAudioLevelMonitoring();
      
      console.log('Started recording and publishing audio');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.callbacks.onError('开始录音失败');
      throw error;
    }
  }
  
  async stopRecording(): Promise<void> {
    if (!this.client || !this.localAudioTrack || !this.isRecording) return;
    
    try {
      // 取消发布本地音频轨道
      await this.client.unpublish([this.localAudioTrack]);
      this.isRecording = false;
      
      // 停止音频级别监测
      this.stopAudioLevelMonitoring();
      
      console.log('Stopped recording and unpublished audio');
    } catch (error) {
      console.error('Failed to stop recording:', error);
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
    }, 100); // 每100ms更新一次
  }
  
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    this.callbacks.onAudioLevel(0);
  }
  
  async sendTextMessage(text: string): Promise<void> {
    // 这里将来会集成TEN Framework来处理文本消息
    console.log('Sending text message to TEN Agent:', text);
    
    // 模拟AI处理延迟
    setTimeout(() => {
      this.simulateAIResponse(text);
    }, 1000);
  }
  
  async sendImageMessage(imageUrl: string): Promise<void> {
    // 这里将来会集成TEN Framework来处理图片消息
    console.log('Sending image message to TEN Agent:', imageUrl);
    
    // 模拟AI处理延迟
    setTimeout(() => {
      this.simulateAIResponse('我看到了您分享的图片，非常有趣！请告诉我更多关于这张图片的信息。');
    }, 1500);
  }
  
  private simulateAIResponse(userMessage?: string): void {
    // 这是一个模拟的AI应答，实际应用中会被TEN Framework替代
    const responses = [
      '谢谢您的分享，我在仔细倾听您的话。',
      '听起来很有趣，请继续讲讲您的想法。',
      '我理解您的感受，这是很正常的反应。',
      '您说得对，让我们一起探讨这个话题。',
      '这听起来很重要，您能说得更详细一些吗？'
    ];
    
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    if (userMessage) {
      if (userMessage.includes('你好') || userMessage.includes('您好')) {
        response = '您好！很高兴与您交流，有什么我可以帮助您的吗？';
      } else if (userMessage.includes('累') || userMessage.includes('不舒服')) {
        response = '听起来您今天有些不舒服，要不要休息一下？我在这里陪伴您。';
      } else if (userMessage.includes('记忆') || userMessage.includes('忘记')) {
        response = '记忆问题是很常见的，不用担心。我们可以通过一些简单的练习来改善。';
      }
    }
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: response,
      type: 'text',
      sender: 'assistant',
      timestamp: new Date()
    };
    
    // 模拟处理延迟
    setTimeout(() => {
      this.callbacks.onMessage(aiMessage);
    }, 500 + Math.random() * 1000);
  }
  
  async disconnect(): Promise<void> {
    try {
      this.stopAudioLevelMonitoring();
      
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
      }
      
      this.remoteAudioTracks.forEach(track => {
        track.stop();
      });
      this.remoteAudioTracks.clear();
      
      if (this.client) {
        await this.client.leave();
      }
      
      this.callbacks.onConnectionStateChange(false);
      console.log('Agora service disconnected');
    } catch (error) {
      console.error('Failed to disconnect Agora service:', error);
    }
  }
  
  // 获取连接状态
  getConnectionState(): boolean {
    return this.client?.connectionState === 'CONNECTED';
  }
  
  // 获取频道名称
  getChannelName(): string {
    return this.channelName;
  }
  
  // 获取用户ID
  getUserId(): string {
    return this.uid;
  }
}

export default AgoraService;