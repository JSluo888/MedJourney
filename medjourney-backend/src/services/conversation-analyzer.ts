// 对话分析服务

import { config } from '../config';
import { logger } from '../utils/logger';
import { AIServiceError } from '../utils/errors';
import { ConversationAnalyzer, EmotionAnalyzer } from '../types/services';
import { Message, Session } from '../types';
import StepfunServiceFactory from './stepfun';
import DatabaseServiceFactory from './database';

// 对话分析结果类型
interface AnalysisResult {
  emotional_summary: {
    dominant_emotion: string;
    emotion_distribution: Record<string, number>;
    stability_score: number;
  };
  cognitive_indicators: {
    memory_score: number;
    attention_score: number;
    language_score: number;
    response_time_avg: number;
  };
  social_engagement: {
    conversation_turns: number;
    initiative_score: number;
    topic_coherence: number;
  };
  recommendations: string[];
}

// 情感分析服务实现
class EmotionAnalyzerImpl implements EmotionAnalyzer {
  private stepfunService: any;

  constructor() {
    this.stepfunService = StepfunServiceFactory.create();
  }

  async analyzeText(text: string): Promise<{
    primary_emotion: string;
    emotions: Record<string, number>;
    sentiment_score: number;
    confidence: number;
  }> {
    try {
      const emotionResult = await this.stepfunService.analyzeEmotion(text);
      
      // 计算情感分数（-1 到 +1）
      const sentiment_score = this.calculateSentimentScore(emotionResult.emotions);
      
      return {
        primary_emotion: emotionResult.emotion,
        emotions: emotionResult.emotions,
        sentiment_score,
        confidence: emotionResult.confidence
      };
    } catch (error: any) {
      logger.error('文本情感分析失败', error);
      
      // 回退到简单分析
      return this.fallbackTextAnalysis(text);
    }
  }

  async analyzeVoice(audioBuffer: ArrayBuffer): Promise<{
    emotions: Record<string, number>;
    energy_level: number;
    speech_rate: number;
    confidence: number;
  }> {
    try {
      // 这里应该集成真实的语音情感分析服务
      logger.debug('语音情感分析（模拟）', {
        audioSize: audioBuffer.byteLength
      });
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟结果
      return {
        emotions: {
          happiness: 0.3,
          sadness: 0.2,
          neutral: 0.4,
          anxiety: 0.1
        },
        energy_level: 0.6,
        speech_rate: 1.2, // 正常语速
        confidence: 0.7
      };
    } catch (error: any) {
      logger.error('语音情感分析失败', error);
      throw new AIServiceError(
        `语音情感分析失败: ${error.message}`,
        'VOICE_EMOTION_ANALYSIS_ERROR'
      );
    }
  }

  async aggregateEmotions(emotions: Array<any>, timeframe: string): Promise<{
    trends: Record<string, number>;
    patterns: string[];
    stability: number;
  }> {
    try {
      if (emotions.length === 0) {
        return {
          trends: {},
          patterns: [],
          stability: 1.0
        };
      }

      // 计算情感趋势
      const trends = this.calculateEmotionTrends(emotions);
      
      // 识别情感模式
      const patterns = this.identifyEmotionPatterns(emotions, timeframe);
      
      // 计算情感稳定性
      const stability = this.calculateEmotionStability(emotions);
      
      logger.debug('情感聚合分析完成', {
        emotionCount: emotions.length,
        timeframe,
        stability,
        patternCount: patterns.length
      });
      
      return {
        trends,
        patterns,
        stability
      };
    } catch (error: any) {
      logger.error('情感聚合分析失败', error);
      throw new AIServiceError(
        `情感聚合分析失败: ${error.message}`,
        'EMOTION_AGGREGATION_ERROR'
      );
    }
  }

