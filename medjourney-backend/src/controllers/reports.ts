// 报告生成控制器 - 更新版

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { localDatabaseService } from '../services/local-database';
import { reportGeneratorService } from '../services/report-generator';
import { ConversationAnalyzerFactory } from '../services/conversation-analyzer';
import fs from 'fs';
import path from 'path';

interface AuthenticatedRequest extends Request {
  user?: {
    patient_id: string;
    role: string;
    iat: number;
    exp: number;
  };
}

export class ReportsController {
  private analyzerService = ConversationAnalyzerFactory.create();

  constructor() {
    logger.info('报告控制器初始化完成');
  }

  // 生成详细报告
  async generateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reportType = 'comprehensive', format = 'json', includeCharts = true } = req.body;
      const userId = req.user?.patient_id || 'unknown';
      
      logger.info('开始生成报告', {
        sessionId,
        reportType,
        format,
        userId
      });

      // 验证会话存在
      const session = await localDatabaseService.getConversationSession(sessionId);
      if (!session) {
        return errorResponse(res, null, '会话不存在', 'SESSION_NOT_FOUND', 404);
      }

      // 生成详细报告
      const detailedReport = await reportGeneratorService.generateDetailedReport(sessionId);
      
      // 添加图表数据
      let chartsData = null;
      if (includeCharts) {
        chartsData = await this.generateChartsData(sessionId, detailedReport);
      }
      
      const fullReport = {
        ...detailedReport,
        charts_data: chartsData,
        metadata: {
          generated_by: userId,
          format,
          include_charts: includeCharts,
          generation_timestamp: new Date().toISOString()
        }
      };
      
      logger.info('报告生成完成', {
        reportId: detailedReport.id,
        sessionId,
        healthScore: detailedReport.summary.health_score,
        format
      });

      // 根据格式返回不同的响应
      if (format === 'pdf') {
        const pdfPath = await reportGeneratorService.exportReportToPDF(detailedReport.id);
        
        return successResponse(res, {
          report_id: detailedReport.id,
          download_url: `/api/reports/download/${path.basename(pdfPath)}`,
          format: 'pdf',
          file_path: pdfPath,
          health_score: detailedReport.summary.health_score
        }, 'PDF报告生成成功');
      } else if (format === 'html') {
        const htmlContent = await this.generateHTMLReport(fullReport);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
        return;
      } else {
        // 默认返回JSON格式
        return successResponse(res, fullReport, '报告生成成功');
      }
      
    } catch (error: any) {
      logger.error('生成报告失败', error);
      return errorResponse(res, null, `生成报告失败: ${error.message}`, 'REPORT_GENERATION_ERROR', 500);
    }
  }

  // 获取患者报告列表
  async getReportsList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { limit = 10, offset = 0, reportType } = req.query;
      
      logger.info('获取报告列表', {
        patientId,
        limit,
        offset,
        reportType
      });

      // 验证患者存在
      const patient = await localDatabaseService.getPatient(patientId as string);
      if (!patient) {
        return errorResponse(res, null, '患者不存在', 'PATIENT_NOT_FOUND', 404);
      }

      // 获取报告列表
      const reports = await localDatabaseService.getHealthReports(patientId as string);
      
      // 筛选和分页
      let filteredReports = reports;
      if (reportType) {
        filteredReports = reports.filter(r => r.report_type === reportType);
      }
      
      const startIndex = parseInt(offset as string);
      const pageSize = parseInt(limit as string);
      const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);
      
      // 构建响应
      const response = {
        patient_id: patientId,
        reports: paginatedReports.map(report => ({
          id: report.id,
          report_type: report.report_type,
          summary: report.summary,
          created_at: report.created_at,
          metadata: report.metadata ? JSON.parse(report.metadata) : {}
        })),
        pagination: {
          total: filteredReports.length,
          limit: pageSize,
          offset: startIndex,
          has_more: startIndex + pageSize < filteredReports.length
        }
      };
      
      logger.info('获取报告列表成功', {
        patientId,
        totalReports: filteredReports.length,
        returnedReports: paginatedReports.length
      });

      return successResponse(res, response, '获取报告列表成功');
      
    } catch (error: any) {
      logger.error('获取报告列表失败', error);
      return errorResponse(res, null, `获取报告列表失败: ${error.message}`, 'REPORTS_LIST_ERROR', 500);
    }
  }

  // 分享报告
  async shareReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { shareWith, expirationDays = 7, permissions = ['read'] } = req.body;
      const userId = req.user?.patient_id || 'unknown';
      
      logger.info('分享报告', {
        reportId,
        shareWith,
        expirationDays,
        permissions,
        userId
      });

      // 验证报告存在
      const report = await localDatabaseService.getHealthReport(reportId);
      if (!report) {
        return errorResponse(res, null, '报告不存在', 'REPORT_NOT_FOUND', 404);
      }

      // 生成分享令牌
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays as string));
      
      // 模拟保存分享信息
      const shareInfo = {
        share_token: shareToken,
        report_id: reportId,
        shared_by: userId,
        shared_with: shareWith,
        permissions,
        created_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString(),
        is_active: true
      };
      
      // 生成分享链接
      const shareUrl = `${req.protocol}://${req.get('host')}/api/reports/shared/${shareToken}`;
      
      logger.info('报告分享成功', {
        reportId,
        shareToken,
        shareUrl,
        expiresAt: expirationDate.toISOString()
      });

      return successResponse(res, {
        share_token: shareToken,
        share_url: shareUrl,
        expires_at: expirationDate.toISOString(),
        permissions,
        shared_with: shareWith,
        report_summary: {
          id: report.id,
          type: report.report_type,
          created_at: report.created_at
        }
      }, '报告分享成功');
      
    } catch (error: any) {
      logger.error('分享报告失败', error);
      return errorResponse(res, null, `分享报告失败: ${error.message}`, 'REPORT_SHARE_ERROR', 500);
    }
  }

  // 生成家属简报
  async generateFamilySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const { format = 'pdf', includeCharts = true } = req.body;
      
      logger.info('生成家属简报', {
        userId,
        format,
        includeCharts
      });

      // 获取患者信息
      const patient = await localDatabaseService.getPatient(userId);
      if (!patient) {
        return errorResponse(res, null, '患者不存在', 'PATIENT_NOT_FOUND', 404);
      }

      // 获取最近的会话数据
      const sessions = await localDatabaseService.getSessionRecords(userId);
      const recentSessions = sessions.slice(-5); // 最近5个会话

      if (recentSessions.length === 0) {
        return errorResponse(res, null, '没有找到会话数据', 'NO_SESSIONS_FOUND', 404);
      }

      // 获取最近会话的消息
      const recentMessages = [];
      for (const session of recentSessions) {
        const messages = await localDatabaseService.getConversationMessages(session.id);
        recentMessages.push(...messages);
      }

      // 生成家属简报
      const familySummary = await reportGeneratorService.generateFamilySummary(recentSessions[0].id);
      
      // 构建完整的家属简报
      const fullSummary = {
        patient: {
          id: patient.id,
          name: patient.name,
          age: patient.age
        },
        summary: familySummary,
        recent_activity: {
          total_sessions: recentSessions.length,
          total_messages: recentMessages.length,
          last_session_date: recentSessions[recentSessions.length - 1]?.startTime,
          average_session_duration: '15分钟'
        },
        health_trends: {
          overall_trend: 'stable',
          cognitive_trend: 'slight_improvement',
          emotional_trend: 'stable'
        },
        recommendations: [
          '继续保持规律的AI对话练习',
          '增加户外活动和社交互动',
          '保持良好的睡眠习惯',
          '定期与家人交流分享感受'
        ],
        metadata: {
          generated_by: req.user?.patient_id || 'system',
          format,
          include_charts: includeCharts,
          generation_timestamp: new Date().toISOString()
        }
      };

      logger.info('家属简报生成成功', {
        userId,
        healthScore: familySummary.health_score,
        emotionalState: familySummary.emotional_state
      });

      // 根据格式返回不同的响应
      if (format === 'pdf') {
        // 生成PDF内容
        const pdfContent = this.generateFamilySummaryPDF(fullSummary);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="家属简报_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(Buffer.from(await blob.arrayBuffer()));
      } else if (format === 'html') {
        const htmlContent = this.generateFamilySummaryHTML(fullSummary);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
      } else {
        // 默认返回JSON格式
        return successResponse(res, fullSummary, '家属简报生成成功');
      }
      
    } catch (error: any) {
      logger.error('生成家属简报失败', error);
      return errorResponse(res, null, `生成家属简报失败: ${error.message}`, 'FAMILY_SUMMARY_ERROR', 500);
    }
  }

  // 生成图表数据
  private async generateChartsData(sessionId: string, report: any): Promise<any> {
    try {
      const messages = await localDatabaseService.getConversationMessages(sessionId);
      
      return {
        health_trend: {
          type: 'line',
          data: {
            labels: ['本次评估'],
            datasets: [{
              label: '健康评分',
              data: [report.summary.health_score],
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)'
            }]
          }
        },
        emotion_distribution: {
          type: 'pie',
          data: {
            labels: Object.keys(report.detailed_analysis.emotional_analysis.emotions || {}),
            datasets: [{
              data: Object.values(report.detailed_analysis.emotional_analysis.emotions || {}),
              backgroundColor: [
                '#FF6384',
                '#36A2EB', 
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
              ]
            }]
          }
        },
        conversation_stats: {
          type: 'bar',
          data: {
            labels: ['消息数量', '平均长度', '交流评分'],
            datasets: [{
              label: '统计数据',
              data: [
                messages.filter(m => m.role === 'user').length,
                messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length || 0,
                report.detailed_analysis.conversation_quality
              ],
              backgroundColor: ['#3498db', '#e74c3c', '#2ecc71']
            }]
          }
        }
      };
    } catch (error) {
      logger.error('生成图表数据失败', error);
      return null;
    }
  }

  // 生成HTML报告
  private async generateHTMLReport(report: any): Promise<string> {
    try {
      const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedJourney 健康评估报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .score-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 25px;
        }
        .score-number {
            font-size: 3em;
            font-weight: bold;
            color: ${this.getScoreColor(report.summary.health_score)};
            text-align: center;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 25px;
        }
        .section h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .recommendation {
            background: #e8f5e8;
            padding: 15px;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
        }
        .risk-factor {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 0.9em;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedJourney 健康评估报告</h1>
        <p>生成时间：${new Date(report.created_at).toLocaleString('zh-CN')}</p>
        <p>报告 ID：${report.id}</p>
    </div>

    <div class="score-card">
        <h2 style="text-align: center; margin-top: 0;">综合健康评分</h2>
        <div class="score-number">${report.summary.health_score}</div>
        <p style="text-align: center; color: #666; margin-bottom: 0;">总分 100 分</p>
    </div>

    <div class="section">
        <h2>总体评估</h2>
        <p>${report.summary.overall_assessment}</p>
        <h3>主要发现</h3>
        <ul>
            ${report.summary.key_findings.map((finding: string) => `<li>${finding}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>详细分析</h2>
        <h3>认知功能评估</h3>
        <p><strong>评分：</strong>${report.detailed_analysis.cognitive_assessment.cognitive_score}/100</p>
        <p><strong>情绪状态：</strong>${report.detailed_analysis.cognitive_assessment.emotional_state}</p>
        <p><strong>交流质量：</strong>${report.detailed_analysis.cognitive_assessment.communication_quality}</p>
        
        <h3>行为模式</h3>
        <ul>
            ${report.detailed_analysis.behavioral_patterns.map((pattern: string) => `<li>${pattern}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>建议措施</h2>
        <h3>立即行动</h3>
        ${report.recommendations.immediate_actions.map((action: string) => 
          `<div class="recommendation">• ${action}</div>`
        ).join('')}
        
        <h3>长期护理</h3>
        ${report.recommendations.long_term_care.map((care: string) => 
          `<div class="recommendation">• ${care}</div>`
        ).join('')}
        
        <h3>家属指导</h3>
        ${report.recommendations.family_guidance.map((guidance: string) => 
          `<div class="recommendation">• ${guidance}</div>`
        ).join('')}
    </div>

    <div class="footer">
        <p>本报告由 MedJourney AI 系统生成，仅供参考，不能替代专业医疗诊断。</p>
        <p>如有疑问，请咨询专业医疗人员。</p>
    </div>
</body>
</html>`;
      
      return htmlTemplate;
    } catch (error) {
      logger.error('生成HTML报告失败', error);
      return '<html><body><h1>报告生成失败</h1></body></html>';
    }
  }

  // 生成家属简报PDF内容
  private generateFamilySummaryPDF(summary: any): string {
    const content = `
MedJourney 家属简报
==================

患者姓名：${summary.patient.name}
生成日期：${new Date().toLocaleDateString('zh-CN')}

健康状态概要：
- 综合评分：${summary.summary.health_score}/100
- 情绪状态：${summary.summary.emotional_state}
- 关键洞察：${summary.summary.key_insight}

最近活动总结：
- 会话次数：${summary.recent_activity.total_sessions}次
- 消息总数：${summary.recent_activity.total_messages}条
- 最后会话：${new Date(summary.recent_activity.last_session_date).toLocaleDateString('zh-CN')}

健康趋势：
- 整体趋势：${summary.health_trends.overall_trend === 'stable' ? '稳定' : '改善'}
- 认知趋势：${summary.health_trends.cognitive_trend === 'slight_improvement' ? '轻微改善' : '稳定'}
- 情绪趋势：${summary.health_trends.emotional_trend === 'stable' ? '稳定' : '波动'}

建议：
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

---
本报告由 MedJourney AI 系统生成
生成时间：${summary.metadata.generation_timestamp}
    `;
    
    return content;
  }

  // 生成家属简报HTML内容
  private generateFamilySummaryHTML(summary: any): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedJourney 家属简报</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1F2937; border-left: 4px solid #3B82F6; padding-left: 15px; }
        .score { font-size: 24px; font-weight: bold; color: #3B82F6; }
        .recommendation { background: #F3F4F6; padding: 10px; margin: 5px 0; border-radius: 5px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedJourney 家属简报</h1>
        <p>患者：${summary.patient.name} | 生成日期：${new Date().toLocaleDateString('zh-CN')}</p>
    </div>

    <div class="section">
        <h2>健康状态概要</h2>
        <p><strong>综合评分：</strong><span class="score">${summary.summary.health_score}/100</span></p>
        <p><strong>情绪状态：</strong>${summary.summary.emotional_state}</p>
        <p><strong>关键洞察：</strong>${summary.summary.key_insight}</p>
    </div>

    <div class="section">
        <h2>最近活动总结</h2>
        <p><strong>会话次数：</strong>${summary.recent_activity.total_sessions}次</p>
        <p><strong>消息总数：</strong>${summary.recent_activity.total_messages}条</p>
        <p><strong>最后会话：</strong>${new Date(summary.recent_activity.last_session_date).toLocaleDateString('zh-CN')}</p>
    </div>

    <div class="section">
        <h2>建议</h2>
        ${summary.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
    </div>

    <div class="footer">
        <p>本报告由 MedJourney AI 系统生成</p>
        <p>生成时间：${new Date(summary.metadata.generation_timestamp).toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>
    `;
  }

  // 获取评分颜色
  private getScoreColor(score: number): string {
    if (score >= 80) return '#27ae60'; // 绿色
    if (score >= 60) return '#f39c12'; // 橙色 
    return '#e74c3c'; // 红色
  }

  // 获取特定报告
  async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { format = 'json' } = req.query;
      
      logger.info('获取报告', { reportId, format });

      // 验证报告存在
      const report = await localDatabaseService.getHealthReport(reportId);
      if (!report) {
        return errorResponse(res, null, '报告不存在', 'REPORT_NOT_FOUND', 404);
      }

      // 根据格式返回
      if (format === 'html') {
        const htmlContent = await this.generateHTMLReport(report);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
        return;
      }
      
      return successResponse(res, {
        ...report,
        content: JSON.parse(report.content || '{}'),
        summary: JSON.parse(report.summary || '{}'),
        metadata: JSON.parse(report.metadata || '{}')
      }, '获取报告成功');
      
    } catch (error: any) {
      logger.error('获取报告失败', error);
      return errorResponse(res, null, `获取报告失败: ${error.message}`, 'GET_REPORT_ERROR', 500);
    }
  }

  // 获取报告分享状态
  async getReportSharing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      
      logger.info('获取报告分享状态', { reportId });

      // 验证报告存在
      const report = await localDatabaseService.getHealthReport(reportId);
      if (!report) {
        return errorResponse(res, null, '报告不存在', 'REPORT_NOT_FOUND', 404);
      }

      // 模拟分享状态
      const sharingInfo = {
        report_id: reportId,
        is_shared: false,
        share_links: [],
        access_count: 0,
        last_accessed: null
      };
      
      return successResponse(res, sharingInfo, '获取分享状态成功');
      
    } catch (error: any) {
      logger.error('获取分享状态失败', error);
      return errorResponse(res, null, `获取分享状态失败: ${error.message}`, 'GET_SHARING_ERROR', 500);
    }
  }

  // 删除报告
  async deleteReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.patient_id || 'unknown';
      
      logger.info('删除报告', { reportId, userId });

      // 验证报告存在
      const report = await localDatabaseService.getHealthReport(reportId);
      if (!report) {
        return errorResponse(res, null, '报告不存在', 'REPORT_NOT_FOUND', 404);
      }

      // 模拟删除操作（实际上只是标记删除）
      logger.info('报告删除成功（模拟）', {
        reportId,
        deletedBy: userId,
        timestamp: new Date().toISOString()
      });
      
      return successResponse(res, {
        report_id: reportId,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      }, '报告删除成功');
      
    } catch (error: any) {
      logger.error('删除报告失败', error);
      return errorResponse(res, null, `删除报告失败: ${error.message}`, 'DELETE_REPORT_ERROR', 500);
    }
  }

  // 下载报告文件
  async downloadReport(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'reports', filename);
      
      if (!fs.existsSync(filePath)) {
        return errorResponse(res, null, '文件不存在', 'FILE_NOT_FOUND', 404);
      }
      
      res.download(filePath, (err) => {
        if (err) {
          logger.error('文件下载失败', err);
          if (!res.headersSent) {
            return errorResponse(res, null, '文件下载失败', 'DOWNLOAD_ERROR', 500);
          }
        }
      });
    } catch (error: any) {
      logger.error('下载报告失败', error);
      return errorResponse(res, null, `下载失败: ${error.message}`, 'DOWNLOAD_ERROR', 500);
    }
  }
}

export const reportsController = new ReportsController();
