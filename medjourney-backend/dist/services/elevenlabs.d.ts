import { ElevenLabsService } from '../types/services';
declare class ElevenLabsServiceImpl implements ElevenLabsService {
    private apiKey;
    private voiceId;
    private modelId;
    private baseURL;
    constructor();
    synthesizeSpeech(text: string, options?: {
        voice_id?: string;
        model_id?: string;
        voice_settings?: {
            stability?: number;
            similarity_boost?: number;
        };
    }): Promise<{
        audio_url: string;
        audio_data: ArrayBuffer;
        duration_ms: number;
    }>;
    streamSpeech(text: string, options?: any): AsyncIterableIterator<{
        audio_chunk: ArrayBuffer;
        is_final: boolean;
    }>;
    getVoices(): Promise<Array<{
        voice_id: string;
        name: string;
        category: string;
        language: string;
    }>>;
    private splitTextIntoChunks;
    private generateTempAudioUrl;
    healthCheck(): Promise<boolean>;
    getStats(): any;
}
declare class ElevenLabsServiceFactory {
    private static instance;
    static create(): ElevenLabsService;
    static getInstance(): ElevenLabsService | null;
    static reset(): void;
}
export { ElevenLabsServiceFactory, ElevenLabsServiceImpl };
export default ElevenLabsServiceFactory;
//# sourceMappingURL=elevenlabs.d.ts.map