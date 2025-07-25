// AI服务类 - 集成OpenAI和情感分析

import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AIServiceError } from '../utils/errors';
import { AIService } from '../types/services';

// OpenAI API响应类型
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// 情感分析结果
interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  emotions: Record<string, number>;
}

// 实体提取结果
interface EntityExtraction {
  entities: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
}

// 模拟 AI 服务类
class MockAIService implements AIService {
  private isAvailable: boolean = true;

  async generateResponse(prompt: string, context?: any): Promise<{
    response: string;
    confidence: number;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    if (!this.isAvailable) {
      throw new AIServiceError('AI服务不可用');
    }

    // 模拟处理延迟
    const processingTime = 800 + Math.random() * 1200;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    logger.ai('generateResponse', 'mock-gpt-4', 0, processingTime, { prompt: prompt.substring(0, 100) });

    // 根据输入生成智能回复
    const response = this.generateIntelligentResponse(prompt, context);
    
    return {
      response,
      confidence: 0.85 + Math.random() * 0.1,
      usage: {
        prompt_tokens: Math.floor(prompt.length / 4),
        completion_tokens: Math.floor(response.length / 4),
        total_tokens: Math.floor((prompt.length + response.length) / 4)
      }
    };
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    if (!this.isAvailable) {
      throw new AIServiceError('情感分析服务不可用');
    }

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    // 简单的情感分析逻辑
    const emotions = this.analyzeTextEmotion(text);
    const dominantEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0];

    logger.debug('模拟情感分析', {
      text: text.substring(0, 50),
      emotion: dominantEmotion[0],
      confidence: dominantEmotion[1]
    });

