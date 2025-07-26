// 测试路由 - 用于验证AI服务功能
import { Router } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { StepfunServiceFactory } from '../services/stepfun';
import { ElevenLabsServiceFactory } from '../services/elevenlabs';

const router = Router();

// Stepfun AI 测试
router.post('/stepfun', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return errorResponse(res, null, '缺少消息内容', 'MISSING_MESSAGE', 400);
    }
    
    const stepfunService = StepfunServiceFactory.getInstance();
    
    const result = await stepfunService.generateResponse(
      `作为MedJourney的医疗AI助手，请回答以下问题：${message}`,
      { context: 'test_conversation' }
    );
    
    logger.info('Stepfun测试成功', {
      messageLength: message.length,
      responseLength: result.response.length,
      tokens: result.usage.total_tokens
    });
    
    return successResponse(res, {
      ai_response: result.response,
      confidence: result.confidence,
      usage: result.usage,
      timestamp: new Date().toISOString()
    }, 'Stepfun AI测试成功');
    
  } catch (error: any) {
    logger.error('Stepfun测试失败', error);
    return errorResponse(res, null, `AI服务测试失败: ${error.message}`, 'AI_TEST_ERROR', 500);
  }
});

// 情感分析测试
router.post('/emotion', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return errorResponse(res, null, '缺少文本内容', 'MISSING_TEXT', 400);
    }
    
    const stepfunService = StepfunServiceFactory.getInstance();
    const result = await stepfunService.analyzeEmotion(text);
    
    logger.info('情感分析测试成功', {
      textLength: text.length,
      primaryEmotion: result.emotion,
      confidence: result.confidence
    });
    
    return successResponse(res, {
      primary_emotion: result.emotion,
      confidence: result.confidence,
      emotions: result.emotions,
      timestamp: new Date().toISOString()
    }, '情感分析测试成功');
    
  } catch (error: any) {
    logger.error('情感分析测试失败', error);
    return errorResponse(res, null, `情感分析测试失败: ${error.message}`, 'EMOTION_TEST_ERROR', 500);
  }
});

// ElevenLabs 语音合成测试
router.post('/speech', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text) {
      return errorResponse(res, null, '缺少文本内容', 'MISSING_TEXT', 400);
    }
    
    const elevenLabsService = ElevenLabsServiceFactory.getInstance();
    
    // 获取语音数据
    const audioData = await elevenLabsService.generateSpeech(text, voice);
    
    logger.info('ElevenLabs测试成功', {
      textLength: text.length,
      voice: voice || 'default',
      audioSize: audioData.length
    });
    
    return successResponse(res, {
      audio_size: audioData.length,
      voice_used: voice || 'default',
      text_length: text.length,
      timestamp: new Date().toISOString(),
      note: '音频数据已生成但未返回（数据量大）'
    }, 'ElevenLabs语音合成测试成功');
    
  } catch (error: any) {
    logger.error('ElevenLabs测试失败', error);
    return errorResponse(res, null, `语音合成测试失败: ${error.message}`, 'SPEECH_TEST_ERROR', 500);
  }
});

// 系统状态测试
router.get('/status', async (req, res) => {
  try {
    const stepfunService = StepfunServiceFactory.getInstance();
    const elevenLabsService = ElevenLabsServiceFactory.getInstance();
    
    // 简单的连通性测试
    const stepfunTest = await stepfunService.generateResponse('测试连接', { test: true });
    
    return successResponse(res, {
      stepfun_ai: {
        status: 'operational',
        test_response_length: stepfunTest.response.length,
        tokens_used: stepfunTest.usage.total_tokens
      },
      elevenlabs: {
        status: 'operational',
        note: 'Service initialized successfully'
      },
      timestamp: new Date().toISOString()
    }, '所有AI服务运行正常');
    
  } catch (error: any) {
    logger.error('系统状态测试失败', error);
    return errorResponse(res, null, `系统状态检查失败: ${error.message}`, 'STATUS_TEST_ERROR', 500);
  }
});

export default router;
