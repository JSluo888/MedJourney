import { StepfunAIService } from '../types/services';
declare class StepfunAIServiceImpl implements StepfunAIService {
    private client;
    private model;
    private temperature;
    constructor();
    generateResponse(prompt: string, context?: any): Promise<{
        response: string;
        confidence: number;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    streamResponse(prompt: string, context?: any): AsyncIterableIterator<{
        delta: string;
        done: boolean;
    }>;
    analyzeEmotion(text: string): Promise<{
        emotion: string;
        confidence: number;
        emotions: Record<string, number>;
    }>;
    private buildMessages;
    private buildSystemPrompt;
    private fallbackEmotionAnalysis;
    healthCheck(): Promise<boolean>;
    getStats(): any;
}
declare class StepfunServiceFactory {
    private static instance;
    static create(): StepfunAIService;
    static getInstance(): StepfunAIService | null;
    static reset(): void;
}
export { StepfunServiceFactory, StepfunAIServiceImpl };
export default StepfunServiceFactory;
//# sourceMappingURL=stepfun.d.ts.map