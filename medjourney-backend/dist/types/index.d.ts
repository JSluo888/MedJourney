export interface BaseEntity {
    id: string;
    created_at: Date;
    updated_at: Date;
}
export interface Patient extends BaseEntity {
    name: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    email?: string;
    phone?: string;
    emergency_contact?: string;
    medical_history?: string;
    avatar_url?: string;
}
export interface MedicalHistory extends BaseEntity {
    patient_id: string;
    text_content: string;
    images?: string[];
    uploaded_files?: UploadedFile[];
    created_by?: string;
}
export interface UploadedFile {
    id: string;
    filename: string;
    original_name: string;
    mimetype: string;
    size: number;
    url: string;
    uploaded_at: Date;
}
export interface Session extends BaseEntity {
    patient_id: string;
    prior_history?: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    started_at: Date;
    ended_at?: Date;
    session_type: 'chat' | 'assessment' | 'therapy' | 'general';
    metadata?: Record<string, any>;
}
export type MessageType = 'text' | 'audio' | 'image' | 'system' | 'assessment';
export type MessageSender = 'user' | 'assistant' | 'system';
export interface Message extends BaseEntity {
    session_id: string;
    type: MessageType;
    content: string;
    sender: MessageSender;
    timestamp: Date;
    metadata?: {
        audio_url?: string;
        image_url?: string;
        duration?: number;
        confidence_score?: number;
        emotional_state?: string;
        response_time?: number;
        [key: string]: any;
    };
}
export interface HealthScore {
    overall: number;
    cognitive: number;
    emotional: number;
    social: number;
    physical?: number;
}
export interface FamilyScore extends BaseEntity {
    session_id: string;
    patient_id: string;
    health_score: HealthScore;
    mental_score: number;
    insights: string[];
    trends: {
        period: string;
        improvement: boolean;
        key_changes: string[];
    };
    generated_by: 'ai' | 'manual';
}
export interface DoctorReport extends BaseEntity {
    session_id: string;
    patient_id: string;
    symptoms_data: {
        frequency: Record<string, number>;
        severity: Record<string, number>;
        patterns: string[];
    };
    emotion_trends: {
        positive_ratio: number;
        negative_ratio: number;
        neutral_ratio: number;
        dominant_emotions: string[];
        stability_score: number;
    };
    memory_tests: {
        short_term: number;
        long_term: number;
        working_memory: number;
        recall_accuracy: number;
    };
    cognitive_assessment: {
        attention: number;
        language: number;
        orientation: number;
        executive_function: number;
        overall_mmse_score: number;
    };
    analysis: {
        summary: string;
        concerns: string[];
        improvements: string[];
        recommendations: string[];
    };
    generated_at: Date;
    report_type: 'daily' | 'weekly' | 'monthly' | 'session';
}
export interface AIAnalysis {
    emotional_state: 'positive' | 'negative' | 'neutral' | 'mixed';
    cognitive_performance: number;
    response_time: number;
    conversation_quality: number;
    key_topics: string[];
    concerns: string[];
    insights: string[];
}
export interface RAGResult {
    question: string;
    context: string[];
    confidence: number;
    sources: string[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: Date;
        version: string;
        request_id: string;
    };
}
export interface PaginationParams {
    page: number;
    limit: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
export interface AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
}
export interface JWTPayload {
    patient_id: string;
    email?: string;
    role: 'patient' | 'family' | 'doctor' | 'admin';
    iat: number;
    exp: number;
}
export interface RequestContext {
    patient_id: string;
    session_id?: string;
    user_agent?: string;
    ip_address?: string;
    request_id: string;
}
export interface Config {
    server: {
        port: number;
        host: string;
        env: 'development' | 'production' | 'test';
    };
    database: {
        url: string;
        supabase_url: string;
        supabase_anon_key: string;
        supabase_service_key: string;
    };
    ai: {
        openai_api_key: string;
        openai_model: string;
        temperature: number;
        pinecone_api_key: string;
        pinecone_index: string;
    };
    storage: {
        max_file_size: number;
        allowed_types: string[];
        bucket_name: string;
    };
    security: {
        jwt_secret: string;
        jwt_expires_in: string;
        bcrypt_rounds: number;
        rate_limit: {
            window_ms: number;
            max_requests: number;
        };
    };
}
export interface TENMessage {
    type: 'text' | 'audio' | 'image' | 'control';
    content: string | ArrayBuffer;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface TENResponse {
    message_id: string;
    response_type: 'text' | 'audio';
    content: string;
    confidence: number;
    processing_time: number;
    emotions_detected?: string[];
}
export * from './api';
export * from './services';
//# sourceMappingURL=index.d.ts.map