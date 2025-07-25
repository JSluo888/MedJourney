import { Response } from 'express';
declare class ResponseHelper {
    static success<T>(res: Response, data: T, message?: string): void;
    static paginated<T>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, message?: string): void;
    static created<T>(res: Response, data: T, message?: string): void;
    static noContent(res: Response): void;
    static error(res: Response, message?: string, statusCode?: number, details?: any): void;
    static validationError(res: Response, message?: string, errors?: any[]): void;
    static unauthorized(res: Response, message?: string): void;
    static forbidden(res: Response, message?: string): void;
    static notFound(res: Response, message?: string): void;
    static conflict(res: Response, message?: string): void;
    static tooManyRequests(res: Response, message?: string): void;
    static internalError(res: Response, message?: string): void;
    static stream(res: Response, stream: NodeJS.ReadableStream, contentType: string, filename?: string): void;
    static download(res: Response, filePath: string, filename?: string): void;
    static sse(res: Response, data: any, event?: string): void;
    static health(res: Response, status?: 'healthy' | 'unhealthy', details?: any): void;
}
export default ResponseHelper;
//# sourceMappingURL=response.d.ts.map