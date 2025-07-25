import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
            patient_id?: string;
            requestId?: string;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePatientAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const refreshToken: (oldToken: string) => string;
export declare const revokeToken: (token: string) => void;
declare const _default: {
    authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
    authorize: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
    validatePatientAccess: (req: Request, res: Response, next: NextFunction) => void;
    generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
    verifyToken: (token: string) => JWTPayload;
    refreshToken: (oldToken: string) => string;
    revokeToken: (token: string) => void;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map