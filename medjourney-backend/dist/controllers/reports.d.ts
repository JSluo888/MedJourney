import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        patient_id: string;
        role: string;
        iat: number;
        exp: number;
    };
}
export declare class ReportsController {
    private analyzerService;
    constructor();
    generateReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReportsList(req: AuthenticatedRequest, res: Response): Promise<void>;
    shareReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    generateFamilySummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    private generateChartsData;
    private generateHTMLReport;
    private getScoreColor;
    getReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReportSharing(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    downloadReport(req: Request, res: Response): Promise<void>;
}
export declare const reportsController: ReportsController;
export {};
//# sourceMappingURL=reports.d.ts.map