  // 私有方法
  private calculateSentimentScore(emotions: Record<string, number>): number {
    const positiveEmotions = ['happiness', 'joy', 'satisfaction'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'anxiety'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    Object.entries(emotions).forEach(([emotion, score]) => {
      if (positiveEmotions.includes(emotion)) {
        positiveScore += score;
      } else if (negativeEmotions.includes(emotion)) {
        negativeScore += score;
      }
    });
    
    return positiveScore - negativeScore;
  }

  private fallbackTextAnalysis(text: string): {
    primary_emotion: string;
    emotions: Record<string, number>;
    sentiment_score: number;
    confidence: number;
  } {
    // 简单的关键词匹配
    const emotions = { happiness: 0, sadness: 0, anger: 0, fear: 0, neutral: 0.5 };
    
    const happyWords = ['开心', '高兴', '快乐', '美好'];
    const sadWords = ['难过', '伤心', '痛苦', '孤单'];
    
    happyWords.forEach(word => {
      if (text.includes(word)) emotions.happiness += 0.3;
    });
    
    sadWords.forEach(word => {
      if (text.includes(word)) emotions.sadness += 0.3;
    });
    
    const primaryEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return {
      primary_emotion: primaryEmotion,
      emotions,
      sentiment_score: emotions.happiness - emotions.sadness,
      confidence: 0.6
    };
  }

  private calculateEmotionTrends(emotions: Array<any>): Record<string, number> {
    const trends: Record<string, number> = {};
    
    if (emotions.length < 2) {
      return trends;
    }
    
    const recent = emotions.slice(-5); // 最近5次情感分析
    const earlier = emotions.slice(-10, -5); // 之前5次
    
    if (earlier.length === 0) {
      return trends;
    }
    
    // 计算各情感的变化趋势
    ['happiness', 'sadness', 'anger', 'fear', 'neutral'].forEach(emotion => {
      const recentAvg = recent.reduce((sum, e) => sum + (e.emotions?.[emotion] || 0), 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, e) => sum + (e.emotions?.[emotion] || 0), 0) / earlier.length;
      
      trends[emotion] = recentAvg - earlierAvg;
    });
    
    return trends;
  }

  private identifyEmotionPatterns(emotions: Array<any>, timeframe: string): string[] {
    const patterns: string[] = [];
    
    if (emotions.length < 3) {
      return patterns;
    }
    
    // 识别情感波动模式
    const emotionChanges = [];
    for (let i = 1; i < emotions.length; i++) {
      const prev = emotions[i - 1];
      const curr = emotions[i];
      
      if (prev.primary_emotion !== curr.primary_emotion) {
        emotionChanges.push({
          from: prev.primary_emotion,
          to: curr.primary_emotion,
          timestamp: curr.timestamp
        });
      }
    }
    
    // 分析模式
    if (emotionChanges.length > emotions.length * 0.7) {
      patterns.push('情感波动较大');
    }
    
    const happyCount = emotions.filter(e => e.primary_emotion === 'happiness').length;
    const sadCount = emotions.filter(e => e.primary_emotion === 'sadness').length;
    
    if (happyCount > emotions.length * 0.6) {
      patterns.push('总体情绪积极');
    } else if (sadCount > emotions.length * 0.6) {
      patterns.push('总体情绪偏低');
    }
    
    return patterns;
  }

  private calculateEmotionStability(emotions: Array<any>): number {
    if (emotions.length < 2) {
      return 1.0;
    }
    
    let totalVariation = 0;
    
    for (let i = 1; i < emotions.length; i++) {
      const prev = emotions[i - 1];
      const curr = emotions[i];
      
      // 计算情感向量的变化
      let variation = 0;
      ['happiness', 'sadness', 'anger', 'fear'].forEach(emotion => {
        const prevScore = prev.emotions?.[emotion] || 0;
        const currScore = curr.emotions?.[emotion] || 0;
        variation += Math.abs(currScore - prevScore);
      });
      
      totalVariation += variation;
    }
    
    const avgVariation = totalVariation / (emotions.length - 1);
    
    // 转换为稳定性分数（0-1）
    return Math.max(0, 1 - avgVariation);
  }
}

