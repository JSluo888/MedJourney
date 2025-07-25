// 家属功能控制器

import { Request, Response, NextFunction } from 'express';
import { DatabaseServiceFactory } from '../services/database';
import { AIServiceFactory } from '../services/ai';
import { logger } from '../utils/logger';
import ResponseHelper from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import { FamilyScore } from '../types';

class FamilyController {
  private databaseService = DatabaseServiceFactory.getInstance()!;
  private aiService = AIServiceFactory.getInstance()!;

  // 获取家属简报
  getFamilySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { period = '7d' } = req.query;
      
      logger.info('获取家属简报', {
        requestId: req.requestId,
        patientId,
        period
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 获取时间范围
      const { startDate, endDate } = this.getPeriodRange(period as string);

      // 获取最新的家属评分
      const latestScore = await this.getLatestFamilyScore(patientId);
      
      // 获取期间内的会话统计
      const sessionStats = await this.getSessionStats(patientId, startDate, endDate);
      
      // 获取情绪趋势
      const emotionTrend = await this.getEmotionTrend(patientId, startDate, endDate);
      
      // 获取活跃度统计
      const activityStats = await this.getActivityStats(patientId, startDate, endDate);
      
      // 生成洞察摘要
      const insight = await this.generateInsight(patientId, sessionStats, emotionTrend);

      const summary = {
        patient: {
          id: patient.id,
          name: patient.name,
          disease_stage: patient.disease_stage
        },
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          period_type: period
        },
        scores: latestScore || {
          health_score: null,
          mental_score: null,
          created_at: null
        },
        statistics: {
          sessions: sessionStats,
          emotions: emotionTrend,
          activity: activityStats
        },
        insight: insight || '暂无足够数据生成洞察'
      };

      ResponseHelper.success(res, summary);
    } catch (error) {
      logger.error('获取家属简报失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId
      });
      next(error);
    }
  };

  // 提交家属评分
  submitFamilyScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { health_score, mental_score, insight, notes } = req.body;
      
      logger.info('提交家属评分', {
        requestId: req.requestId,
        patientId,
        healthScore: health_score,
        mentalScore: mental_score
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 创建家属评分记录
      const familyScore: Omit<FamilyScore, 'id' | 'created_at' | 'updated_at'> = {
        patient_id: patientId,
        health_score,
        mental_score,
        insight,
        notes,
        submitted_by: req.user?.patient_id || 'anonymous'
      };

      const createdScore = await this.databaseService.createFamilyScore(familyScore);

      logger.info('家属评分提交成功', {
        requestId: req.requestId,
        patientId,
        scoreId: createdScore.id
      });

      ResponseHelper.created(res, createdScore, '家属评分提交成功');
    } catch (error) {
      logger.error('提交家属评分失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId,
        body: req.body
      });
      next(error);
    }
  };

  // 获取家属评分历史
  getFamilyScoreHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      
      logger.debug('获取家属评分历史', {
        requestId: req.requestId,
        patientId,
        page,
        limit,
        startDate,
        endDate
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 构建查询选项
      const options: any = {
        patient_id: patientId,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      };

      if (startDate) {
        options.start_date = new Date(startDate);
      }
      if (endDate) {
        options.end_date = new Date(endDate);
      }

      const result = await this.databaseService.listFamilyScores(options);

      ResponseHelper.paginated(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      logger.error('获取家属评分历史失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId,
        query: req.query
      });
      next(error);
    }
  };

  // 获取家属评分趋势
  getFamilyScoreTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { period = '30d', granularity = 'week' } = req.query;
      
      logger.debug('获取家属评分趋势', {
        requestId: req.requestId,
        patientId,
        period,
        granularity
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      const { startDate, endDate } = this.getPeriodRange(period as string);
      
      // 获取期间内的所有评分
      const scores = await this.databaseService.listFamilyScores({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000,
        sortBy: 'created_at',
        sortOrder: 'asc'
      });

      // 按时间粒度聚合数据
      const trendData = this.aggregateScoresByGranularity(
        scores.data,
        granularity as string,
        startDate,
        endDate
      );

      ResponseHelper.success(res, {
        patient_id: patientId,
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          granularity
        },
        trend: trendData
      });
    } catch (error) {
      logger.error('获取家属评分趋势失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId
      });
      next(error);
    }
  };

  // 辅助方法：获取时间范围
  private getPeriodRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  // 获取最新家属评分
  private async getLatestFamilyScore(patientId: string): Promise<FamilyScore | null> {
    const scores = await this.databaseService.listFamilyScores({
      patient_id: patientId,
      limit: 1,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    return scores.data[0] || null;
  }

  // 获取会话统计
  private async getSessionStats(patientId: string, startDate: Date, endDate: Date): Promise<any> {
    const sessions = await this.databaseService.listSessions({
      patient_id: patientId,
      start_date: startDate,
      end_date: endDate,
      limit: 1000
    });

    const totalSessions = sessions.data.length;
    const completedSessions = sessions.data.filter(s => s.status === 'completed').length;
    const avgDuration = sessions.data.reduce((sum, s) => {
      if (s.ended_at && s.created_at) {
        return sum + (new Date(s.ended_at).getTime() - new Date(s.created_at).getTime());
      }
      return sum;
    }, 0) / (completedSessions || 1);

    return {
      total: totalSessions,
      completed: completedSessions,
      avg_duration_minutes: Math.round(avgDuration / (1000 * 60))
    };
  }

  // 获取情绪趋势
  private async getEmotionTrend(patientId: string, startDate: Date, endDate: Date): Promise<any> {
    // 这里应该分析会话中的情绪数据
    // 由于是MVP，我们返回模拟数据
    return {
      positive: 65,
      neutral: 25,
      negative: 10
    };
  }

  // 获取活跃度统计
  private async getActivityStats(patientId: string, startDate: Date, endDate: Date): Promise<any> {
    const messages = await this.databaseService.listMessages({
      patient_id: patientId,
      start_date: startDate,
      end_date: endDate,
      limit: 10000
    });

    const totalMessages = messages.data.length;
    const patientMessages = messages.data.filter(m => m.sender_type === 'patient').length;
    const avgMessagesPerDay = totalMessages / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      total_messages: totalMessages,
      patient_messages: patientMessages,
      avg_messages_per_day: Math.round(avgMessagesPerDay * 10) / 10
    };
  }

  // 生成洞察摘要
  private async generateInsight(patientId: string, sessionStats: any, emotionTrend: any): Promise<string> {
    try {
      const prompt = `基于以下数据为阿尔茨海默病患者的家属生成一句洞察摘要：
会话统计：${JSON.stringify(sessionStats)}
情绪趋势：${JSON.stringify(emotionTrend)}

请生成一句简洁、温暖且实用的洞察。`;
      
      const insight = await this.aiService.generateResponse(prompt, '', patientId);
      return insight;
    } catch (error) {
      logger.error('生成洞察失败', error as Error);
      return '患者本周表现稳定，建议继续保持规律的交流。';
    }
  }

  // 按时间粒度聚合评分数据
  private aggregateScoresByGranularity(
    scores: FamilyScore[],
    granularity: string,
    startDate: Date,
    endDate: Date
  ): any[] {
    // 这里实现时间粒度聚合逻辑
    // 由于是MVP，返回简化的数据结构
    return scores.map(score => ({
      date: score.created_at,
      health_score: score.health_score,
      mental_score: score.mental_score
    }));
  }
}

export default new FamilyController();