import { AIService } from '../types/services';
interface EmotionAnalysis {
    emotion: string;
    confidence: number;
    emotions: Record<string, number>;
}
interface EntityExtraction {
    entities: Array<{
        text: string;
        label: string;
        confidence: number;
    }>;
}
declare class MockAIService implements AIService {
    private isAvailable;
    generateResponse(prompt: string, context?: any): Promise<{
        response: string;
        confidence: number;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    analyzeEmotion(text: string): Promise<EmotionAnalysis>;
    extractEntities(text: string): Promise<EntityExtraction>;
    private generateIntelligentResponse;
    private analyzeTextEmotion;
    private extractTextEntities;
    setAvailability(available: boolean): void;
}
declare class OpenAIService implements AIService {
    private apiKey;
    private baseURL;
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
    analyzeEmotion(text: string): Promise<EmotionAnalysis>;
    extractEntities(text: string): Promise<EntityExtraction>;
    private getSystemPrompt;
}
declare class AIServiceFactory {
    private static instance;
    static create(): AIService;
    static getInstance(): AIService | null;
    static reset(): void;
}
export { AIServiceFactory, MockAIService, OpenAIService };
export default AIServiceFactory;
//# sourceMappingURL=ai.d.ts.map