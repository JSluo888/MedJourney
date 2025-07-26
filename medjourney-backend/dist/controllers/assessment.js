"use strict";
// 分级问诊控制器
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
const conversation_analyzer_1 = __importDefault(require("../services/conversation-analyzer"));
const database_1 = __importDefault(require("../services/database"));
class AssessmentController {
    analyzerService;
    databaseService;
    constructor() {
        this.analyzerService = conversation_analyzer_1.default.create();
        this.databaseService = database_1.default.create();
    }
    // 分级问诊分析
    async analyzeAssessment(req, res) {
        try {
            const { sessionId, assessmentType, includeRecommendations } = req.body;
            const userId = req.user?.patient_id;
            logger_1.logger.info('开始分级问诊分析', {
                sessionId,
                assessmentType,
                includeRecommendations,
                userId
            });
            // 验证会话是否存在
            const session = await this.getSessionById(sessionId);
            if (!session) {
                const response = response_1.default.error(res, '会话不存在', 'SESSION_NOT_FOUND');
                res.status(404).json(response);
                return;
            }
            // 执行对话分析
            const fullAnalysis = await this.analyzerService.analyzeSession(sessionId);
            // 根据问诊类型返回相应的分析结果
            let analysisResult;
            switch (assessmentType) {
                case 'cognitive':
                    analysisResult = {
                        type: 'cognitive',
                        cognitive_indicators: fullAnalysis.cognitive_indicators,
                        memory_assessment: this.assessMemoryPerformance(fullAnalysis.cognitive_indicators),
                        attention_assessment: this.assessAttentionPerformance(fullAnalysis.cognitive_indicators),
                        language_assessment: this.assessLanguagePerformance(fullAnalysis.cognitive_indicators)
                    };
                    break;
                case 'emotional':
                    analysisResult = {
                        type: 'emotional',
                        emotional_summary: fullAnalysis.emotional_summary,
                        mood_stability: this.assessMoodStability(fullAnalysis.emotional_summary),
                        emotional_patterns: this.identifyEmotionalPatterns(fullAnalysis.emotional_summary)
                    };
                    break;
                case 'comprehensive':
                    analysisResult = {
                        type: 'comprehensive',
                        ...fullAnalysis,
                        overall_score: this.calculateOverallAssessmentScore(fullAnalysis),
                        risk_assessment: this.assessCognitiveRisk(fullAnalysis)
                    };
                    break;
                default: // basic
                    analysisResult = {
                        type: 'basic',
                        overall_cognitive_score: this.calculateOverallCognitiveScore(fullAnalysis.cognitive_indicators),
                        dominant_emotion: fullAnalysis.emotional_summary.dominant_emotion,
                        social_engagement_level: this.categorizeSocialEngagement(fullAnalysis.social_engagement),
                        key_observations: this.generateKeyObservations(fullAnalysis)
                    };
            }
            // 添加建议（如果需要）
            if (includeRecommendations) {
                analysisResult.recommendations = fullAnalysis.recommendations;
                analysisResult.next_steps = this.generateNextSteps(fullAnalysis, assessmentType);
            }
            // 保存分析结果
            await this.saveAssessmentAnalysis(sessionId, analysisResult);
            logger_1.logger.info('分级问诊分析完成', {
                sessionId,
                assessmentType,
                analysisKeys: Object.keys(analysisResult)
            });
            const response = response_1.default.success(res, analysisResult, '分级问诊分析完成');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('分级问诊分析失败', error);
            const response = response_1.default.error(res, '分级问诊分析失败', 'ASSESSMENT_ANALYSIS_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 提交问诊数据
    async submitAssessmentData(req, res) {
        try {
            const { sessionId, assessmentData, assessmentType } = req.body;
            const userId = req.user?.patient_id;
            logger_1.logger.info('提交问诊数据', {
                sessionId,
                assessmentType,
                dataKeys: Object.keys(assessmentData),
                userId
            });
            // 验证会话是否存在
            const session = await this.getSessionById(sessionId);
            if (!session) {
                const response = response_1.default.error(res, '会话不存在', 'SESSION_NOT_FOUND');
                res.status(404).json(response);
                return;
            }
            // 数据验证和处理
            const processedData = await this.processAssessmentData(assessmentData, assessmentType);
            // 保存问诊数据
            const savedAssessment = await this.saveAssessmentData({
                session_id: sessionId,
                assessment_type: assessmentType,
                assessment_data: processedData,
                submitted_by: userId,
                submitted_at: new Date()
            });
            // 生成初步分析
            const preliminaryAnalysis = await this.generatePreliminaryAnalysis(processedData, assessmentType);
            logger_1.logger.info('问诊数据提交成功', {
                sessionId,
                assessmentId: savedAssessment.id,
                assessmentType
            });
            const response = response_1.default.success(res, {
                assessmentId: savedAssessment.id,
                sessionId,
                assessmentType,
                submittedAt: savedAssessment.created_at,
                preliminaryAnalysis,
                nextSteps: {
                    canProceedToConversation: true,
                    recommendedConversationType: this.recommendConversationType(preliminaryAnalysis),
                    estimatedDuration: this.estimateConversationDuration(preliminaryAnalysis)
                }
            }, '问诊数据提交成功');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('提交问诊数据失败', error);
            const response = response_1.default.error(res, '提交问诊数据失败', 'ASSESSMENT_SUBMIT_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 获取问诊历史
    async getAssessmentHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { page = 1, limit = 10, assessmentType } = req.query;
            logger_1.logger.debug('获取问诊历史', {
                patientId,
                page,
                limit,
                assessmentType
            });
            const history = await this.getAssessmentHistoryByPatient(patientId, {
                page: Number(page),
                limit: Number(limit),
                assessmentType: assessmentType
            });
            const response = response_1.default.success(res, history, '问诊历史获取成功');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('获取问诊历史失败', error);
            const response = response_1.default.error(res, '获取问诊历史失败', 'ASSESSMENT_HISTORY_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 获取问诊报告
    async getAssessmentReport(req, res) {
        try {
            const { sessionId } = req.params;
            const { format = 'json', includeCharts = true } = req.query;
            logger_1.logger.info('生成问诊报告', {
                sessionId,
                format,
                includeCharts
            });
            // 生成报告
            const report = await this.analyzerService.generateReport(sessionId, 'doctor');
            // 添加问诊特定的数据
            const assessmentData = await this.getAssessmentDataBySession(sessionId);
            const fullReport = {
                ...report,
                assessment_data: assessmentData,
                report_metadata: {
                    generated_at: new Date().toISOString(),
                    session_id: sessionId,
                    report_type: 'assessment',
                    format
                }
            };
            if (format === 'pdf') {
                // 生成 PDF 报告（这里需要集成 PDF 生成服务）
                // const pdfBuffer = await this.generatePDFReport(fullReport);
                // res.setHeader('Content-Type', 'application/pdf');
                // res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${sessionId}.pdf"`);
                // res.send(pdfBuffer);
                // 临时返回 JSON 格式
                const response = response_1.default.success(res, {
                    message: 'PDF 生成功能待实现',
                    report: fullReport
                });
                res.status(200).json(response);
            }
            else {
                const response = response_1.default.success(res, fullReport, '问诊报告生成成功');
                res.status(200).json(response);
            }
        }
        catch (error) {
            logger_1.logger.error('生成问诊报告失败', error);
            const response = response_1.default.error(res, '生成问诊报告失败', 'ASSESSMENT_REPORT_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 私有方法
    async getSessionById(sessionId) {
        const query = 'SELECT * FROM sessions WHERE id = $1';
        const result = await this.databaseService.query(query, [sessionId]);
        return result[0] || null;
    }
    async processAssessmentData(data, assessmentType) {
        // 数据清理和验证
        const processedData = { ...data };
        // 添加时间戳
        processedData.processed_at = new Date().toISOString();
        processedData.assessment_type = assessmentType;
        // 根据评估类型进行特定处理
        switch (assessmentType) {
            case 'basic':
                processedData.basic_info_score = this.calculateBasicInfoCompleteness(data);
                break;
            case 'cognitive':
                processedData.cognitive_test_score = this.calculateCognitiveTestScore(data);
                break;
            case 'emotional':
                processedData.emotional_state_score = this.calculateEmotionalStateScore(data);
                break;
        }
        return processedData;
    }
    async saveAssessmentData(assessmentData) {
        const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const query = `
      INSERT INTO assessments (id, session_id, assessment_type, assessment_data, submitted_by, submitted_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const now = new Date();
        const result = await this.databaseService.query(query, [
            assessmentId,
            assessmentData.session_id,
            assessmentData.assessment_type,
            JSON.stringify(assessmentData.assessment_data),
            assessmentData.submitted_by,
            assessmentData.submitted_at,
            now,
            now
        ]);
        return result[0];
    }
    async saveAssessmentAnalysis(sessionId, analysis) {
        const query = `
      INSERT INTO assessment_analyses (session_id, analysis_data, analysis_type, created_at)
      VALUES ($1, $2, $3, $4)
    `;
        await this.databaseService.query(query, [
            sessionId,
            JSON.stringify(analysis),
            analysis.type,
            new Date()
        ]);
    }
    async generatePreliminaryAnalysis(data, assessmentType) {
        // 生成初步分析结果
        const analysis = {
            assessment_type: assessmentType,
            completeness_score: this.calculateCompletenessScore(data),
            risk_indicators: this.identifyRiskIndicators(data),
            strengths: this.identifyStrengths(data),
            areas_of_concern: this.identifyAreasOfConcern(data)
        };
        return analysis;
    }
    async getAssessmentHistoryByPatient(patientId, options) {
        const { page, limit, assessmentType } = options;
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE s.patient_id = $1';
        let params = [patientId];
        if (assessmentType) {
            whereClause += ' AND a.assessment_type = $2';
            params.push(assessmentType);
        }
        const query = `
      SELECT a.*, s.patient_id, s.session_type, s.started_at as session_started
      FROM assessments a
      JOIN sessions s ON a.session_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);
        const assessments = await this.databaseService.query(query, params);
        const countQuery = `
      SELECT COUNT(*) as total
      FROM assessments a
      JOIN sessions s ON a.session_id = s.id
      ${whereClause}
    `;
        const countResult = await this.databaseService.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult[0].total);
        return {
            assessments,
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
    async getAssessmentDataBySession(sessionId) {
        const query = 'SELECT * FROM assessments WHERE session_id = $1 ORDER BY created_at ASC';
        const result = await this.databaseService.query(query, [sessionId]);
        return result;
    }
    // 评估计算方法
    assessMemoryPerformance(cognitiveIndicators) {
        return {
            score: cognitiveIndicators.memory_score,
            level: this.categorizeScore(cognitiveIndicators.memory_score),
            notes: this.generateMemoryNotes(cognitiveIndicators.memory_score)
        };
    }
    assessAttentionPerformance(cognitiveIndicators) {
        return {
            score: cognitiveIndicators.attention_score,
            level: this.categorizeScore(cognitiveIndicators.attention_score),
            notes: this.generateAttentionNotes(cognitiveIndicators.attention_score)
        };
    }
    assessLanguagePerformance(cognitiveIndicators) {
        return {
            score: cognitiveIndicators.language_score,
            level: this.categorizeScore(cognitiveIndicators.language_score),
            notes: this.generateLanguageNotes(cognitiveIndicators.language_score)
        };
    }
    assessMoodStability(emotionalSummary) {
        return {
            stability_score: emotionalSummary.stability_score,
            level: this.categorizeStability(emotionalSummary.stability_score),
            dominant_emotion: emotionalSummary.dominant_emotion
        };
    }
    identifyEmotionalPatterns(emotionalSummary) {
        const patterns = [];
        if (emotionalSummary.stability_score < 0.5) {
            patterns.push('情绪波动较大');
        }
        if (emotionalSummary.dominant_emotion === 'sadness') {
            patterns.push('低落情绪偏多');
        }
        return patterns;
    }
    calculateOverallAssessmentScore(analysis) {
        const cognitiveScore = this.calculateOverallCognitiveScore(analysis.cognitive_indicators);
        const emotionalScore = analysis.emotional_summary.stability_score;
        const socialScore = analysis.social_engagement.initiative_score;
        return (cognitiveScore + emotionalScore + socialScore) / 3;
    }
    calculateOverallCognitiveScore(cognitiveIndicators) {
        const { memory_score, attention_score, language_score } = cognitiveIndicators;
        return (memory_score + attention_score + language_score) / 3;
    }
    assessCognitiveRisk(analysis) {
        const overallScore = this.calculateOverallAssessmentScore(analysis);
        if (overallScore > 0.7) {
            return '低风险';
        }
        else if (overallScore > 0.4) {
            return '中等风险';
        }
        else {
            return '高风险';
        }
    }
    categorizeSocialEngagement(socialEngagement) {
        const score = socialEngagement.initiative_score;
        if (score > 0.7)
            return '高度参与';
        if (score > 0.4)
            return '中等参与';
        return '低度参与';
    }
    generateKeyObservations(analysis) {
        const observations = [];
        const cognitiveScore = this.calculateOverallCognitiveScore(analysis.cognitive_indicators);
        if (cognitiveScore > 0.7) {
            observations.push('认知功能表现良好');
        }
        else if (cognitiveScore < 0.5) {
            observations.push('认知功能需要关注');
        }
        if (analysis.emotional_summary.stability_score < 0.5) {
            observations.push('情绪状态不稳定');
        }
        return observations;
    }
    generateNextSteps(analysis, assessmentType) {
        const nextSteps = [];
        if (assessmentType === 'basic') {
            nextSteps.push('建议进行更详细的认知评估');
        }
        if (analysis.emotional_summary.dominant_emotion === 'sadness') {
            nextSteps.push('建议增加情感支持对话');
        }
        return nextSteps;
    }
    recommendConversationType(analysis) {
        if (analysis.areas_of_concern.length > 2) {
            return '支持性对话';
        }
        return '常规对话';
    }
    estimateConversationDuration(analysis) {
        // 根据分析结果估算对话时长（分钟）
        const baseTime = 15;
        const complexityFactor = analysis.areas_of_concern.length * 5;
        return baseTime + complexityFactor;
    }
    // 辅助方法
    calculateBasicInfoCompleteness(data) {
        const requiredFields = ['name', 'age', 'symptoms', 'duration'];
        const completedFields = requiredFields.filter(field => data[field]);
        return completedFields.length / requiredFields.length;
    }
    calculateCognitiveTestScore(data) {
        // 模拟认知测试计分
        return 0.7 + Math.random() * 0.2;
    }
    calculateEmotionalStateScore(data) {
        // 模拟情绪状态计分
        return 0.6 + Math.random() * 0.3;
    }
    calculateCompletenessScore(data) {
        const totalFields = Object.keys(data).length;
        const completedFields = Object.values(data).filter(value => value && value !== '').length;
        return completedFields / totalFields;
    }
    identifyRiskIndicators(data) {
        const indicators = [];
        if (data.memory_issues === true) {
            indicators.push('记忆力问题');
        }
        if (data.confusion_episodes === true) {
            indicators.push('意识混乱发作');
        }
        return indicators;
    }
    identifyStrengths(data) {
        const strengths = [];
        if (data.social_interaction === 'good') {
            strengths.push('社交互动能力良好');
        }
        if (data.family_support === 'strong') {
            strengths.push('家庭支持充分');
        }
        return strengths;
    }
    identifyAreasOfConcern(data) {
        const concerns = [];
        if (data.daily_activities === 'difficult') {
            concerns.push('日常生活能力下降');
        }
        if (data.mood === 'depressed') {
            concerns.push('情绪低落');
        }
        return concerns;
    }
    categorizeScore(score) {
        if (score > 0.8)
            return '优秀';
        if (score > 0.6)
            return '良好';
        if (score > 0.4)
            return '一般';
        return '需改进';
    }
    categorizeStability(score) {
        if (score > 0.7)
            return '稳定';
        if (score > 0.4)
            return '较稳定';
        return '不稳定';
    }
    generateMemoryNotes(score) {
        if (score > 0.7)
            return '记忆功能表现良好，继续保持';
        if (score > 0.4)
            return '记忆功能有轻度下降，建议增加记忆训练';
        return '记忆功能明显受损，需要专业干预';
    }
    generateAttentionNotes(score) {
        if (score > 0.7)
            return '注意力集中度良好';
        if (score > 0.4)
            return '注意力集中有些困难，建议注意力训练';
        return '注意力集中困难显著，需要专业评估';
    }
    generateLanguageNotes(score) {
        if (score > 0.7)
            return '语言表达能力正常';
        if (score > 0.4)
            return '语言表达有轻度影响，需要更多耐心';
        return '语言表达能力受损，建议语言治疗';
    }
}
exports.AssessmentController = AssessmentController;
//# sourceMappingURL=assessment.js.map