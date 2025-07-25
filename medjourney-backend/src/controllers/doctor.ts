// 医生功能控制器

import { Request, Response, NextFunction } from 'express';
import { DatabaseServiceFactory } from '../services/database';
import { AIServiceFactory } from '../services/ai';
import { logger } from '../utils/logger';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { DoctorReport } from '../types';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

class DoctorController {
  private databaseService = DatabaseServiceFactory.getInstance()!;
  private aiService = AIServiceFactory.getInstance()!;

  // 获取医生仪表板
  getDoctorDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.q as string;
      const status = req.query.status as string;
      
      logger.info('获取医生仪表板', {
        requestId: req.requestId,
        page,
        limit,
        search,
        status
      });

      // 获取患者列表
      const patientsOptions: any = {
        page,
        limit,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      };

      if (search) {
        patientsOptions.search = search;
      }

      const patients = await this.databaseService.listPatients(patientsOptions);

      // 为每个患者获取最新会话信息
      const patientsWithSessions = await Promise.all(
        patients.data.map(async (patient) => {
          const recentSessions = await this.databaseService.listSessions({
            patient_id: patient.id,
            limit: 1,
            sortBy: 'created_at',
            sortOrder: 'desc'
          });

          const latestScore = await this.getLatestFamilyScore(patient.id);

          return {
            ...patient,
            latest_session: recentSessions.data[0] || null,
            latest_score: latestScore
          };
        })
      );

      // 获取统计数据
      const stats = await this.getDashboardStats();

