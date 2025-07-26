// 应用常量配置

// Agora 配置
export const AGORA_CONFIG = {
  APP_ID: 'd83b679bc7b3406c83f63864cb74aa99',
  // 在实际应用中，这些值应该从环境变量或API获取
  DEFAULT_CHANNEL: 'medjourney-default',
  CODEC: 'opus' as const,
  MODE: 'rtc' as const,
};

// TEN Framework 配置
export const TEN_FRAMEWORK_CONFIG = {
  WS_URL: import.meta.env.VITE_TEN_WS_URL || 'ws://localhost:8080',
  API_URL: import.meta.env.VITE_TEN_API_URL || 'http://localhost:8080',
};

// 应用配置
export const APP_CONFIG = {
  NAME: 'MedJourney',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI陪伴式健康管理平台',
  SUPPORT_EMAIL: 'support@medjourney.com',
};

// 路由常量
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  HISTORY: '/history',
  CHAT: '/chat',
  FAMILY_SUMMARY: '/family-summary',
  DOCTOR: '/doctor',
  DOCTOR_REPORT: '/doctor/report',
} as const;

// 消息类型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  IMAGE: 'image',
} as const;

// 会话类型
export const SESSION_TYPES = {
  CHAT: 'chat',
  ASSESSMENT: 'assessment',
  THERAPY: 'therapy',
} as const;

// 用户角色
export const USER_ROLES = {
  PATIENT: 'patient',
  FAMILY: 'family',
  DOCTOR: 'doctor',
} as const;

// 情感状态颜色映射
export const EMOTION_COLORS = {
  happiness: '#10B981',
  sadness: '#6366F1',
  anger: '#EF4444',
  fear: '#F59E0B',
  surprise: '#8B5CF6',
  disgust: '#84CC16',
  neutral: '#6B7280',
} as const;

// 健康评分等级
export const HEALTH_SCORE_LEVELS = {
  EXCELLENT: { min: 90, max: 100, color: '#10B981', label: '优秀' },
  GOOD: { min: 75, max: 89, color: '#3B82F6', label: '良好' },
  FAIR: { min: 60, max: 74, color: '#F59E0B', label: '一般' },
  POOR: { min: 40, max: 59, color: '#EF4444', label: '较差' },
  CRITICAL: { min: 0, max: 39, color: '#DC2626', label: '需要关注' },
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  PATIENT_INFO: 'patient_info',
  LAST_SESSION: 'last_session',
  SETTINGS: 'app_settings',
} as const;

// API超时配置
export const API_TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 120000,
  STREAMING: 300000,
} as const;

// 文件上传限制
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    AUDIO: ['audio/wav', 'audio/mp3', 'audio/ogg'],
    DOCUMENT: ['application/pdf', 'text/plain'],
  },
} as const;

// 音频配置
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  CHUNK_DURATION: 1000, // 1秒
  VAD_THRESHOLD: 0.3,
} as const;

// UI配置
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  POLL_INTERVAL: 5000,
  MAX_MESSAGES_DISPLAY: 100,
  CHART_COLORS: [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
  ],
} as const;