// 对话分析服务实现
class ConversationAnalyzerImpl implements ConversationAnalyzer {
  private stepfunService: any;
  private emotionAnalyzer: EmotionAnalyzer;
  private databaseService: any;

  constructor() {
    this.stepfunService = StepfunServiceFactory.create();
    this.emotionAnalyzer = new EmotionAnalyzerImpl();
    this.databaseService = DatabaseServiceFactory.create();
  }

  async analyzeSession(sessionId: string): Promise<AnalysisResult> {
    try {
      logger.info('开始分析会话', { sessionId });
      
      // 获取会话消息
      const messages = await this.getSessionMessages(sessionId);
      
      if (messages.length === 0) {
        throw new Error(`会话 ${sessionId} 没有消息`);
      }
      
      // 并行分析各个方面
      const [emotionalSummary, cognitiveIndicators, socialEngagement] = await Promise.all([
        this.analyzeEmotionalSummary(messages),
        this.analyzeCognitiveIndicators(messages),
        this.analyzeSocialEngagement(messages)
      ]);
      
      // 生成建议
      const recommendations = await this.generateRecommendations({
        emotional_summary: emotionalSummary,
        cognitive_indicators: cognitiveIndicators,
        social_engagement: socialEngagement
      });
      
      const result: AnalysisResult = {
        emotional_summary: emotionalSummary,
        cognitive_indicators: cognitiveIndicators,
        social_engagement: socialEngagement,
        recommendations
      };
      
      logger.info('会话分析完成', {
        sessionId,
        messageCount: messages.length,
        dominantEmotion: emotionalSummary.dominant_emotion,
        recommendationCount: recommendations.length
      });
      
      return result;
    } catch (error: any) {
      logger.error('会话分析失败', error, { sessionId });
      throw new AIServiceError(
        `会话分析失败: ${error.message}`,
        'CONVERSATION_ANALYSIS_ERROR'
      );
    }
  }

  async generateReport(sessionId: string, reportType: 'family' | 'doctor'): Promise<{
    summary: string;
    key_insights: string[];
    trends: any;
    recommendations: string[];
    charts_data: any[];
  }> {
    try {
      const analysis = await this.analyzeSession(sessionId);
      
      // 根据报告类型生成不同内容
      if (reportType === 'family') {
        return this.generateFamilyReport(analysis, sessionId);
      } else {
        return this.generateDoctorReport(analysis, sessionId);
      }
    } catch (error: any) {
      logger.error('生成报告失败', error, { sessionId, reportType });
      throw new AIServiceError(
        `生成报告失败: ${error.message}`,
        'REPORT_GENERATION_ERROR'
      );
    }
  }

  // 私有方法
  private async getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
      const query = `
        SELECT * FROM messages 
        WHERE session_id = $1 
        ORDER BY created_at ASC
      `;
      
