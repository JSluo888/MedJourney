import { Request, Response, NextFunction } from 'express';
declare class SessionController {
    private databaseService;
    private aiService;
    private ragService;
    constructor();
    private initializeRAGService;
    createSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPatientSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSessionMessages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    sendMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private generateWelcomeMessage;
    private generateAIResponse;
}
declare const _default: SessionController;
export default _default;
//# sourceMappingURL=session.d.ts.map