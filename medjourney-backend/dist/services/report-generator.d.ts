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
export declare class ReportGeneratorService {
    private stepfunService;
    private conversationAnalyzer;
    constructor();
    generateDetailedReport(sessionId: string): Promise<DetailedReport>;
    private analyzeConversation;
    private performCognitiveAssessment;
    private analyzeEmotionalState;
    private generateRecommendations;
    private generateOverallAssessment;
    private extractKeyFindings;
    private calculateHealthScore;
    private getEmotionScore;
    private getCommunicationScore;
    private getDefaultCognitiveAssessment;
    private getDefaultRecommendations;
    private calculateConversationQuality;
    private identifyBehavioralPatterns;
    private calculateDuration;
    generateFamilySummary(sessionId: string): Promise<{
        health_score: number;
        emotional_state: string;
        key_insight: string;
        recommendations: string[];
        timestamp: string;
    }>;
    exportReportToPDF(reportId: string): Promise<string>;
}
export declare const reportGeneratorService: ReportGeneratorService;
export {};
//# sourceMappingURL=report-generator.d.ts.map