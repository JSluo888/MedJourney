// MedJourney Backend Core Types

// 基础类型
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// 患者信息
export interface Patient extends BaseEntity {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  emergency_contact?: string;
  medical_history?: string;
  avatar_url?: string;
}

// 病史记录
export interface MedicalHistory extends BaseEntity {
  patient_id: string;
  text_content: string;
  images?: string[]; // 图片URL数组
  uploaded_files?: UploadedFile[];
  created_by?: string;
}

// 上传文件
export interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  url: string;
  uploaded_at: Date;
}

// 会话信息
export interface Session extends BaseEntity {
  patient_id: string;
  prior_history?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  started_at: Date;
  ended_at?: Date;
  session_type: 'chat' | 'assessment' | 'therapy' | 'general';
  metadata?: Record<string, any>;
}

// 消息类型
export type MessageType = 'text' | 'audio' | 'image' | 'system' | 'assessment';
export type MessageSender = 'user' | 'assistant' | 'system';

// 对话消息
export interface Message extends BaseEntity {
  session_id: string;
  type: MessageType;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  metadata?: {
    audio_url?: string;
    image_url?: string;
    duration?: number;
    confidence_score?: number;
    emotional_state?: string;
    response_time?: number;
    [key: string]: any;
  };
}

// 健康评分
export interface HealthScore {
  overall: number;
  cognitive: number;
  emotional: number;
  social: number;
  physical?: number;
}

// 家属评分记录
export interface FamilyScore extends BaseEntity {
  session_id: string;
  patient_id: string;
  health_score: HealthScore;
  mental_score: number;
  insights: string[];
  trends: {
    period: string;
    improvement: boolean;
    key_changes: string[];
  };
  generated_by: 'ai' | 'manual';
}

// 医生报告
export interface DoctorReport extends BaseEntity {
  session_id: string;
  patient_id: string;
  symptoms_data: {
    frequency: Record<string, number>;
    severity: Record<string, number>;
    patterns: string[];
  };
  emotion_trends: {
    positive_ratio: number;
    negative_ratio: number;
    neutral_ratio: number;
    dominant_emotions: string[];
    stability_score: number;
  };
  memory_tests: {
    short_term: number;
    long_term: number;
    working_memory: number;
    recall_accuracy: number;
  };
  cognitive_assessment: {
    attention: number;
    language: number;
    orientation: number;
    executive_function: number;
    overall_mmse_score: number;
  };
  analysis: {
    summary: string;
    concerns: string[];
    improvements: string[];
    recommendations: string[];
  };
  generated_at: Date;
  report_type: 'daily' | 'weekly' | 'monthly' | 'session';
}

// AI分析结果
export interface AIAnalysis {
  emotional_state: 'positive' | 'negative' | 'neutral' | 'mixed';
  cognitive_performance: number;
  response_time: number;
  conversation_quality: number;
  key_topics: string[];
  concerns: string[];
  insights: string[];
}

// RAG查询结果
export interface RAGResult {
  question: string;
  context: string[];
  confidence: number;
  sources: string[];
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    version: string;
    request_id: string;
  };
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 错误类型
export interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

// JWT令牌载荷
export interface JWTPayload {
  patient_id: string;
  email?: string;
  role: 'patient' | 'family' | 'doctor' | 'admin';
  iat: number;
  exp: number;
}

// 请求上下文
export interface RequestContext {
  patient_id: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
  request_id: string;
}

// 配置类型
export interface Config {
  server: {
    port: number;
    host: string;
    env: 'development' | 'production' | 'test';
  };
  database: {
    url: string;
    supabase_url: string;
    supabase_anon_key: string;
    supabase_service_key: string;
  };
  ai: {
    openai_api_key: string;
    openai_model: string;
    temperature: number;
    pinecone_api_key: string;
    pinecone_index: string;
    stepfun_api_key: string;
    stepfun_base_url: string;
    stepfun_model: string;
    minimax_api_key: string;
    minimax_group_id: string;
    elevenlabs_api_key: string;
  };
  storage: {
    max_file_size: number;
    allowed_types: string[];
    bucket_name: string;
  };
  security: {
    jwt_secret: string;
    jwt_expires_in: string;
    bcrypt_rounds: number;
    rate_limit: {
      window_ms: number;
      max_requests: number;
    };
  };
}

// TEN Framework集成类型
export interface TENMessage {
  type: 'text' | 'audio' | 'image' | 'control';
  content: string | ArrayBuffer;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TENResponse {
  message_id: string;
  response_type: 'text' | 'audio';
  content: string;
  confidence: number;
  processing_time: number;
  emotions_detected?: string[];
}

// 导出所有类型
export * from './api';
export * from './services';