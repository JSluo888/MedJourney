import { ConversationAnalyzer, EmotionAnalyzer } from '../types/services';
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
declare class EmotionAnalyzerImpl implements EmotionAnalyzer {
    private stepfunService;
    constructor();
    analyzeText(text: string): Promise<{
        primary_emotion: string;
        emotions: Record<string, number>;
        sentiment_score: number;
        confidence: number;
    }>;
    analyzeVoice(audioBuffer: ArrayBuffer): Promise<{
        emotions: Record<string, number>;
        energy_level: number;
        speech_rate: number;
        confidence: number;
    }>;
    aggregateEmotions(emotions: Array<any>, timeframe: string): Promise<{
        trends: Record<string, number>;
        patterns: string[];
        stability: number;
    }>;
    private calculateSentimentScore;
    private fallbackTextAnalysis;
    private calculateEmotionTrends;
    private identifyEmotionPatterns;
    private calculateEmotionStability;
}
declare class ConversationAnalyzerImpl implements ConversationAnalyzer {
    private stepfunService;
    private emotionAnalyzer;
    private databaseService;
    constructor();
    analyzeSession(sessionId: string): Promise<AnalysisResult>;
    generateReport(sessionId: string, reportType: 'family' | 'doctor'): Promise<{
        summary: string;
        key_insights: string[];
        trends: any;
        recommendations: string[];
        charts_data: any[];
    }>;
    private getSessionMessages;
    private analyzeEmotionalSummary;
    private analyzeCognitiveIndicators;
    private analyzeSocialEngagement;
    private generateRecommendations;
    private generateFamilyReport;
    private generateDoctorReport;
    private calculateMemoryScore;
    private calculateAttentionScore;
    private calculateLanguageScore;
    private calculateResponseTimeAvg;
    private countUserInitiatedTurns;
    private calculateTopicCoherence;
    private assessCognitiveDeclineRisk;
}
declare class ConversationAnalyzerFactory {
    private static instance;
    static create(): ConversationAnalyzer;
    static getInstance(): ConversationAnalyzer | null;
    static reset(): void;
}
export { ConversationAnalyzerFactory, EmotionAnalyzerImpl, ConversationAnalyzerImpl };
export default ConversationAnalyzerFactory;
//# sourceMappingURL=conversation-analyzer.d.ts.map