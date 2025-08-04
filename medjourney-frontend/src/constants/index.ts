// 应用常量

// Agora配置
export const AGORA_APP_ID = 'd83b679bc7b3406c83f63864cb74aa99';

// TEN Framework & 集成服务配置
export const SERVICE_CONFIG = {
  AGORA_APP_ID: import.meta.env.VITE_AGORA_APP_ID || 'd83b679bc7b3406c83f63864cb74aa99',
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  STEPFUN_API_KEY: import.meta.env.VITE_STEPFUN_API_KEY || '',
  STEPFUN_BASE_URL: 'https://api.stepfun.com/v1',
  ELEVENLABS_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // 中文女声
  ELEVENLABS_MODEL_ID: 'eleven_multilingual_v2'
} as const;

// TEN Framework配置
export const TEN_CONFIG = {
  AGORA_APP_ID: SERVICE_CONFIG.AGORA_APP_ID,
  WS_ENDPOINT: 'ws://localhost:8080/ws',
  API_ENDPOINT: 'http://localhost:8080/api',
  ELEVENLABS_API_KEY: SERVICE_CONFIG.ELEVENLABS_API_KEY,
  VOICE_SETTINGS: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true
  }
} as const;

// 路由路径
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  HISTORY: '/history',
  // 新增分级问诊流程路由
  ASSESSMENT: '/assessment',
  ASSESSMENT_BASIC: '/assessment/basic',
  ASSESSMENT_CASE: '/assessment/case', 
  ASSESSMENT_CHAT: '/assessment/chat',
  // 原有路由
  CHAT: '/chat',
  FAMILY_SUMMARY: '/family-summary',
  DOCTOR: '/doctor',
  DOCTOR_REPORT: '/doctor/report/:sid',
  // 新增虚拟病人和分享路由
  VIRTUAL_PATIENTS: '/virtual-patients',
  SHARE_REPORT: '/share/:reportId',
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

// 分级问诊阶段
export const ASSESSMENT_STAGES = {
  BASIC: 'basic',
  CASE: 'case', 
  CHAT: 'chat'
} as const;

// 虚拟病人模板
export const VIRTUAL_PATIENTS = [
  {
    id: 'patient-a',
    name: '王奶奶',
    age: 68,
    stage: 'early',
    description: '早期Alzheimer\'s，记忆力轻微下降',
    avatar: '/images/patient-a.jpg',
    basicInfo: {
      patientName: '王奶奶',
      age: 68,
      gender: 'female' as const,
      symptoms: ['记忆力下降', '偶尔迷路', '忘记日期'],
      duration: '6个月',
      severity: 'mild' as const,
      familyHistory: true,
      medications: [],
      concerns: '家人担心记忆力下降情况'
    },
    sampleDialogues: [
      { role: 'user', content: '今天是几号？' },
      { role: 'assistant', content: '让我想想... 是周三吗？' },
      { role: 'user', content: '您感觉怎么样？' },
      { role: 'assistant', content: '还好，就是有时候会忘记一些事情...' }
    ]
  },
  {
    id: 'patient-b', 
    name: '李爷爷',
    age: 75,
    stage: 'middle',
    description: '中期患者，日常活动困难',
    avatar: '/images/patient-b.jpg',
    basicInfo: {
      patientName: '李爷爷',
      age: 75,
      gender: 'male' as const,
      symptoms: ['语言困难', '日常活动需要帮助', '情绪波动'],
      duration: '2年',
      severity: 'moderate' as const,
      familyHistory: false,
      medications: [],
      concerns: '日常活动困难，需要照护'
    },
    sampleDialogues: [
      { role: 'user', content: '您还记得我是谁吗？' },
      { role: 'assistant', content: '你... 你是？我记得你，但是...' },
      { role: 'user', content: '今天想做什么？' },
      { role: 'assistant', content: '我不知道... 你能帮我吗？' }
    ]
  },
  {
    id: 'patient-c',
    name: '张奶奶', 
    age: 82,
    stage: 'late',
    description: '晚期患者，需要全面照护',
    avatar: '/images/patient-c.jpg',
    basicInfo: {
      patientName: '张奶奶',
      age: 82,
      gender: 'female' as const,
      symptoms: ['严重记忆丧失', '无法独立生活', '认知严重下降'],
      duration: '5年',
      severity: 'severe' as const,
      familyHistory: true,
      medications: [],
      concerns: '需要全天候照护'
    },
    sampleDialogues: [
      { role: 'user', content: '您好' },
      { role: 'assistant', content: '...' },
      { role: 'user', content: '您感觉怎么样？' },
      { role: 'assistant', content: '不... 不好...' }
    ]
  }
] as const;