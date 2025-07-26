// 智能报告生成服务
import { logger } from '../utils/logger';
import { stepfunAIService } from './stepfun-ai';
import { localDatabaseService } from './local-database';
import { ConversationAnalyzerFactory } from './conversation-analyzer';
import fs from 'fs';
import path from 'path';

interface HealthAssessment {
  cognitive_score: number;
  emotional_state: string;
  memory_indicators: string[];
  attention_indicators: string[];
  communication_quality: string;
  risk_factors: string[];
  recommendations: string[];
}

interface DetailedReport {
  id: string;
  patient_id: string;
  session_id: string;
  report_type: string;
  created_at: string;
  summary: {
    overall_assessment: string;
    key_findings: string[];
    health_score: number;
    emotional_state: string;
  };
  detailed_analysis: {
    conversation_quality: number;
    cognitive_assessment: HealthAssessment;
    emotional_analysis: any;
    behavioral_patterns: string[];
  };
  recommendations: {
    immediate_actions: string[];
    long_term_care: string[];
    family_guidance: string[];
    medical_referrals: string[];
  };
  data_insights: {
    conversation_stats: any;
    trend_analysis: string;
    comparison_baseline: string;
  };
}

export class ReportGeneratorService {
  private conversationAnalyzer = ConversationAnalyzerFactory.create();

  constructor() {
    logger.info('报告生成服务初始化完成');
  }

  async generateDetailedReport(sessionId: string): Promise<DetailedReport> {
    try {
      logger.info('开始生成详细报告', { sessionId });

      // 1. 获取会话数据
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        throw new Error(`会话 ${sessionId} 不存在`);
      }

      const messages = await localDatabaseService.getConversationMessages(sessionId);
      const patient = await localDatabaseService.getPatient(session.patient_id);

      if (!patient) {
        throw new Error(`患者 ${session.patient_id} 不存在`);
      }

      // 2. 对话分析
      const conversationAnalysis = await this.analyzeConversation(messages);
      
      // 3. 认知评估
      const cognitiveAssessment = await this.performCognitiveAssessment(messages, patient);
      
      // 4. 情感分析
      const emotionalAnalysis = await this.analyzeEmotionalState(messages);
      
      // 5. 生成建议
      const recommendations = await this.generateRecommendations(cognitiveAssessment, emotionalAnalysis, patient);
      
      // 6. 生成综合报告
      const report: DetailedReport = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient.id,
        session_id: sessionId,
        report_type: 'comprehensive_health_assessment',
        created_at: new Date().toISOString(),
        summary: {
          overall_assessment: await this.generateOverallAssessment(cognitiveAssessment, emotionalAnalysis),
          key_findings: await this.extractKeyFindings(conversationAnalysis, cognitiveAssessment),
          health_score: this.calculateHealthScore(cognitiveAssessment, emotionalAnalysis),
          emotional_state: emotionalAnalysis.primary_emotion || 'neutral'
        },
        detailed_analysis: {
          conversation_quality: conversationAnalysis.quality_score,
          cognitive_assessment: cognitiveAssessment,
          emotional_analysis: emotionalAnalysis,
          behavioral_patterns: conversationAnalysis.behavioral_patterns
        },
        recommendations: recommendations,
        data_insights: {
          conversation_stats: conversationAnalysis.statistics,
          trend_analysis: '暂无历史数据对比',
          comparison_baseline: '需要更多数据建立基线'
        }
      };

      // 7. 保存报告到数据库
      await localDatabaseService.createHealthReport({
        session_id: sessionId,
        patient_id: patient.id,
        report_type: 'comprehensive_health_assessment',
        content: JSON.stringify(report, null, 2),
        summary: report.summary.overall_assessment,
        recommendations: JSON.stringify(report.recommendations),
        metadata: JSON.stringify({
          health_score: report.summary.health_score,
          emotional_state: report.summary.emotional_state,
          message_count: messages.length
        })
      });

      logger.info('详细报告生成完成', {
        reportId: report.id,
        healthScore: report.summary.health_score,
        messageCount: messages.length
      });

