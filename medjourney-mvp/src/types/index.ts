// 应用类型定义

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  medicalHistory?: string;
  avatar?: string;
}

// 消息类型
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'audio' | 'image';
  sender: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
  imageUrl?: string;
}

// 会话状态
export interface SessionState {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  error?: string;
}

// 健康评分
export interface HealthScore {
  overall: number;
  cognitive: number;
  emotional: number;
  social: number;
  lastUpdated: Date;
}

// Agora配置
export interface AgoraConfig {
  appId: string;
  channelName: string;
  token?: string;
  uid?: string | number;
}

// 会话记录
export interface SessionRecord {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  healthMetrics?: HealthMetrics;
}

// 健康指标
export interface HealthMetrics {
  emotionalState: 'positive' | 'neutral' | 'negative';
  cognitivePerformance: number;
  responseTime: number;
  conversationQuality: number;
}