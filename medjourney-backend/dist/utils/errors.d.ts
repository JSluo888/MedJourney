import { AppError } from '../types';
export declare class CustomError extends Error implements AppError {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
export declare class ValidationError extends CustomError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends CustomError {
    constructor(resource: string);
}
export declare class UnauthorizedError extends CustomError {
    constructor(message?: string);
}
export declare class ForbiddenError extends CustomError {
    constructor(message?: string);
}
export declare class ConflictError extends CustomError {
    constructor(message: string);
}
export declare class RateLimitError extends CustomError {
    constructor();
}
export declare class ServiceUnavailableError extends CustomError {
    constructor(service: string);
}
export declare class DatabaseError extends CustomError {
    constructor(message: string, originalError?: Error);
}
export declare class AIServiceError extends CustomError {
    constructor(message: string, service?: string);
}
export declare class FileUploadError extends CustomError {
    constructor(message: string);
}
export declare class ErrorHandler {
    static isOperationalError(error: Error): boolean;
    static toApiResponse(error: Error, requestId?: string): {
        success: boolean;
        error: any;
    };
    static getStatusCode(error: Error): number;
    static logError(error: Error, context?: any): void;
    static handleAsyncError(fn: Function): (req: any, res: any, next: any) => void;
    static expressErrorHandler(): (error: Error, req: any, res: any, next: any) => void;
    static setupGlobalHandlers(): void;
}
export declare class ValidationHelper {
    static required(value: any, fieldName: string): void;
    static stringLength(value: string, min: number, max: number, fieldName: string): void;
    static email(value: string, fieldName?: string): void;
    static numberRange(value: number, min: number, max: number, fieldName: string): void;
    static uuid(value: string, fieldName: string): void;
    static array(value: any, fieldName: string, minLength?: number, maxLength?: number): void;
}
export default ErrorHandler;
//# sourceMappingURL=errors.d.ts.map