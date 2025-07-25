// 应用入口文件

import MedJourneyServer from './server';
import { logger } from './utils/logger';

// 创建服务器实例
async function startServer(): Promise<void> {
  try {
    logger.info('🚀 MedJourney MVP 后端服务启动中...');
    
    const server = new MedJourneyServer();
    await server.start();
    
    logger.info('✓ MedJourney MVP 后端服务已成功启动');
  } catch (error) {
    logger.error('服务器启动失败', error as Error);
    process.exit(1);
  }
}

// 启动服务器
startServer();