      ResponseHelper.success(res, {
        patients: patientsWithSessions,
        pagination: {
          page,
          limit,
          total: patients.total,
          totalPages: Math.ceil(patients.total / limit)
        },
        statistics: stats
      });
    } catch (error) {
      logger.error('获取医生仪表板失败', error as Error, {
        requestId: req.requestId,
        query: req.query
      });
      next(error);
    }
  };

  // 获取患者详细报告
  getPatientReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { period = '30d' } = req.query;
      
      logger.info('获取患者详细报告', {
        requestId: req.requestId,
        patientId,
        period
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      const { startDate, endDate } = this.getPeriodRange(period as string);

      // 获取会话数据
      const sessions = await this.databaseService.listSessions({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // 获取消息数据
      const messages = await this.databaseService.listMessages({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 5000,
        sortBy: 'created_at',
        sortOrder: 'asc'
      });

      // 获取家属评分数据
      const familyScores = await this.databaseService.listFamilyScores({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000,
        sortBy: 'created_at',
        sortOrder: 'asc'
      });

      // 分析数据
      const analysis = await this.analyzePatientData(patient, sessions.data, messages.data, familyScores.data);

      // 生成医学洞察
      const insights = await this.generateMedicalInsights(patient, analysis);

      const report = {
        patient,
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          period_type: period
        },
        summary: {
          total_sessions: sessions.data.length,
          total_messages: messages.data.length,
          total_family_scores: familyScores.data.length,
          avg_session_duration: this.calculateAvgSessionDuration(sessions.data),
          activity_level: this.calculateActivityLevel(messages.data, startDate, endDate)
        },
        analysis,
        insights,
        data: {
          sessions: sessions.data.slice(0, 10), // 最近10个会话
          recent_messages: messages.data.slice(-50), // 最近50条消息
          family_scores: familyScores.data
        }
      };

      ResponseHelper.success(res, report);
    } catch (error) {
      logger.error('获取患者详细报告失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId
      });
      next(error);
    }
  };

  // 生成医生报告
  generateDoctorReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { period = '30d', sections = 'all' } = req.body;
      
      logger.info('生成医生报告', {
        requestId: req.requestId,
        patientId,
        period,
        sections
      });

      // 验证患者是否存在
      const patient = await this.databaseService.getPatient(patientId);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 获取报告数据
      const { startDate, endDate } = this.getPeriodRange(period);
      const reportData = await this.getReportData(patientId, startDate, endDate);

      // 生成报告内容
      const reportContent = await this.generateReportContent(patient, reportData, sections);

      // 保存报告到数据库
      const doctorReport: Omit<DoctorReport, 'id' | 'created_at' | 'updated_at'> = {
        patient_id: patientId,
        generated_by: req.user?.patient_id || 'system',
        report_period_start: startDate,
        report_period_end: endDate,
        content: reportContent,
        metadata: {
          sections,
          total_sessions: reportData.sessions.length,
          total_messages: reportData.messages.length,
          generation_timestamp: new Date().toISOString()
        }
      };

      const savedReport = await this.databaseService.createDoctorReport(doctorReport);

      logger.info('医生报告生成成功', {
        requestId: req.requestId,
        patientId,
        reportId: savedReport.id
      });

      ResponseHelper.created(res, savedReport, '医生报告生成成功');
    } catch (error) {
      logger.error('生成医生报告失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId
      });
      next(error);
    }
  };

  // 获取医生报告列表
  getDoctorReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      logger.debug('获取医生报告列表', {
        requestId: req.requestId,
        patientId,
        page,
        limit
      });

      const result = await this.databaseService.listDoctorReports({
        patient_id: patientId,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      ResponseHelper.paginated(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      logger.error('获取医生报告列表失败', error as Error, {
        requestId: req.requestId,
        patientId: req.params.patientId
      });
      next(error);
    }
  };

  // 下载PDF报告
  downloadReportPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reportId } = req.params;
      
      logger.info('下载PDF报告', {
        requestId: req.requestId,
        reportId
      });

      // 获取报告数据
      const report = await this.databaseService.getDoctorReport(reportId);
      if (!report) {
        throw new NotFoundError('报告不存在');
      }

      const patient = await this.databaseService.getPatient(report.patient_id);
      if (!patient) {
        throw new NotFoundError('患者不存在');
      }

      // 生成PDF
      const pdfBuffer = await this.generatePDF(report, patient);

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${patient.name}-${report.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // 发送PDF
      res.send(pdfBuffer);

      logger.info('PDF报告下载成功', {
        requestId: req.requestId,
        reportId,
        patientId: patient.id
      });
    } catch (error) {
      logger.error('下载PDF报告失败', error as Error, {
        requestId: req.requestId,
        reportId: req.params.reportId
      });
      next(error);
    }
  };

  // 辅助方法：获取时间范围
  private getPeriodRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
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
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  // 获取最新家属评分
  private async getLatestFamilyScore(patientId: string): Promise<any> {
    const scores = await this.databaseService.listFamilyScores({
      patient_id: patientId,
      limit: 1,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    return scores.data[0] || null;
  }

  // 获取仪表板统计数据
  private async getDashboardStats(): Promise<any> {
    // 在实际应用中，这里会从数据库获取真实统计数据
    return {
      total_patients: 0,
      active_sessions: 0,
      pending_reviews: 0,
      reports_generated: 0
    };
  }

  // 分析患者数据
  private async analyzePatientData(patient: any, sessions: any[], messages: any[], familyScores: any[]): Promise<any> {
    // 在实际应用中，这里会进行复杂的数据分析
    return {
      communication_patterns: {
        avg_response_time: '2.5分钟',
        preferred_topics: ['健康', '家庭', '记忆'],
        activity_peaks: ['上午10点', '下午3点']
      },
      cognitive_trends: {
        memory_score_trend: 'stable',
        language_complexity: 'decreasing',
        response_coherence: 'good'
      },
      behavioral_changes: {
        mood_patterns: 'generally_positive',
        engagement_level: 'moderate',
        sleep_quality: 'reported_good'
      }
    };
  }

  // 生成医学洞察
  private async generateMedicalInsights(patient: any, analysis: any): Promise<string[]> {
    try {
      const prompt = `基于以下阿尔茨海默病患者的数据分析，生成3-5条专业的医学洞察：
患者信息：${JSON.stringify(patient)}
分析结果：${JSON.stringify(analysis)}

请提供简洁、专业且实用的医学建议。`;
      
      const insights = await this.aiService.generateResponse(prompt, '', patient.id);
      return insights.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      logger.error('生成医学洞察失败', error as Error);
      return [
        '建议持续观察患者的认知功能变化',
        '保持规律的日常交流有助于延缓认知衰退',
        '家属支持对患者心理健康具有重要意义'
      ];
    }
  }

  // 计算平均会话时长
  private calculateAvgSessionDuration(sessions: any[]): number {
    const completedSessions = sessions.filter(s => s.ended_at && s.created_at);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (new Date(session.ended_at).getTime() - new Date(session.created_at).getTime());
    }, 0);

    return Math.round(totalDuration / (completedSessions.length * 1000 * 60)); // 返回分钟数
  }

  // 计算活跃度
  private calculateActivityLevel(messages: any[], startDate: Date, endDate: Date): string {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgMessagesPerDay = messages.length / days;

    if (avgMessagesPerDay >= 10) return 'high';
    if (avgMessagesPerDay >= 5) return 'moderate';
    return 'low';
  }

  // 获取报告数据
  private async getReportData(patientId: string, startDate: Date, endDate: Date): Promise<any> {
    const [sessions, messages, familyScores] = await Promise.all([
      this.databaseService.listSessions({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000
      }),
      this.databaseService.listMessages({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 5000
      }),
      this.databaseService.listFamilyScores({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000
      })
    ]);

    return {
      sessions: sessions.data,
      messages: messages.data,
      familyScores: familyScores.data
    };
  }

  // 生成报告内容
  private async generateReportContent(patient: any, reportData: any, sections: string): Promise<any> {
    // 在实际应用中，这里会根据sections参数生成不同的报告部分
    return {
      executive_summary: '患者在观察期内表现稳定...',
      detailed_analysis: '详细分析显示...',
      recommendations: '建议继续现有护理方案...',
      charts_data: {
        session_frequency: [],
        emotion_trends: [],
        cognitive_scores: []
      }
    };
  }

  // 生成PDF
  private async generatePDF(report: DoctorReport, patient: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // 生成PDF内容
        doc.fontSize(20).text('医生诊断报告', 100, 100);
        doc.fontSize(14).text(`患者姓名：${patient.name}`, 100, 150);
        doc.text(`报告生成时间：${new Date(report.created_at).toLocaleDateString('zh-CN')}`, 100, 170);
        doc.text(`报告期间：${new Date(report.report_period_start).toLocaleDateString('zh-CN')} - ${new Date(report.report_period_end).toLocaleDateString('zh-CN')}`, 100, 190);
        
        // 添加报告内容
        if (typeof report.content === 'object' && report.content.executive_summary) {
          doc.text('执行摘要：', 100, 230);
          doc.fontSize(12).text(report.content.executive_summary, 100, 250, { width: 400 });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new DoctorController();