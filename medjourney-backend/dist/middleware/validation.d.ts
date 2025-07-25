import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePatientCreation: any[];
export declare const validatePatientUpdate: any[];
export declare const validateSessionCreation: any[];
export declare const validateMessageSend: any[];
export declare const validateMedicalHistoryImport: any[];
export declare const validateFamilyScore: any[];
export declare const validateIdParam: (paramName?: string) => any[];
export declare const validatePagination: any[];
export declare const validateDateRange: any[];
export declare const validateSearch: any[];
export declare const validateFileUpload: any[];
declare const _default: {
    handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
    validatePatientCreation: any[];
    validatePatientUpdate: any[];
    validateSessionCreation: any[];
    validateMessageSend: any[];
    validateMedicalHistoryImport: any[];
    validateFamilyScore: any[];
    validateIdParam: (paramName?: string) => any[];
    validatePagination: any[];
    validateDateRange: any[];
    validateSearch: any[];
    validateFileUpload: any[];
};
export default _default;
//# sourceMappingURL=validation.d.ts.map