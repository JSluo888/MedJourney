import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        patient_id: string;
        role: string;
        iat: number;
        exp: number;
    };
}
export declare class ConversationController {
    private tenService;
    private analyzerService;
    private databaseService;
    private activeConnections;
    constructor();
    startConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    sendMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    getStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    endConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    handleWebSocket(req: Request, res: Response): Promise<void>;
    private initializeTENFramework;
    private handleTENMessage;
    private handleTENStatusChange;
    private broadcastToWebSocket;
    private createSession;
    private getSessionById;
    private updateSession;
    private saveMessage;
    private getMessagesBySessionId;
    private getMessageCount;
    private getSessionIdByTenSessionId;
    private calculateOverallCognitiveScore;
}
export {};
//# sourceMappingURL=conversation-old.d.ts.map