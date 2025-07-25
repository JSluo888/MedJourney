import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../types/services';
import { Patient, Session, Message, MedicalHistory, FamilyScore, DoctorReport } from '../types';
declare class MockDatabase {
    private patients;
    private sessions;
    private messages;
    private histories;
    private familyScores;
    private doctorReports;
    private connected;
    constructor();
    private initializeMockData;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
    createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient>;
    getPatient(id: string): Promise<Patient | null>;
    updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null>;
    createMedicalHistory(history: Omit<MedicalHistory, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalHistory>;
    getMedicalHistory(patientId: string): Promise<MedicalHistory[]>;
    createSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session>;
    getSession(id: string): Promise<Session | null>;
    getSessionsByPatient(patientId: string): Promise<Session[]>;
    updateSession(id: string, updates: Partial<Session>): Promise<Session | null>;
    createMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message>;
    getMessagesBySession(sessionId: string, limit?: number): Promise<Message[]>;
    createFamilyScore(score: Omit<FamilyScore, 'id' | 'created_at' | 'updated_at'>): Promise<FamilyScore>;
    getFamilyScoreBySession(sessionId: string): Promise<FamilyScore | null>;
    createDoctorReport(report: Omit<DoctorReport, 'id' | 'created_at' | 'updated_at'>): Promise<DoctorReport>;
    getDoctorReportBySession(sessionId: string): Promise<DoctorReport | null>;
    getStats(): Promise<any>;
}
declare class SupabaseService implements DatabaseService {
    private client;
    private connected;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
    getClient(): SupabaseClient;
    createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient>;
    getPatient(id: string): Promise<Patient | null>;
}
declare class DatabaseServiceFactory {
    private static instance;
    static create(): Promise<DatabaseService>;
    static getInstance(): DatabaseService | null;
    static reset(): Promise<void>;
}
export { DatabaseServiceFactory, MockDatabase, SupabaseService };
export default DatabaseServiceFactory;
//# sourceMappingURL=database.d.ts.map