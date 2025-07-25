import { LoggerService } from '../types/services';
declare class Logger implements LoggerService {
    private winston;
    private requestIdStore;
    constructor();
    setRequestId(requestId: string, context: string): void;
    clearRequestId(requestId: string): void;
    private getContext;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    debug(message: string, meta?: any): void;
    audit(action: string, userId: string, details: any): void;
    performance(operation: string, duration: number, meta?: any): void;
    http(method: string, url: string, statusCode: number, responseTime: number, meta?: any): void;
    database(operation: string, table: string, duration: number, success: boolean, meta?: any): void;
    ai(operation: string, model: string, tokens: number, duration: number, meta?: any): void;
    security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void;
}
export declare const logger: Logger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map