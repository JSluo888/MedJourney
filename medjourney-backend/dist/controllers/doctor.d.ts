import { Request, Response, NextFunction } from 'express';
declare class DoctorController {
    private databaseService;
    private aiService;
    getDoctorDashboard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPatientReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    generateDoctorReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDoctorReports: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    downloadReportPDF: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private getPeriodRange;
    private getLatestFamilyScore;
    private getDashboardStats;
    private analyzePatientData;
    private generateMedicalInsights;
    private calculateAvgSessionDuration;
    private calculateActivityLevel;
    private getReportData;
    private generateReportContent;
    private generatePDF;
}
declare const _default: DoctorController;
export default _default;
//# sourceMappingURL=doctor.d.ts.map