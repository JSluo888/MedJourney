// 应用配置管理

import { Config } from '../types';
import { logger } from '../utils/logger';

// 默认配置
const defaultConfig: Partial<Config> = {
  server: {
    host: 'localhost',
    port: 3001,
    env: 'development'
  },
  database: {
    url: 'postgresql://localhost:5432/medjourney',
    supabase_url: 'https://localhost:54321',
    supabase_anon_key: 'mock-anon-key',
    supabase_service_key: 'mock-service-key'
  },
  ai: {
    openai_api_key: 'mock-openai-key',
    openai_model: 'gpt-4o',
    temperature: 0.7,
    pinecone_api_key: 'mock-pinecone-key',
    pinecone_index: 'medjourney-knowledge'
  },
  storage: {
    bucket_name: 'medjourney-storage',
    max_file_size: 10 * 1024 * 1024, // 10MB
    allowed_types: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'application/pdf',
      'text/plain'
    ]
  },
  security: {
    jwt_secret: 'mock-jwt-secret-key-for-development',
    jwt_expires_in: '7d',
    bcrypt_rounds: 12,
    rate_limit: {
      window_ms: 15 * 60 * 1000, // 15分钟
      max_requests: 100
    }
  },
  logging: {
    level: 'info',
    file_enabled: false,
    console_enabled: true
  }
};

// 从环境变量加载配置
function loadConfigFromEnv(): Partial<Config> {
  return {
    server: {
      host: process.env.HOST || defaultConfig.server!.host,
      port: parseInt(process.env.PORT || '3001'),
      env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || defaultConfig.server!.env
    },
    database: {
      url: process.env.DATABASE_URL || defaultConfig.database!.url,
      supabase_url: process.env.SUPABASE_URL || defaultConfig.database!.supabase_url,
      supabase_anon_key: process.env.SUPABASE_ANON_KEY || defaultConfig.database!.supabase_anon_key,
      supabase_service_key: process.env.SUPABASE_SERVICE_KEY || defaultConfig.database!.supabase_service_key
    },
    ai: {
      openai_api_key: process.env.OPENAI_API_KEY || defaultConfig.ai!.openai_api_key,
      openai_model: process.env.OPENAI_MODEL || defaultConfig.ai!.openai_model,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      pinecone_api_key: process.env.PINECONE_API_KEY || defaultConfig.ai!.pinecone_api_key,
      pinecone_index: process.env.PINECONE_INDEX || defaultConfig.ai!.pinecone_index
    },
    storage: {
      bucket_name: process.env.STORAGE_BUCKET || defaultConfig.storage!.bucket_name,
      max_file_size: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      allowed_types: process.env.ALLOWED_FILE_TYPES 
        ? process.env.ALLOWED_FILE_TYPES.split(',') 
        : defaultConfig.storage!.allowed_types
    },
    security: {
      jwt_secret: process.env.JWT_SECRET || defaultConfig.security!.jwt_secret,
      jwt_expires_in: process.env.JWT_EXPIRES_IN || defaultConfig.security!.jwt_expires_in,
      bcrypt_rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      rate_limit: {
        window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
      }
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || defaultConfig.logging!.level,
      file_enabled: process.env.LOG_FILE_ENABLED === 'true',
      console_enabled: process.env.LOG_CONSOLE_ENABLED !== 'false'
    }
  };
}

// 合并配置
function mergeConfig(base: Partial<Config>, override: Partial<Config>): Config {
  return {
    server: { ...base.server, ...override.server } as Config['server'],
    database: { ...base.database, ...override.database } as Config['database'],
    ai: { ...base.ai, ...override.ai } as Config['ai'],
    storage: { ...base.storage, ...override.storage } as Config['storage'],
    security: { ...base.security, ...override.security } as Config['security'],
    logging: { ...base.logging, ...override.logging } as Config['logging']
  };
}

// 验证配置
function validateConfig(config: Config): void {
  const requiredFields = [
    'server.host',
    'server.port',
    'database.supabase_url',
    'security.jwt_secret'
  ];

  for (const field of requiredFields) {
    const keys = field.split('.');
    let value: any = config;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (!value) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }

  // 验证端口范围
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('Invalid port number');
  }

  // 验证环境变量
  if (!['development', 'production', 'test'].includes(config.server.env)) {
    throw new Error('Invalid environment');
  }
}

// 创建配置
function createConfig(): Config {
  try {
    const envConfig = loadConfigFromEnv();
    const config = mergeConfig(defaultConfig, envConfig);
    
    validateConfig(config);
    
    return config;
  } catch (error) {
    console.error('Configuration error:', error);
    throw error;
  }
}

// 导出配置实例
export const config = createConfig();

// 导出配置创建函数（用于测试）
export { createConfig, validateConfig };

export default config;