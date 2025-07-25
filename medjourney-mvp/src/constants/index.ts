// 应用常量

// Agora配置
export const AGORA_APP_ID = 'd83b679bc7b3406c83f63864cb74aa99';

// 路由路径
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  HISTORY: '/history',
  CHAT: '/chat',
  FAMILY_SUMMARY: '/family-summary',
  DOCTOR: '/doctor',
  DOCTOR_REPORT: '/doctor/report/:sid',
} as const;

// 主题色彩
export const THEME_COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  healing: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warm: {
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  }
};

// 消息类型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  IMAGE: 'image',
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  USER_PROFILE: 'medjourney_user_profile',
  SESSION_HISTORY: 'medjourney_session_history',
  HEALTH_SCORES: 'medjourney_health_scores',
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  MAX_RECORDING_TIME: 60000, // 60秒
  AGORA_CHANNEL_PREFIX: 'medjourney_',
  HEALTH_SCORE_REFRESH_INTERVAL: 300000, // 5分钟
} as const;