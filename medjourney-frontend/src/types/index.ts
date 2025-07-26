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
  type: 'text' | 'audio' | 'image' | 'response';
  sender: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
  imageUrl?: string;
}

// 语音消息类型
export interface VoiceMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
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

// 分级问诊数据类型
export interface AssessmentData {
  stage: 'basic' | 'case' | 'chat';
  basicInfo?: BasicAssessment;
  caseInfo?: CaseAssessment;
  chatData?: ChatAssessment;
  completed: boolean;
}

// 基础问卷评估
export interface BasicAssessment {
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  familyHistory: boolean;
  medications: string[];
  concerns: string;
}

// 病例信息评估
export interface CaseAssessment {
  description: string;
  images: CaseImage[];
  medicalRecords: string[];
  additionalNotes: string;
}

// 病例图片
export interface CaseImage {
  id: string;
  url: string;
  description: string;
  type: 'scan' | 'photo' | 'document';
  uploadedAt: Date;
}

// 对话评估
export interface ChatAssessment {
  sessionId: string;
  dialogues: Message[];
  cognitiveTests: CognitiveTest[];
  emotionalAnalysis: EmotionalAnalysis;
  overallScore: number;
}

// 认知测试
export interface CognitiveTest {
  id: string;
  type: 'memory' | 'attention' | 'language' | 'orientation';
  question: string;
  answer: string;
  score: number;
  maxScore: number;
  completedAt: Date;
}

// 情感分析
export interface EmotionalAnalysis {
  positiveScore: number;
  negativeScore: number;
  neutralScore: number;
  dominantEmotion: string;
  confidenceLevel: number;
}

// 虚拟病人
export interface VirtualPatient {
  id: string;
  name: string;
  age: number;
  stage: 'early' | 'middle' | 'late';
  description: string;
  avatar: string;
  basicInfo: BasicAssessment;
  sampleDialogues: DialogueTurn[];
  medicalHistory?: string;
  currentMedications?: string[];
}

// 对话轮次
export interface DialogueTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// 报告分享
export interface ShareableReport {
  id: string;
  patientId: string;
  patientName: string; // 添加患者姓名
  type: 'family' | 'doctor' | 'assessment';
  title: string;
  generatedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  data: any;
  shareUrl: string;
  qrCode?: string;
  // 添加缺失的属性
  summary: {
    overallScore: number;
    cognitiveScore: number;
    emotionalScore: number;
    socialScore: number;
  };
  insights?: string[]; // 关键洞察
  trends?: any[]; // 趋势数据
  emotionDistribution?: any[]; // 情绪分布
  activities?: any[]; // 活动统计
}

// PDF报告配置
export interface PDFReportConfig {
  includeCharts: boolean;
  includeDialogues: boolean;
  includeAnalysis: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  language: 'zh' | 'en';
}