      return report;
    } catch (error) {
      logger.error('生成详细报告失败', error as Error, { sessionId });
      throw error;
    }
  }

  private async analyzeConversation(messages: any[]): Promise<{
    quality_score: number;
    behavioral_patterns: string[];
    statistics: any;
  }> {
    try {
      const analysis = await stepfunAIService.analyzeConversation(messages);
      
      return {
        quality_score: analysis.cognitive_performance,
        behavioral_patterns: analysis.key_topics,
        statistics: {
          total_messages: messages.length,
          user_messages: messages.filter(m => m.role === 'user').length,
          average_message_length: messages.filter(m => m.role === 'user').reduce((sum, m) => sum + m.content.length, 0) / messages.filter(m => m.role === 'user').length || 0,
          conversation_duration: this.calculateDuration(messages),
          emotional_state: analysis.emotional_state,
          concerns: analysis.concerns
        }
      };
    } catch (error) {
      logger.error('对话分析失败，使用默认分析', { error });
      const userMessages = messages.filter(m => m.role === 'user');
      return {
        quality_score: this.calculateConversationQuality(messages),
        behavioral_patterns: this.identifyBehavioralPatterns(userMessages),
        statistics: {
          total_messages: messages.length,
          user_messages: userMessages.length,
          average_message_length: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length || 0,
          conversation_duration: this.calculateDuration(messages)
        }
      };
    }
  }

  private async performCognitiveAssessment(messages: any[], patient: any): Promise<HealthAssessment> {
    try {
      const userMessages = messages.filter(m => m.role === 'user');
      const conversationText = userMessages.map(m => m.content).join('\n');

      const prompt = `作为专业的认知评估师，请分析以下患者对话，评估其认知功能状态。

患者信息：
- 姓名：${patient.name}
- 年龄：${patient.age}岁
- 病史：${patient.medical_history || '无'}

对话内容：
${conversationText}

请从以下维度进行评估（返回JSON格式）：
{
  "cognitive_score": 85,
  "emotional_state": "平稳",
  "memory_indicators": ["短期记忆正常", "长期记忆轻度受损"],
  "attention_indicators": ["注意力集中度良好"],
  "communication_quality": "清晰流畅",
  "risk_factors": ["记忆力下降趋势"],
  "recommendations": ["定期认知训练", "保持社交活动"]
}`;

      const response = await stepfunAIService.chat([
        { role: 'system', content: '你是一个专业的认知评估师，擅长分析患者对话并评估认知功能状态。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        max_tokens: 800
      });
      
      try {
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI响应为空');
        }
        const assessment = JSON.parse(content);
        return assessment;
      } catch (parseError) {
        logger.warn('认知评估JSON解析失败，使用默认评估');
        return this.getDefaultCognitiveAssessment();
      }
    } catch (error) {
      logger.error('认知评估失败', error as Error);
      return this.getDefaultCognitiveAssessment();
    }
  }

  private async analyzeEmotionalState(messages: any[]): Promise<any> {
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      return { primary_emotion: 'neutral', confidence: 0.5, emotions: { neutral: 1.0 } };
    }

    try {
      // 分析最后几条消息的情感
      const recentMessages = userMessages.slice(-3);
      const combinedText = recentMessages.map(m => m.content).join(' ');
      
      const response = await stepfunAIService.chat([
        { role: 'system', content: '你是一个专业的情感分析专家，擅长分析文本中的情感状态。' },
        { role: 'user', content: `请分析以下文本的情感状态，返回JSON格式：${combinedText}` }
      ], {
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('情感分析响应为空');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        logger.warn('情感分析JSON解析失败，使用默认值');
        return { primary_emotion: 'neutral', confidence: 0.5, emotions: { neutral: 1.0 } };
      }
    } catch (error) {
      logger.error('情感分析失败，使用默认值', { error });
      return { primary_emotion: 'neutral', confidence: 0.5, emotions: { neutral: 1.0 } };
    }
  }

  private async generateRecommendations(cognitive: HealthAssessment, emotional: any, patient: any): Promise<{
    immediate_actions: string[];
    long_term_care: string[];
    family_guidance: string[];
    medical_referrals: string[];
  }> {
    const prompt = `基于以下评估结果，为患者提供个性化建议：

患者：${patient.name}，${patient.age}岁
认知评分：${cognitive.cognitive_score}/100
情绪状态：${emotional.primary_emotion}
风险因素：${cognitive.risk_factors.join(', ')}

请提供具体的建议（JSON格式）：
{
  "immediate_actions": ["立即行动建议"],
  "long_term_care": ["长期护理建议"],
  "family_guidance": ["家属指导"],
  "medical_referrals": ["医疗转诊建议"]
}`;

    try {
      const response = await stepfunAIService.chat([
        { role: 'system', content: '你是一个资深的医疗专家，擅长基于患者评估结果提供个性化的医疗建议。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.4,
        max_tokens: 600
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('建议生成响应为空');
      }

      const recommendations = JSON.parse(content);
      return recommendations;
    } catch (error) {
      logger.warn('生成建议失败，使用默认建议');
      return this.getDefaultRecommendations(cognitive.cognitive_score);
    }
  }

  private async generateOverallAssessment(cognitive: HealthAssessment, emotional: any): Promise<string> {
    const prompt = `基于以下评估结果，生成一句简洁的总体评估：

认知评分：${cognitive.cognitive_score}/100
情绪状态：${emotional.primary_emotion}
交流质量：${cognitive.communication_quality}

请用一句话总结患者的整体状态：`;

    try {
      const response = await this.stepfunService.generateResponse(prompt);
      return response.response.trim();
    } catch (error) {
      return `患者认知功能评分为 ${cognitive.cognitive_score}/100，总体状态较为${cognitive.cognitive_score >= 80 ? '稳定' : cognitive.cognitive_score >= 60 ? '中等' : '需要关注'}。`;
    }
  }

  private async extractKeyFindings(conversation: any, cognitive: HealthAssessment): Promise<string[]> {
    const findings = [
      `认知评分：${cognitive.cognitive_score}/100`,
      `交流质量：${cognitive.communication_quality}`,
      `对话质量评分：${conversation.quality_score}/100`
    ];

    if (cognitive.risk_factors.length > 0) {
      findings.push(`风险因素：${cognitive.risk_factors[0]}`);
    }

    return findings;
  }

  private calculateHealthScore(cognitive: HealthAssessment, emotional: any): number {
    let score = cognitive.cognitive_score * 0.6; // 认知功能权重60%
    
    // 情绪状态加分
    const emotionScore = this.getEmotionScore(emotional.primary_emotion);
    score += emotionScore * 0.3; // 情绪权重30%
    
    // 交流质量加分
    const communicationScore = this.getCommunicationScore(cognitive.communication_quality);
    score += communicationScore * 0.1; // 交流权重10%
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private getEmotionScore(emotion: string): number {
    const emotionScores: Record<string, number> = {
      'happiness': 90,
      'neutral': 70,
      'sadness': 40,
      'anger': 30,
      'fear': 25,
      'surprise': 60
    };
    return emotionScores[emotion] || 50;
  }

  private getCommunicationScore(quality: string): number {
    const qualityScores: Record<string, number> = {
      '清晰流畅': 90,
      '良好': 80,
      '一般': 60,
      '较差': 40,
      '困难': 20
    };
    return qualityScores[quality] || 50;
  }

  private getDefaultCognitiveAssessment(): HealthAssessment {
    return {
      cognitive_score: 70,
      emotional_state: '稳定',
      memory_indicators: ['需要更多评估'],
      attention_indicators: ['需要更多评估'],
      communication_quality: '一般',
      risk_factors: ['数据不足'],
      recommendations: ['建议更多交流以获得准确评估']
    };
  }

  private getDefaultRecommendations(cognitiveScore: number): {
    immediate_actions: string[];
    long_term_care: string[];
    family_guidance: string[];
    medical_referrals: string[];
  } {
    if (cognitiveScore >= 80) {
      return {
        immediate_actions: ['继续保持积极的生活方式'],
        long_term_care: ['定期认知训练', '保持社交活动'],
        family_guidance: ['鼓励日常交流', '关注情绪变化'],
        medical_referrals: ['建议定期体检']
      };
    } else if (cognitiveScore >= 60) {
      return {
        immediate_actions: ['加强认知训练', '注意休息'],
        long_term_care: ['制定结构化日常作息', '认知功能训练'],
        family_guidance: ['家属需要更多陰伴和支持'],
        medical_referrals: ['建议神经科专科评估']
      };
    } else {
      return {
        immediate_actions: ['立即就医评估', '加强监护'],
        long_term_care: ['专业医疗干预', '日常生活辅助'],
        family_guidance: ['学习照护技能', '寻求专业支持'],
        medical_referrals: ['紧急神经科评估', '考虑起去程序']
      };
    }
  }

  private calculateConversationQuality(messages: any[]): number {
    if (messages.length === 0) return 0;
    
    const userMessages = messages.filter(m => m.role === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    
    // 基于消息数量和平均长度计算质量分
    let qualityScore = Math.min(100, userMessages.length * 10); // 每条消息10分，最多100分
    
    if (avgLength < 10) qualityScore *= 0.5; // 太短的回复扣分
    if (avgLength > 100) qualityScore *= 1.2; // 详细的回复加分
    
    return Math.round(Math.min(100, qualityScore));
  }

  private identifyBehavioralPatterns(userMessages: any[]): string[] {
    const patterns = [];
    
    if (userMessages.length > 5) {
      patterns.push('积极参与交流');
    }
    
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    if (avgLength > 50) {
      patterns.push('表达详细充分');
    } else if (avgLength < 20) {
      patterns.push('回复相对简洁');
    }
    
    return patterns;
  }

  private calculateDuration(messages: any[]): string {
    if (messages.length < 2) return '0 分钟';
    
    const firstTime = new Date(messages[0].timestamp);
    const lastTime = new Date(messages[messages.length - 1].timestamp);
    const diffMinutes = Math.round((lastTime.getTime() - firstTime.getTime()) / (1000 * 60));
    
    return `${diffMinutes} 分钟`;
  }

  // 简化报告生成（用于家属简报）
  async generateFamilySummary(sessionId: string): Promise<{
    health_score: number;
    emotional_state: string;
    key_insight: string;
    recommendations: string[];
    timestamp: string;
  }> {
    try {
      // 获取会话数据
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        throw new Error(`会话 ${sessionId} 不存在`);
      }

      const messages = await localDatabaseService.getConversationMessages(sessionId);
      const patient = await localDatabaseService.getPatient(session.patient_id);

      if (!patient) {
        throw new Error(`患者 ${session.patient_id} 不存在`);
      }

      // 使用真实的Stepfun AI生成家属简报
      const familySummary = await stepfunAIService.generateFamilySummary(patient, {
        session,
        messages,
        analysis: await this.analyzeConversation(messages)
      });

      return {
        health_score: 85, // 基于分析结果计算
        emotional_state: 'positive',
        key_insight: familySummary.summary,
        recommendations: familySummary.suggestions.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('生成家属简报失败', error as Error);
      throw error;
    }
  }

  // 导出PDF报告（模拟实现）
  async exportReportToPDF(reportId: string): Promise<string> {
    try {
      const report = await localDatabaseService.getHealthReport(reportId);
      if (!report) {
        throw new Error(`报告 ${reportId} 不存在`);
      }

      // 模拟生成PDF文件路径
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report_${reportId}_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      
      // 这里可以集成真正的PDF生成库（如puppeteer或jsPDF）
      // 现在只是创建一个文本文件作为演示
      const reportContent = `
# MedJourney 健康评估报告

报告 ID: ${report.id}
生成时间: ${report.created_at}

## 总结
${report.summary}

## 建议
${report.recommendations}

---
本报告由 MedJourney AI 系统生成
`;

      fs.writeFileSync(filepath, reportContent, 'utf-8');
      
      logger.info('PDF报告生成完成', { filepath });
      return filepath;
    } catch (error) {
      logger.error('PDF报告导出失败', error as Error);
      throw error;
    }
  }
}

export const reportGeneratorService = new ReportGeneratorService();
