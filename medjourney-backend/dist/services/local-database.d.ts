import { DatabaseService } from '../types/services';
interface Patient {
    id: string;
    name: string;
    age: number;
    medical_history?: string;
    created_at: string;
    updated_at: string;
}
interface ConversationSession {
    id: string;
    patient_id: string;
    session_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    metadata?: string;
}
interface ConversationMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    message_type: 'text' | 'audio' | 'image';
    emotion_analysis?: string;
    timestamp: string;
    metadata?: string;
}
interface HealthReport {
    id: string;
    session_id: string;
    patient_id: string;
    report_type: string;
    content: string;
    summary: string;
    recommendations: string;
    created_at: string;
    metadata?: string;
}
export declare class LocalDatabaseService implements DatabaseService {
    private db;
    private dbPath;
    constructor();
    private initializeTables;
    private insertTestData;
    createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient>;
    getPatient(patientId: string): Promise<Patient | null>;
    getPatients(): Promise<Patient[]>;
    createConversationSession(session: Omit<ConversationSession, 'id' | 'created_at' | 'updated_at'>): Promise<ConversationSession>;
    getConversationSession(sessionId: string): Promise<ConversationSession | null>;
    updateConversationSession(sessionId: string, updates: Partial<ConversationSession>): Promise<ConversationSession | null>;
    getConversationsByPatient(patientId: string): Promise<ConversationSession[]>;
    addConversationMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<ConversationMessage>;
    getConversationMessages(sessionId: string): Promise<ConversationMessage[]>;
    createHealthReport(report: Omit<HealthReport, 'id' | 'created_at'>): Promise<HealthReport>;
    getHealthReports(patientId: string): Promise<HealthReport[]>;
    getHealthReport(reportId: string): Promise<HealthReport | null>;
    getStatistics(): Promise<{
        patients: number;
        sessions: number;
        messages: number;
        reports: number;
    }>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const localDatabaseService: LocalDatabaseService;
export {};
//# sourceMappingURL=local-database.d.ts.map