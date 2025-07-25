import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsConfig: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const rateLimiter: any;
export declare const apiRateLimiter: any;
export declare const compressionConfig: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const healthCheck: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export { authenticateToken, authorize, optionalAuth, validatePatientAccess, generateToken, verifyToken, refreshToken, revokeToken } from './auth';
export { handleValidationErrors, validatePatientCreation, validatePatientUpdate, validateSessionCreation, validateMessageSend, validateMedicalHistoryImport, validateFamilyScore, validateIdParam, validatePagination, validateDateRange, validateSearch, validateFileUpload } from './validation';
declare const _default: {
    requestId: (req: Request, res: Response, next: NextFunction) => void;
    requestLogger: (req: Request, res: Response, next: NextFunction) => void;
    corsConfig: (req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void;
    securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    rateLimiter: any;
    apiRateLimiter: any;
    compressionConfig: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    healthCheck: (req: Request, res: Response, next: NextFunction) => void;
    errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
    notFoundHandler: (req: Request, res: Response) => void;
};
export default _default;
//# sourceMappingURL=index.d.ts.map