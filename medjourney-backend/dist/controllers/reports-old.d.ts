import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        patient_id: string;
        role: string;
    };
}
export declare class ReportsController {
    private analyzerService;
    private databaseService;
    constructor();
    generateReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReportsList(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    shareReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    downloadReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReportSharing(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    private getSessionById;
    private saveReport;
    private generateChartsData;
    private generateEmotionalTrendsChart;
    private generateCognitiveScoresChart;
    private generateSocialEngagementChart;
    private generatePDFReport;
    private generateHTMLReport;
    private getReportsForPatient;
    private getReportById;
    private checkReportAccess;
    private checkSharePermission;
    private checkDeletePermission;
    private createShareRecord;
    private generateShareUrl;
    private generatePDFBuffer;
    private generateExcelBuffer;
    private logDownload;
    private getReportSharingInfo;
    private softDeleteReport;
}
export {};
//# sourceMappingURL=reports-old.d.ts.map