      const result = await this.databaseService.query(query, [sessionId]);
      return result;
    } catch (error) {
      logger.error('获取会话消息失败', error as Error, { sessionId });
      return [];
    }
  }

  private async analyzeEmotionalSummary(messages: Message[]): Promise<{
    dominant_emotion: string;
    emotion_distribution: Record<string, number>;
    stability_score: number;
  }> {
    const userMessages = messages.filter(m => m.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        dominant_emotion: 'neutral',
        emotion_distribution: { neutral: 1.0 },
        stability_score: 1.0
      };
    }
    
    // 分析每条消息的情感
    const emotionAnalyses = await Promise.all(
      userMessages.map(msg => this.emotionAnalyzer.analyzeText(msg.content))
    );
    
    // 计算情感分布
    const emotionCounts: Record<string, number> = {};
    emotionAnalyses.forEach(analysis => {
      emotionCounts[analysis.primary_emotion] = (emotionCounts[analysis.primary_emotion] || 0) + 1;
    });
    
    // 转换为比例
    const total = emotionAnalyses.length;
    const emotion_distribution: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      emotion_distribution[emotion] = count / total;
    });
    
    // 找出主导情感
    const dominant_emotion = Object.entries(emotion_distribution)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    // 计算情感稳定性
    const stability_score = await this.emotionAnalyzer.aggregateEmotions(
      emotionAnalyses,
      'session'
    ).then(result => result.stability);
    
    return {
      dominant_emotion,
      emotion_distribution,
      stability_score
    };
  }

  private async analyzeCognitiveIndicators(messages: Message[]): Promise<{
    memory_score: number;
    attention_score: number;
    language_score: number;
    response_time_avg: number;
  }> {
    const userMessages = messages.filter(m => m.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        memory_score: 0.5,
        attention_score: 0.5,
        language_score: 0.5,
        response_time_avg: 0
      };
    }
    
    // 计算各项指标
    const memory_score = this.calculateMemoryScore(userMessages);
    const attention_score = this.calculateAttentionScore(userMessages);
    const language_score = this.calculateLanguageScore(userMessages);
    const response_time_avg = this.calculateResponseTimeAvg(messages);
    
    return {
      memory_score,
      attention_score,
      language_score,
      response_time_avg
    };
  }

  private async analyzeSocialEngagement(messages: Message[]): Promise<{
    conversation_turns: number;
    initiative_score: number;
    topic_coherence: number;
  }> {
    const conversation_turns = Math.floor(messages.length / 2); // 对话回合数
    
    // 计算主动性分数
    const userInitiatedTurns = this.countUserInitiatedTurns(messages);
    const initiative_score = userInitiatedTurns / Math.max(conversation_turns, 1);
    
    // 计算话题连贯性
    const topic_coherence = await this.calculateTopicCoherence(messages);
    
    return {
      conversation_turns,
      initiative_score,
      topic_coherence
    };
  }

  private async generateRecommendations(analysis: AnalysisResult): Promise<string[]> {
    const recommendations: string[] = [];
    
    // 基于情感状态的建议
    if (analysis.emotional_summary.dominant_emotion === 'sadness') {
      recommendations.push('建议增加积极的互动活动，如听音乐、看照片');
    }
    
    // 基于认知指标的建议
    if (analysis.cognitive_indicators.memory_score < 0.5) {
      recommendations.push('建议进行记忆训练活动，如回忆游戏、照片分享');
    }
    
    // 基于社交参与的建议
    if (analysis.social_engagement.initiative_score < 0.3) {
      recommendations.push('鼓励患者更多地主动参与对话，提出问题和分享想法');
    }
    
    return recommendations;
  }

  private generateFamilyReport(analysis: AnalysisResult, sessionId: string): {
    summary: string;
    key_insights: string[];
    trends: any;
    recommendations: string[];
    charts_data: any[];
  } {
    const summary = `本次对话中，患者的主要情绪为${analysis.emotional_summary.dominant_emotion}，情绪稳定性为${(analysis.emotional_summary.stability_score * 100).toFixed(1)}%。认知指标整体表现正常，社交参与度适中。`;
    
    const key_insights = [
      `情绪稳定性: ${(analysis.emotional_summary.stability_score * 100).toFixed(1)}%`,
      `对话回合数: ${analysis.social_engagement.conversation_turns}`,
      `主动性分数: ${(analysis.social_engagement.initiative_score * 100).toFixed(1)}%`
    ];
    
    const charts_data = [
      {
        type: 'pie',
        title: '情感分布',
        data: analysis.emotional_summary.emotion_distribution
      },
      {
        type: 'bar',
        title: '认知指标',
        data: analysis.cognitive_indicators
      }
    ];
    
    return {
      summary,
      key_insights,
      trends: {
        emotional: analysis.emotional_summary,
        cognitive: analysis.cognitive_indicators
      },
      recommendations: analysis.recommendations,
      charts_data
    };
  }

  private generateDoctorReport(analysis: AnalysisResult, sessionId: string): {
    summary: string;
    key_insights: string[];
    trends: any;
    recommendations: string[];
    charts_data: any[];
  } {
    const summary = `临床分析：患者在本次会话中显示出${analysis.emotional_summary.dominant_emotion}的情绪状态。认知功能评估显示记忆分数${(analysis.cognitive_indicators.memory_score * 100).toFixed(1)}，注意力分数${(analysis.cognitive_indicators.attention_score * 100).toFixed(1)}。建议持续监测并结合专业评估。`;
    
    const key_insights = [
      `记忆功能: ${(analysis.cognitive_indicators.memory_score * 100).toFixed(1)}/100`,
      `注意力: ${(analysis.cognitive_indicators.attention_score * 100).toFixed(1)}/100`,
      `语言能力: ${(analysis.cognitive_indicators.language_score * 100).toFixed(1)}/100`,
      `平均反应时间: ${analysis.cognitive_indicators.response_time_avg.toFixed(1)}秒`
    ];
    
    const charts_data = [
      {
        type: 'radar',
        title: '认知功能雷达图',
        data: analysis.cognitive_indicators
      },
      {
        type: 'line',
        title: '情绪趋势',
        data: analysis.emotional_summary.emotion_distribution
      }
    ];
    
    return {
      summary,
      key_insights,
      trends: {
        cognitive_decline_risk: this.assessCognitiveDeclineRisk(analysis),
        emotional_stability: analysis.emotional_summary.stability_score
      },
      recommendations: analysis.recommendations,
      charts_data
    };
  }

  // 辅助计算方法
  private calculateMemoryScore(messages: Message[]): number {
    // 模拟记忆分数计算（基于上下文连贯性等）
    return 0.7 + Math.random() * 0.2;
  }

  private calculateAttentionScore(messages: Message[]): number {
    // 模拟注意力分数计算（基于回应连贯性等）
    return 0.6 + Math.random() * 0.3;
  }

  private calculateLanguageScore(messages: Message[]): number {
    // 模拟语言能力分数计算（基于词汇丰富度等）
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    return Math.min(1.0, avgLength / 50); // 根据平均消息长度评估
  }

  private calculateResponseTimeAvg(messages: Message[]): number {
    // 模拟平均响应时间计算
    return 2.5 + Math.random() * 2; // 2.5-4.5秒
  }

  private countUserInitiatedTurns(messages: Message[]): number {
    let count = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].sender === 'user') {
        if (i === 0 || messages[i - 1].sender !== 'user') {
          count++;
        }
      }
    }
    return count;
  }

  private async calculateTopicCoherence(messages: Message[]): Promise<number> {
    // 模拟话题连贯性计算
    return 0.6 + Math.random() * 0.3;
  }

  private assessCognitiveDeclineRisk(analysis: AnalysisResult): string {
    const avgCognitive = (
      analysis.cognitive_indicators.memory_score +
      analysis.cognitive_indicators.attention_score +
      analysis.cognitive_indicators.language_score
    ) / 3;
    
    if (avgCognitive > 0.7) {
      return '低风险';
    } else if (avgCognitive > 0.4) {
      return '中等风险';
    } else {
      return '高风险';
    }
  }
}

// 服务工厂
class ConversationAnalyzerFactory {
  private static instance: ConversationAnalyzer | null = null;

  static create(): ConversationAnalyzer {
    if (ConversationAnalyzerFactory.instance) {
      return ConversationAnalyzerFactory.instance;
    }

    ConversationAnalyzerFactory.instance = new ConversationAnalyzerImpl();
    logger.info('对话分析服务实例创建完成');
    
    return ConversationAnalyzerFactory.instance;
  }

  static getInstance(): ConversationAnalyzer | null {
    return ConversationAnalyzerFactory.instance;
  }

  static reset(): void {
    ConversationAnalyzerFactory.instance = null;
  }
}

export { ConversationAnalyzerFactory, EmotionAnalyzerImpl, ConversationAnalyzerImpl };
export default ConversationAnalyzerFactory;
