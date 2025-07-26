import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        patient_id: string;
        role: string;
    };
}
export declare class AssessmentController {
    private analyzerService;
    private databaseService;
    constructor();
    analyzeAssessment(req: AuthenticatedRequest, res: Response): Promise<void>;
    submitAssessmentData(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAssessmentHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAssessmentReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    private getSessionById;
    private processAssessmentData;
    private saveAssessmentData;
    private saveAssessmentAnalysis;
    private generatePreliminaryAnalysis;
    private getAssessmentHistoryByPatient;
    private getAssessmentDataBySession;
    private assessMemoryPerformance;
    private assessAttentionPerformance;
    private assessLanguagePerformance;
    private assessMoodStability;
    private identifyEmotionalPatterns;
    private calculateOverallAssessmentScore;
    private calculateOverallCognitiveScore;
    private assessCognitiveRisk;
    private categorizeSocialEngagement;
    private generateKeyObservations;
    private generateNextSteps;
    private recommendConversationType;
    private estimateConversationDuration;
    private calculateBasicInfoCompleteness;
    private calculateCognitiveTestScore;
    private calculateEmotionalStateScore;
    private calculateCompletenessScore;
    private identifyRiskIndicators;
    private identifyStrengths;
    private identifyAreasOfConcern;
    private categorizeScore;
    private categorizeStability;
    private generateMemoryNotes;
    private generateAttentionNotes;
    private generateLanguageNotes;
}
export {};
//# sourceMappingURL=assessment.d.ts.map