import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        patient_id: string;
        role: string;
    };
}
export declare class SpeechController {
    private elevenLabsService;
    constructor();
    synthesizeSpeech(req: AuthenticatedRequest, res: Response): Promise<void>;
    streamSpeech(req: AuthenticatedRequest, res: Response): Promise<void>;
    getVoices(req: AuthenticatedRequest, res: Response): Promise<void>;
    getStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=speech.d.ts.map