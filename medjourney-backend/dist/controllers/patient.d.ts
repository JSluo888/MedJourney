import { Request, Response, NextFunction } from 'express';
declare class PatientController {
    private databaseService;
    createPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updatePatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deletePatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listPatients: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCurrentPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
declare const _default: PatientController;
export default _default;
//# sourceMappingURL=patient.d.ts.map