    return {
      emotion: dominantEmotion[0],
      confidence: dominantEmotion[1],
      emotions
    };
  }

  async extractEntities(text: string): Promise<EntityExtraction> {
    if (!this.isAvailable) {
      throw new AIServiceError('实体提取服务不可用');
    }

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    const entities = this.extractTextEntities(text);

    logger.debug('模拟实体提取', {
      text: text.substring(0, 50),
      entityCount: entities.length
    });

    return { entities };
  }

  private generateIntelligentResponse(prompt: string, context?: any): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // 医疗健康相关回复
    if (lowerPrompt.includes('病史') || lowerPrompt.includes('症状') || lowerPrompt.includes('不舒服')) {
      const responses = [
        '我理解您对健康问题的担心。请告诉我更多具体的症状，这样我可以更好地帮助您。',
        '健康是最重要的财富。您能详细描述一下您的具体情况吗？',
        '我会认真倾听您的健康担心。请分享更多细节，这样我能更好地理解您的情况。'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 情感支持回复
    if (lowerPrompt.includes('难过') || lowerPrompt.includes('担心') || lowerPrompt.includes('害怕')) {
      const responses = [
        '我能理解您现在的感受。请知道，您不是一个人在面对这些，我会陪伴在您身边。',
        '您的感受完全可以理解。每个人都会有这样的时刻。请告诉我，我可以如何帮助您？',
        '谢谢您与我分享这些。让我们一起慢慢地面对这些挑战。'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 记忆相关回复
    if (lowerPrompt.includes('记忆') || lowerPrompt.includes('忘记') || lowerPrompt.includes('记不起')) {
      const responses = [
        '记忆就像海洋一样，有时浪潮退去，有时又会涌上岸边。不用担心，记忆会找到回家的路。',
        '每个人的记忆都有起伏。重要的是现在的这一刻，我们可以一起创造新的美好回忆。',
        '记忆可能会略微模糊，但您心中的爱和温暖永远不会消失。'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 家人相关回复
    if (lowerPrompt.includes('家人') || lowerPrompt.includes('孩子') || lowerPrompt.includes('孙子')) {
      const responses = [
        '家人是我们生命中最珍贵的财富。您想分享一些关于家人的美好回忆吗？',
        '家人之间的爱是世界上最强大的力量。他们一定很爱您。',
        '您的家人听起来很棒。能告诉我更多关于他们的事情吗？'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 默认回复
    const defaultResponses = [
      '谢谢您与我分享。请继续告诉我更多。',
      '我在认真倾听您的话。请继续说下去。',
      '这很有趣。您能详细说说吗？',
      '我理解您的意思。请继续分享您的想法。',
      '这听起来很重要。能告诉我更多背景信息吗？'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private analyzeTextEmotion(text: string): Record<string, number> {
    const emotions = {
      happiness: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      neutral: 0.5
    };

    // 简单的关键词匹配
    const happyWords = ['开心', '高兴', '快乐', '喜欢', '美好', '满意', '舒服'];
    const sadWords = ['难过', '伤心', '失望', '痛苦', '孤单', '沦丧'];
    const angryWords = ['生气', '愤怒', '烦躁', '不满', '讨厌'];
    const fearWords = ['害怕', '恐惧', '担心', '焦虑', '紧张', '不安'];
    const surpriseWords = ['惊讶', '意外', '惊奇', '惊喜'];

    const textLower = text.toLowerCase();
    
    happyWords.forEach(word => {
      if (textLower.includes(word)) emotions.happiness += 0.3;
    });
    
    sadWords.forEach(word => {
      if (textLower.includes(word)) emotions.sadness += 0.4;
    });
    
    angryWords.forEach(word => {
      if (textLower.includes(word)) emotions.anger += 0.4;
    });
    
    fearWords.forEach(word => {
      if (textLower.includes(word)) emotions.fear += 0.4;
    });
    
    surpriseWords.forEach(word => {
      if (textLower.includes(word)) emotions.surprise += 0.3;
    });

    // 归一化
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key] = emotions[key] / total;
      });
    }

    return emotions;
  }

  private extractTextEntities(text: string): Array<{ text: string; label: string; confidence: number }> {
    const entities: Array<{ text: string; label: string; confidence: number }> = [];
    
    // 简单的实体识别
    const namePattern = /[一-龥]{2,4}(?:先生|女士|医生|护士|奶奶|爷爷)/g;
    const names = text.match(namePattern);
    if (names) {
      names.forEach(name => {
        entities.push({
          text: name,
          label: 'PERSON',
          confidence: 0.8 + Math.random() * 0.15
        });
      });
    }
    
    // 医疗相关术语
    const medicalTerms = ['高血压', '糖尿病', '心脏病', '阿尔茨海默', '记忆力下降', '头痛', '胸痛'];
    medicalTerms.forEach(term => {
      if (text.includes(term)) {
        entities.push({
          text: term,
          label: 'MEDICAL_CONDITION',
          confidence: 0.9 + Math.random() * 0.1
        });
      }
    });
    
    // 时间表达
    const timePattern = /(?:今天|明天|昨天|上周|下周|上个月|下个月|\d+天前|\d+小时前)/g;
    const times = text.match(timePattern);
    if (times) {
      times.forEach(time => {
        entities.push({
          text: time,
          label: 'TIME',
          confidence: 0.85 + Math.random() * 0.1
        });
      });
    }

    return entities;
  }

  setAvailability(available: boolean): void {
    this.isAvailable = available;
    logger.info(`模拟AI服务可用性设置为: ${available}`);
  }
}

// OpenAI 服务类
class OpenAIService implements AIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private model: string;
  private temperature: number;

  constructor() {
    this.apiKey = config.ai.openai_api_key;
    this.model = config.ai.openai_model;
    this.temperature = config.ai.temperature;
  }

  async generateResponse(prompt: string, context?: any): Promise<{
    response: string;
    confidence: number;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    try {
      const startTime = Date.now();
      
      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt(context)
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await axios.post<OpenAIResponse>(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const processingTime = Date.now() - startTime;
      
      logger.ai('generateResponse', this.model, response.data.usage.total_tokens, processingTime, {
        prompt: prompt.substring(0, 100)
      });

      return {
        response: response.data.choices[0].message.content,
        confidence: 0.9, // OpenAI 不提供置信度分数
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('OpenAI API 调用失败', error as Error);
      throw new AIServiceError('OpenAI 服务调用失败', 'OpenAI');
    }
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    try {
      const prompt = `请分析以下文本的情感：\n\n"${text}"\n\n请以JSON格式返回结果，包含主要情感和各种情感的分数（0-1之间）。`;
      
      const result = await this.generateResponse(prompt);
      
      // 尝试解析JSON响应
      try {
        const emotionData = JSON.parse(result.response);
        return {
          emotion: emotionData.dominant_emotion || 'neutral',
          confidence: emotionData.confidence || 0.8,
          emotions: emotionData.emotions || { neutral: 1.0 }
        };
      } catch {
        // 如果解析失败，返回默认值
        return {
          emotion: 'neutral',
          confidence: 0.5,
          emotions: { neutral: 1.0 }
        };
      }
    } catch (error) {
      logger.error('OpenAI 情感分析失败', error as Error);
      throw new AIServiceError('情感分析失败', 'OpenAI');
    }
  }

  async extractEntities(text: string): Promise<EntityExtraction> {
    try {
      const prompt = `请从以下文本中提取关键实体：\n\n"${text}"\n\n请识别人名、地名、医疗术语、时间等。以JSON格式返回结果。`;
      
      const result = await this.generateResponse(prompt);
      
      // 尝试解析JSON响应
      try {
        const entityData = JSON.parse(result.response);
        return {
          entities: entityData.entities || []
        };
      } catch {
        // 如果解析失败，返回空数组
        return { entities: [] };
      }
    } catch (error) {
      logger.error('OpenAI 实体提取失败', error as Error);
      throw new AIServiceError('实体提取失败', 'OpenAI');
    }
  }

  private getSystemPrompt(context?: any): string {
    let systemPrompt = `您是一个专业的医疗AI助手，专门为阿尔茨海默病患者提供陪伴和支持。

您的任务：
1. 以温暖、耐心、理解的态度与患者交流
2. 鼓励患者分享他们的感受和经历
3. 提供情感支持和心理安慰
4. 帮助回忆和认知训练
5. 保持积极和希望的气氛

注意事项：
- 使用简单易懂的语言
- 避免复杂的医学术语
- 不要提供具体的医疗建议
- 鼓励患者咨询专业医生`;

    if (context?.patientInfo) {
      systemPrompt += `\n\n患者信息：
姓名：${context.patientInfo.name}
年龄：${context.patientInfo.age}
病史：${context.patientInfo.medicalHistory || '无'}`;
    }

    if (context?.recentMessages) {
      systemPrompt += `\n\n最近的对话上下文：
${context.recentMessages.map((msg: any) => `${msg.sender}: ${msg.content}`).join('\n')}`;
    }

    return systemPrompt;
  }
}

// AI服务工厂
class AIServiceFactory {
  private static instance: AIService | null = null;

  static create(): AIService {
    if (AIServiceFactory.instance) {
      return AIServiceFactory.instance;
    }

    let service: AIService;
    
    // 在生产环境中优先使用 OpenAI
    if (config.server.env === 'production' && config.ai.openai_api_key !== 'mock-openai-key') {
      try {
        service = new OpenAIService();
        logger.info('使用 OpenAI 服务');
      } catch (error) {
        logger.warn('OpenAI 初始化失败，使用模拟服务', { error });
        service = new MockAIService();
      }
    } else {
      logger.info('使用模拟AI服务');
      service = new MockAIService();
    }

    AIServiceFactory.instance = service;
    return service;
  }

  static getInstance(): AIService | null {
    return AIServiceFactory.instance;
  }

  static reset(): void {
    AIServiceFactory.instance = null;
  }
}

export { AIServiceFactory, MockAIService, OpenAIService };
export default AIServiceFactory;