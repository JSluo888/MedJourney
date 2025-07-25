import { Patient, Session, Message, HealthScore } from './index';
export interface DatabaseService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
}
export interface StorageService {
    uploadFile(file: Express.Multer.File, bucket: string): Promise<{
        url: string;
        filename: string;
        size: number;
    }>;
    deleteFile(filename: string, bucket: string): Promise<boolean>;
    getFileUrl(filename: string, bucket: string): Promise<string>;
    listFiles(bucket: string, prefix?: string): Promise<string[]>;
}
export interface AIService {
    generateResponse(prompt: string, context?: any): Promise<{
        response: string;
        confidence: number;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    analyzeEmotion(text: string): Promise<{
        emotion: string;
        confidence: number;
        emotions: Record<string, number>;
    }>;
    extractEntities(text: string): Promise<{
        entities: Array<{
            text: string;
            label: string;
            confidence: number;
        }>;
    }>;
}
export interface RAGService {
    initialize(): Promise<void>;
    addDocuments(documents: Array<{
        content: string;
        metadata: Record<string, any>;
    }>): Promise<void>;
    query(question: string, options?: {
        topK?: number;
        threshold?: number;
        filter?: Record<string, any>;
    }): Promise<{
        answer: string;
        sources: Array<{
            content: string;
            metadata: Record<string, any>;
            score: number;
        }>;
        confidence: number;
    }>;
    updateIndex(): Promise<void>;
}
export interface ContextStoreService {
    storeContext(sessionId: string, context: {
        patient: Patient;
        session: Session;
        recentMessages: Message[];
        medicalHistory: string;
    }): Promise<void>;
    getContext(sessionId: string): Promise<{
        patient: Patient;
        session: Session;
        recentMessages: Message[];
        medicalHistory: string;
    } | null>;
    updateContext(sessionId: string, updates: Partial<any>): Promise<void>;
    clearContext(sessionId: string): Promise<void>;
}
export interface QuestionEngineService {
    generateNextQuestion(context: {
        patient: Patient;
        session: Session;
        recentMessages: Message[];
        medicalHistory: string;
    }): Promise<{
        question: string;
        category: 'assessment' | 'emotional' | 'cognitive' | 'social';
        reasoning: string;
        followUp: string[];
    }>;
    analyzeResponse(question: string, response: string, context: any): Promise<{
        understanding: number;
        emotional_state: string;
        cognitive_indicators: string[];
        next_recommendations: string[];
    }>;
}
export interface FamilyScorerService {
    calculateHealthScore(data: {
        messages: Message[];
        session: Session;
        patientHistory: string;
    }): Promise<HealthScore>;
    generateInsights(scores: HealthScore[], timeframe: 'daily' | 'weekly' | 'monthly'): Promise<{
        trends: {
            overall: 'improving' | 'stable' | 'declining';
            cognitive: 'improving' | 'stable' | 'declining';
            emotional: 'improving' | 'stable' | 'declining';
        };
        insights: string[];
        recommendations: string[];
    }>;
    comparePeriods(current: HealthScore, previous: HealthScore): Promise<{
        changes: Record<string, number>;
        significantChanges: string[];
        interpretation: string;
    }>;
}
export interface ReportGeneratorService {
    generateDoctorReport(sessionId: string, options?: {
        includeCharts?: boolean;
        format?: 'json' | 'pdf';
    }): Promise<{
        report: any;
        charts?: Array<{
            type: string;
            data: any;
            options: any;
        }>;
        pdfUrl?: string;
    }>;
    generateFamilyReport(sessionId: string): Promise<{
        summary: string;
        scores: HealthScore;
        trends: any;
        recommendations: string[];
        pdfUrl?: string;
    }>;
    exportToPDF(data: any, template: string): Promise<{
        filename: string;
        url: string;
        size: number;
    }>;
}
export interface TENFrameworkService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    sendMessage(message: {
        type: 'text' | 'audio' | 'image';
        content: string | ArrayBuffer;
        sessionId: string;
    }): Promise<{
        messageId: string;
        status: 'sent' | 'delivered' | 'failed';
    }>;
    onMessage(callback: (message: {
        messageId: string;
        type: 'text' | 'audio';
        content: string;
        confidence: number;
        sessionId: string;
    }) => void): void;
    onStatusChange(callback: (status: {
        sessionId: string;
        status: 'idle' | 'listening' | 'processing' | 'speaking';
    }) => void): void;
}
export interface LoggerService {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    debug(message: string, meta?: any): void;
    audit(action: string, userId: string, details: any): void;
}
export interface CacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(pattern?: string): Promise<number>;
    exists(key: string): Promise<boolean>;
}
export interface NotificationService {
    sendEmail(to: string, subject: string, template: string, data: any): Promise<boolean>;
    sendSMS(to: string, message: string): Promise<boolean>;
    pushNotification(userId: string, title: string, body: string, data?: any): Promise<boolean>;
}
export interface MetricsService {
    recordRequest(endpoint: string, method: string, statusCode: number, responseTime: number): void;
    recordError(error: Error, context?: any): void;
    recordCustomMetric(name: string, value: number, tags?: Record<string, string>): void;
    getMetrics(): Promise<{
        requests: {
            total: number;
            success_rate: number;
            average_response_time: number;
        };
        errors: {
            total: number;
            rate: number;
            by_type: Record<string, number>;
        };
        custom: Record<string, any>;
    }>;
}
//# sourceMappingURL=services.d.ts.map