// 报告生成控制器

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import ResponseHelper from '../utils/response';
import ConversationAnalyzerFactory from '../services/conversation-analyzer';
import DatabaseServiceFactory from '../services/database';

interface AuthenticatedRequest extends Request {
  user?: {
    patient_id: string;
    role: string;
  };
}

export class ReportsController {
  private analyzerService: any;
  private databaseService: any;

  constructor() {
    this.analyzerService = ConversationAnalyzerFactory.create();
    this.databaseService = DatabaseServiceFactory.create();
  }

  // 生成详细报告
  async generateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reportType, format, includeCharts, dateRange } = req.body;
      const userId = req.user?.patient_id;
      
      logger.info('开始生成报告', {
        sessionId,
        reportType,
        format,
        includeCharts,
        userId
      });

      // 验证会话是否存在
      const session = await this.getSessionById(sessionId);
      if (!session) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '会话不存在',
          'SESSION_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }

      // 生成报告
      const report = await this.analyzerService.generateReport(sessionId, reportType);
      
      // 添加报告元数据
      const reportMetadata = {
        report_id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        session_id: sessionId,
        report_type: reportType,
        format,
        generated_by: userId,
        generated_at: new Date().toISOString(),
        include_charts: includeCharts,
        date_range: dateRange
      };
      
      const fullReport = {
        ...reportMetadata,
        ...report
      };
      
      // 如果需要图表，添加可视化数据
      if (includeCharts) {
        fullReport.charts_data = await this.generateChartsData(sessionId, reportType);
      }
      
      // 保存报告
      const savedReport = await this.saveReport(fullReport);
      
      // 根据格式返回不同的响应
      if (format === 'pdf') {
        // 生成 PDF（这里需要集成 PDF 生成服务）
        const pdfUrl = await this.generatePDFReport(savedReport);
        
        const response: ApiResponse = ResponseHelper.success(res, {
          report_id: savedReport.id,
          download_url: pdfUrl,
          format: 'pdf',
          generated_at: savedReport.created_at
        }, '报告生成成功（PDF格式）');
        
        res.status(200).json(response);
      } else if (format === 'html') {
        // 生成 HTML 报告
        const htmlContent = await this.generateHTMLReport(savedReport);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
      } else {
        // 默认返回 JSON 格式
        const response: ApiResponse = ResponseHelper.success(res, fullReport, '报告生成成功');
        res.status(200).json(response);
      }
      
      logger.info('报告生成完成', {
        reportId: savedReport.id,
        sessionId,
        reportType,
        format
      });
    } catch (error: any) {
      logger.error('报告生成失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '报告生成失败',
        'REPORT_GENERATION_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取报告列表
  async getReportsList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10, reportType, startDate, endDate } = req.query;
      
      logger.debug('获取报告列表', {
        patientId,
        page,
        limit,
        reportType,
        startDate,
        endDate
      });

      const reports = await this.getReportsForPatient(patientId, {
        page: Number(page),
        limit: Number(limit),
        reportType: reportType as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      const response: ApiResponse = ResponseHelper.success(res, reports, '报告列表获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取报告列表失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '获取报告列表失败',
        'GET_REPORTS_LIST_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取特定报告
  async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.patient_id;
      
      logger.debug('获取报告详情', {
        reportId,
        userId
      });

      const report = await this.getReportById(reportId);
      
      if (!report) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '报告不存在',
          'REPORT_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }
      
      // 检查访问权限
      const hasAccess = await this.checkReportAccess(reportId, userId);
      if (!hasAccess) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '无权访问此报告',
          'REPORT_ACCESS_DENIED'
        );
        res.status(403).json(response);
        return;
      }
      
      const response: ApiResponse = ResponseHelper.success(res, report, '报告获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取报告失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '获取报告失败',
        'GET_REPORT_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 分享报告
  async shareReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { reportId: bodyReportId, shareWith, permissions, expirationDate } = req.body;
      const userId = req.user?.patient_id;
      
      logger.info('分享报告', {
        reportId,
        shareWith,
        permissions,
        expirationDate,
        userId
      });

      // 验证报告存在
      const report = await this.getReportById(reportId);
      if (!report) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '报告不存在',
          'REPORT_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }
      
      // 检查分享权限
      const canShare = await this.checkSharePermission(reportId, userId);
      if (!canShare) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '无权分享此报告',
          'SHARE_PERMISSION_DENIED'
        );
        res.status(403).json(response);
        return;
      }
      
      // 创建分享记录
      const shareData = {
        report_id: reportId,
        shared_by: userId,
        shared_with: shareWith,
        permissions: permissions || { view: true, download: false, edit: false },
        expiration_date: expirationDate,
        shared_at: new Date()
      };
      
      const shareRecord = await this.createShareRecord(shareData);
      
      // 生成分享链接
      const shareUrl = await this.generateShareUrl(shareRecord.id);
      
      logger.info('报告分享成功', {
        reportId,
        shareId: shareRecord.id,
        shareUrl
      });
      
      const response: ApiResponse = ResponseHelper.success(res, {
        share_id: shareRecord.id,
        share_url: shareUrl,
        shared_with: shareWith,
        permissions,
        expiration_date: expirationDate,
        created_at: shareRecord.created_at
      }, '报告分享成功');
      
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('分享报告失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '分享报告失败',
        'SHARE_REPORT_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 下载报告
  async downloadReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { format = 'pdf' } = req.query;
      const userId = req.user?.patient_id;
      
      logger.info('下载报告', {
        reportId,
        format,
        userId
      });

      // 验证报告存在和访问权限
      const report = await this.getReportById(reportId);
      if (!report) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '报告不存在',
          'REPORT_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }
      
      const hasAccess = await this.checkReportAccess(reportId, userId);
      if (!hasAccess) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '无权下载此报告',
          'DOWNLOAD_ACCESS_DENIED'
        );
        res.status(403).json(response);
        return;
      }
      
      // 根据格式生成下载文件
      if (format === 'pdf') {
        const pdfBuffer = await this.generatePDFBuffer(report);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        const excelBuffer = await this.generateExcelBuffer(report);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.xlsx"`);
        res.send(excelBuffer);
      } else {
        // JSON 格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.json"`);
        res.json(report);
      }
      
      // 记录下载日志
      await this.logDownload(reportId, userId, format as string);
      
      logger.info('报告下载成功', {
        reportId,
        format,
        userId
      });
    } catch (error: any) {
      logger.error('下载报告失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '下载报告失败',
        'DOWNLOAD_REPORT_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 获取报告分享状态
  async getReportSharing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.patient_id;
      
      logger.debug('获取报告分享状态', {
        reportId,
        userId
      });

      const sharingInfo = await this.getReportSharingInfo(reportId);
      
      const response: ApiResponse = ResponseHelper.success(res, sharingInfo, '分享状态获取成功');
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('获取报告分享状态失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '获取分享状态失败',
        'GET_SHARING_STATUS_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 删除报告
  async deleteReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.patient_id;
      
      logger.info('删除报告', {
        reportId,
        userId
      });

      // 验证报告存在和删除权限
      const report = await this.getReportById(reportId);
      if (!report) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '报告不存在',
          'REPORT_NOT_FOUND'
        );
        res.status(404).json(response);
        return;
      }
      
      const canDelete = await this.checkDeletePermission(reportId, userId);
      if (!canDelete) {
        const response: ApiResponse = ResponseHelper.error(res, 
          '无权删除此报告',
          'DELETE_PERMISSION_DENIED'
        );
        res.status(403).json(response);
        return;
      }
      
      // 软删除报告
      await this.softDeleteReport(reportId);
      
      logger.info('报告删除成功', {
        reportId,
        userId
      });
      
      const response: ApiResponse = ResponseHelper.success(res, 
        { reportId, deletedAt: new Date().toISOString() },
        '报告删除成功'
      );
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('删除报告失败', error);
      const response: ApiResponse = ResponseHelper.error(res, 
        '删除报告失败',
        'DELETE_REPORT_ERROR',
        error.message
      );
      res.status(500).json(response);
    }
  }

  // 私有方法
  private async getSessionById(sessionId: string): Promise<any> {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    const result = await this.databaseService.query(query, [sessionId]);
    return result[0] || null;
  }

  private async saveReport(reportData: any): Promise<any> {
    const query = `
      INSERT INTO reports (id, session_id, report_type, format, report_data, generated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const now = new Date();
    const result = await this.databaseService.query(query, [
      reportData.report_id,
      reportData.session_id,
      reportData.report_type,
      reportData.format,
      JSON.stringify(reportData),
      reportData.generated_by,
      now,
      now
    ]);
    
    return result[0];
  }

  private async generateChartsData(sessionId: string, reportType: string): Promise<any> {
    // 为报告生成图表数据
    const analysis = await this.analyzerService.analyzeSession(sessionId);
    
    const chartsData = {
      emotional_trends: {
        type: 'line',
        data: this.generateEmotionalTrendsChart(analysis.emotional_summary),
        title: '情绪趋势分析'
      },
      cognitive_scores: {
        type: 'radar',
        data: this.generateCognitiveScoresChart(analysis.cognitive_indicators),
        title: '认知能力评估'
      },
      social_engagement: {
        type: 'bar',
        data: this.generateSocialEngagementChart(analysis.social_engagement),
        title: '社交参与度'
      }
    };
    
    return chartsData;
  }

  private generateEmotionalTrendsChart(emotionalSummary: any): any {
    // 生成情绪趋势图表数据
    return {
      labels: ['快乐', '悲伤', '愤怒', '恐惧', '惊讶'],
      datasets: [{
        label: '情绪分布',
        data: [0.3, 0.2, 0.1, 0.15, 0.25],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      }]
    };
  }

  private generateCognitiveScoresChart(cognitiveIndicators: any): any {
    // 生成认知能力雷达图数据
    return {
      labels: ['记忆力', '注意力', '语言能力', '执行功能', '视空间能力'],
      datasets: [{
        label: '认知评分',
        data: [0.8, 0.7, 0.9, 0.6, 0.75],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)'
      }]
    };
  }

  private generateSocialEngagementChart(socialEngagement: any): any {
    // 生成社交参与度柱状图数据
    return {
      labels: ['主动性', '回应性', '合作性', '表达能力'],
      datasets: [{
        label: '参与度评分',
        data: [0.7, 0.8, 0.6, 0.75],
        backgroundColor: [
          'rgba(255, 206, 86, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(75, 192, 192, 0.2)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    };
  }

  private async generatePDFReport(report: any): Promise<string> {
    // 生成 PDF 报告并返回下载 URL
    // 这里需要集成 PDF 生成服务（如 Puppeteer, jsPDF 等）
    const pdfUrl = `https://api.medjourney.com/reports/${report.id}/pdf`;
    return pdfUrl;
  }

  private async generateHTMLReport(report: any): Promise<string> {
    // 生成 HTML 报告
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MedJourney 报告</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .chart { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MedJourney 健康报告</h1>
          <p>生成时间：${report.generated_at}</p>
        </div>
        <div class="section">
          <h2>基本信息</h2>
          <p>会话ID：${report.session_id}</p>
          <p>报告类型：${report.report_type}</p>
        </div>
        <div class="section">
          <h2>分析结果</h2>
          <pre>${JSON.stringify(report, null, 2)}</pre>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  private async getReportsForPatient(patientId: string, options: any): Promise<any> {
    const { page, limit, reportType, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE s.patient_id = $1 AND r.deleted_at IS NULL';
    let params = [patientId];
    
    if (reportType) {
      whereClause += ` AND r.report_type = $${params.length + 1}`;
      params.push(reportType);
    }
    
    if (startDate) {
      whereClause += ` AND r.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND r.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    const query = `
      SELECT r.*, s.patient_id, s.session_type
      FROM reports r
      JOIN sessions s ON r.session_id = s.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const reports = await this.databaseService.query(query, params);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      JOIN sessions s ON r.session_id = s.id
      ${whereClause}
    `;
    
    const countResult = await this.databaseService.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult[0].total);
    
    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  private async getReportById(reportId: string): Promise<any> {
    const query = 'SELECT * FROM reports WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.databaseService.query(query, [reportId]);
    return result[0] || null;
  }

  private async checkReportAccess(reportId: string, userId: string): Promise<boolean> {
    // 检查用户是否有权限访问报告
    const query = `
      SELECT r.* FROM reports r
      JOIN sessions s ON r.session_id = s.id
      WHERE r.id = $1 AND (s.patient_id = $2 OR r.generated_by = $2)
    `;
    
    const result = await this.databaseService.query(query, [reportId, userId]);
    return result.length > 0;
  }

  private async checkSharePermission(reportId: string, userId: string): Promise<boolean> {
    // 检查用户是否有权限分享报告
    const query = `
      SELECT r.* FROM reports r
      JOIN sessions s ON r.session_id = s.id
      WHERE r.id = $1 AND s.patient_id = $2
    `;
    
    const result = await this.databaseService.query(query, [reportId, userId]);
    return result.length > 0;
  }

  private async checkDeletePermission(reportId: string, userId: string): Promise<boolean> {
    // 检查用户是否有权限删除报告
    return await this.checkSharePermission(reportId, userId);
  }

  private async createShareRecord(shareData: any): Promise<any> {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const query = `
      INSERT INTO report_shares (id, report_id, shared_by, shared_with, permissions, expiration_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await this.databaseService.query(query, [
      shareId,
      shareData.report_id,
      shareData.shared_by,
      JSON.stringify(shareData.shared_with),
      JSON.stringify(shareData.permissions),
      shareData.expiration_date,
      shareData.shared_at
    ]);
    
    return result[0];
  }

  private async generateShareUrl(shareId: string): Promise<string> {
    // 生成分享链接
    const baseUrl = process.env.FRONTEND_URL || 'https://medjourney.com';
    return `${baseUrl}/reports/shared/${shareId}`;
  }

  private async generatePDFBuffer(report: any): Promise<Buffer> {
    // 生成 PDF 文件 Buffer
    // 这里需要实际的 PDF 生成逻辑
    const mockPDFBuffer = Buffer.from('Mock PDF content');
    return mockPDFBuffer;
  }

  private async generateExcelBuffer(report: any): Promise<Buffer> {
    // 生成 Excel 文件 Buffer
    // 这里需要实际的 Excel 生成逻辑
    const mockExcelBuffer = Buffer.from('Mock Excel content');
    return mockExcelBuffer;
  }

  private async logDownload(reportId: string, userId: string, format: string): Promise<void> {
    // 记录下载日志
    const query = `
      INSERT INTO download_logs (report_id, user_id, format, downloaded_at)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.databaseService.query(query, [reportId, userId, format, new Date()]);
  }

  private async getReportSharingInfo(reportId: string): Promise<any> {
    // 获取报告分享信息
    const query = `
      SELECT * FROM report_shares
      WHERE report_id = $1 AND (expiration_date IS NULL OR expiration_date > NOW())
      ORDER BY created_at DESC
    `;
    
    const shares = await this.databaseService.query(query, [reportId]);
    
    return {
      report_id: reportId,
      shares: shares,
      total_shares: shares.length,
      is_shared: shares.length > 0
    };
  }

  private async softDeleteReport(reportId: string): Promise<void> {
    // 软删除报告
    const query = `
      UPDATE reports
      SET deleted_at = $1, updated_at = $1
      WHERE id = $2
    `;
    
    await this.databaseService.query(query, [new Date(), reportId]);
  }
}
