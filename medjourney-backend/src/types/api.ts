// API请求和响应类型

import { Patient, Session, Message, MedicalHistory, FamilyScore, DoctorReport } from './index';

// 通用API响应类型
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// 患者相关接口
export interface CreatePatientRequest {
  name: string;
  email: string;
  phone?: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  diagnosis_date?: string;
  disease_stage?: 'early' | 'moderate' | 'severe';
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medical_history?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    notes?: string;
  };
}

export interface UpdatePatientRequest {
  name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  diagnosis_date?: string;
  disease_stage?: 'early' | 'moderate' | 'severe';
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medical_history?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    notes?: string;
  };
}

export interface PatientResponse {
  patient: Patient;
  token?: string;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 会话相关接口
export interface CreateSessionRequest {
  patient_id: string;
  session_type?: 'chat' | 'assessment' | 'therapy';
}

export interface UpdateSessionRequest {
  status?: 'active' | 'paused' | 'completed';
  notes?: string;
}

export interface SessionResponse {
  session: Session;
}

export interface SessionListResponse {
  sessions: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 消息相关接口
export interface SendMessageRequest {
  session_id: string;
  content: string;
  message_type: 'text' | 'audio' | 'image';
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }[];
}

export interface MessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

export interface MessageListResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 病史导入接口
export interface ImportMedicalHistoryRequest {
  patient_id: string;
  content: string;
  source?: string;
  attachments?: {
    url: string;
    type: string;
    name: string;
  }[];
}

export interface MedicalHistoryResponse {
  history: MedicalHistory;
}

// 家属功能接口
export interface SubmitFamilyScoreRequest {
  patient_id: string;
  health_score: number;
  mental_score: number;
  insight?: string;
  notes?: string;
}

export interface FamilyScoreResponse {
  score: FamilyScore;
}

export interface FamilySummaryResponse {
  patient: {
    id: string;
    name: string;
    disease_stage?: string;
  };
  period: {
    start_date: string;
    end_date: string;
    period_type: string;
  };
  scores: {
    health_score: number | null;
    mental_score: number | null;
    created_at: string | null;
  };
  statistics: {
    sessions: {
      total: number;
      completed: number;
      avg_duration_minutes: number;
    };
    emotions: {
      positive: number;
      neutral: number;
      negative: number;
    };
    activity: {
      total_messages: number;
      patient_messages: number;
      avg_messages_per_day: number;
    };
  };
  insight: string;
}

// 医生功能接口
export interface DoctorDashboardResponse {
  patients: (Patient & {
    latest_session: Session | null;
    latest_score: FamilyScore | null;
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: {
    total_patients: number;
    active_sessions: number;
    pending_reviews: number;
    reports_generated: number;
  };
}

export interface PatientReportResponse {
  patient: Patient;
  period: {
    start_date: string;
    end_date: string;
    period_type: string;
  };
  summary: {
    total_sessions: number;
    total_messages: number;
    total_family_scores: number;
    avg_session_duration: number;
    activity_level: 'low' | 'moderate' | 'high';
  };
  analysis: any;
  insights: string[];
  data: {
    sessions: Session[];
    recent_messages: Message[];
    family_scores: FamilyScore[];
  };
}

export interface GenerateReportRequest {
  patient_id: string;
  period?: string;
  sections?: string;
}

export interface DoctorReportResponse {
  report: DoctorReport;
}

// 文件上传接口
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface MultipleFileUploadResponse {
  files: FileUploadResponse[];
  uploaded_count: number;
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

// 登录接口
export interface LoginRequest {
  email: string;
  password?: string; // 在MVP中可选
}

export interface LoginResponse {
  patient: Patient;
  token: string;
}

// 查询参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

export interface SessionListParams extends PaginationParams {
  patient_id?: string;
  status?: string;
  session_type?: string;
}

export interface MessageListParams extends PaginationParams {
  session_id?: string;
  patient_id?: string;
  sender_type?: string;
}

export interface FamilyScoreListParams extends PaginationParams, DateRangeParams {
  patient_id?: string;
}