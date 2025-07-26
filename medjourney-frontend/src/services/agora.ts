import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';
import { AGORA_APP_ID } from '../utils/constants';

export interface AudioData {
  data: ArrayBuffer;
  url: string;
  duration: number;
}

export class AgoraService {
  private client: IAgoraRTCClient;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTracks: Map<UID, IRemoteAudioTrack> = new Map();
  private isConnected = false;
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private currentChannelName = '';
  private currentToken = '';
  private currentUid: UID | null = null;

  constructor() {
    // 创建Agora客户端
    this.client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'opus' // 使用Opus编解码器，适合语音通信
    });

    // 设置事件监听器
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听远端用户发布音频事件
    this.client.on('user-published', async (user, mediaType) => {
      console.log('远端用户发布媒体:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        try {
          // 订阅远端音频轨道
          await this.client.subscribe(user, mediaType);
          const remoteAudioTrack = user.audioTrack;
          
          if (remoteAudioTrack) {
            // 保存远端音频轨道引用
            this.remoteAudioTracks.set(user.uid, remoteAudioTrack);
            
            // 播放远端音频
            remoteAudioTrack.play();
            console.log('开始播放远端音频:', user.uid);
          }
        } catch (error) {
          console.error('订阅远端音频失败:', error);
        }
      }
    });

    // 监听远端用户取消发布事件
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('远端用户取消发布媒体:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        const remoteAudioTrack = this.remoteAudioTracks.get(user.uid);
        if (remoteAudioTrack) {
          remoteAudioTrack.stop();
          this.remoteAudioTracks.delete(user.uid);
        }
      }
    });

    // 监听用户离开事件
    this.client.on('user-left', (user) => {
      console.log('用户离开频道:', user.uid);
      const remoteAudioTrack = this.remoteAudioTracks.get(user.uid);
      if (remoteAudioTrack) {
        remoteAudioTrack.stop();
        this.remoteAudioTracks.delete(user.uid);
      }
    });

    // 监听连接状态变化
    this.client.on('connection-state-change', (curState, revState) => {
      console.log('连接状态变化:', revState, '->', curState);
      this.isConnected = curState === 'CONNECTED';
    });

    // 监听异常事件
    this.client.on('exception', (event) => {
      console.error('Agora异常事件:', event);
    });
  }

  // 初始化服务
  async initialize(): Promise<void> {
    try {
      console.log('初始化Agora服务...');
      
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      console.log('Agora服务初始化完成');
    } catch (error) {
      console.error('初始化Agora服务失败:', error);
      throw error;
    }
  }

  // 加入频道
  async joinChannel(channelName: string, token?: string, uid?: UID): Promise<UID> {
    try {
      console.log('加入Agora频道:', channelName);
      
      this.currentChannelName = channelName;
      this.currentToken = token || '';
      
      // 加入频道
      const assignedUid = await this.client.join(
        AGORA_APP_ID,
        channelName,
        token || null,
        uid || null
      );
      
      this.currentUid = assignedUid;
      this.isConnected = true;
      
      console.log('成功加入频道，UID:', assignedUid);
      return assignedUid;
    } catch (error) {
      console.error('加入频道失败:', error);
      throw error;
    }
  }

  // 离开频道
  async leaveChannel(): Promise<void> {
    try {
      console.log('离开Agora频道');
      
      // 停止录音
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      // 取消发布本地音频轨道
      if (this.localAudioTrack) {
        await this.client.unpublish([this.localAudioTrack]);
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      
      // 停止所有远端音频轨道
      this.remoteAudioTracks.forEach((track) => {
        track.stop();
      });
      this.remoteAudioTracks.clear();
      
      // 离开频道
      await this.client.leave();
      this.isConnected = false;
      
      console.log('成功离开频道');
    } catch (error) {
      console.error('离开频道失败:', error);
      throw error;
    }
  }

  // 开始录音
  async startRecording(): Promise<void> {
    try {
      console.log('开始录音...');
      
      if (this.isRecording) {
        console.warn('已经在录音中');
        return;
      }
      
      // 创建本地音频轨道
      if (!this.localAudioTrack) {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: {
            sampleRate: 48000,
            stereo: false,
            bitrate: 128
          },
          ANS: true, // 噪声抑制
          AEC: true, // 回声消除
          AGC: true  // 自动增益控制
        });
      }
      
      // 发布本地音频轨道到频道
      if (this.isConnected) {
        await this.client.publish([this.localAudioTrack]);
      }
      
      // 开始MediaRecorder录音
      const mediaStreamTrack = this.localAudioTrack.getMediaStreamTrack();
      const mediaStream = new MediaStream([mediaStreamTrack]);
      
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.isRecording = true;
      
      console.log('录音开始');
    } catch (error) {
      console.error('开始录音失败:', error);
      throw error;
    }
  }

  // 停止录音
  async stopRecording(): Promise<AudioData> {
    return new Promise((resolve, reject) => {
      try {
        console.log('停止录音...');
        
        if (!this.isRecording || !this.mediaRecorder) {
          console.warn('当前没有在录音');
          reject(new Error('当前没有在录音'));
          return;
        }
        
        this.mediaRecorder.onstop = async () => {
          try {
            // 合并录音数据
            const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm;codecs=opus' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audioData: AudioData = {
              data: arrayBuffer,
              url: audioUrl,
              duration: this.recordedChunks.length * 0.1 // 估算时长（秒）
            };
            
            this.isRecording = false;
            console.log('录音完成，时长:', audioData.duration, '秒');
            
            resolve(audioData);
          } catch (error) {
            console.error('处理录音数据失败:', error);
            reject(error);
          }
        };
        
        this.mediaRecorder.stop();
      } catch (error) {
        console.error('停止录音失败:', error);
        reject(error);
      }
    });
  }

  // 播放音频
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('播放音频:', audioUrl);
        
        const audio = new Audio(audioUrl);
        
        audio.onloadeddata = () => {
          console.log('音频加载完成');
        };
        
        audio.onended = () => {
          console.log('音频播放结束');
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('音频播放错误:', error);
          reject(error);
        };
        
        // 设置音量
        audio.volume = 0.8;
        
        // 开始播放
        audio.play().catch((error) => {
          console.error('开始播放音频失败:', error);
          reject(error);
        });
      } catch (error) {
        console.error('播放音频失败:', error);
        reject(error);
      }
    });
  }

  // 停止音频播放
  stopAudio(): void {
    try {
      // 停止所有远端音频轨道
      this.remoteAudioTracks.forEach((track) => {
        track.stop();
      });
      
      console.log('停止音频播放');
    } catch (error) {
      console.error('停止音频播放失败:', error);
    }
  }

  // 设置音频音量
  setVolume(volume: number): void {
    try {
      // 设置远端音频音量
      this.remoteAudioTracks.forEach((track) => {
        track.setVolume(Math.max(0, Math.min(100, volume)));
      });
      
      console.log('设置音量:', volume);
    } catch (error) {
      console.error('设置音量失败:', error);
    }
  }

  // 静音/取消静音
  async toggleMute(): Promise<boolean> {
    try {
      if (this.localAudioTrack) {
        const isMuted = this.localAudioTrack.muted;
        await this.localAudioTrack.setMuted(!isMuted);
        console.log('麦克风', isMuted ? '取消静音' : '静音');
        return !isMuted;
      }
      return false;
    } catch (error) {
      console.error('切换静音状态失败:', error);
      throw error;
    }
  }

  // 获取连接状态
  getConnectionState(): boolean {
    return this.isConnected;
  }

  // 获取录音状态
  getRecordingState(): boolean {
    return this.isRecording;
  }

  // 获取音频设备列表
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await AgoraRTC.getDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('获取音频设备失败:', error);
      throw error;
    }
  }

  // 切换音频设备
  async switchAudioDevice(deviceId: string): Promise<void> {
    try {
      if (this.localAudioTrack) {
        await this.localAudioTrack.setDevice(deviceId);
        console.log('切换音频设备:', deviceId);
      }
    } catch (error) {
      console.error('切换音频设备失败:', error);
      throw error;
    }
  }

  // 清理资源
  async cleanup(): Promise<void> {
    try {
      console.log('清理Agora资源...');
      
      if (this.isConnected) {
        await this.leaveChannel();
      }
      
      // 关闭音频上下文
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }
      
      console.log('Agora资源清理完成');
    } catch (error) {
      console.error('清理Agora资源失败:', error);
    }
  }
}

export default AgoraService;