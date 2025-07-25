import { Request, Response, NextFunction } from 'express';
declare class FamilyController {
    private databaseService;
    private aiService;
    getFamilySummary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    submitFamilyScore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getFamilyScoreHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getFamilyScoreTrend: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private getPeriodRange;
    private getLatestFamilyScore;
    private getSessionStats;
    private getEmotionTrend;
    private getActivityStats;
    private generateInsight;
    private aggregateScoresByGranularity;
}
declare const _default: FamilyController;
export default _default;
//# sourceMappingURL=family.d.ts.map