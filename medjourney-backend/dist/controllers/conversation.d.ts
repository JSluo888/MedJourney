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
    private stepfunService;
    private tenService;
    private conversationAnalyzer;
    private activeConnections;
    constructor();
    startConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    sendMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
    getConversationAnalysis(req: AuthenticatedRequest, res: Response): Promise<void>;
    private generateAIResponse;
    private calculateHealthScore;
    private getEmotionScore;
    private handleAudioChunk;
    private processTextMessage;
    getActiveConnectionsCount(): number;
    closeAllConnections(): void;
    getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    getStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    endConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    private generateSessionSummary;
}
export declare const conversationController: ConversationController;
export {};
//# sourceMappingURL=conversation.d.ts.map