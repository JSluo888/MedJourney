// 数据库服务类 - 集成Supabase和模拟数据库

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';
import { DatabaseService } from '../types/services';
import { Patient, Session, Message, MedicalHistory, FamilyScore, DoctorReport } from '../types';

// 模拟数据存储
class MockDatabase {
  private patients: Map<string, Patient> = new Map();
  private sessions: Map<string, Session> = new Map();
  private messages: Map<string, Message> = new Map();
  private histories: Map<string, MedicalHistory> = new Map();
  private familyScores: Map<string, FamilyScore> = new Map();
  private doctorReports: Map<string, DoctorReport> = new Map();
  private connected: boolean = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // 初始化模拟数据
    const mockPatient: Patient = {
      id: 'patient_001',
      name: '王奶奶',
      age: 72,
      gender: 'female',
      email: 'wang.nainai@example.com',
      phone: '13800138001',
      emergency_contact: '王先生 (13800138002)',
      medical_history: '阿尔茨海默病早期，高血压，糖尿病',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    };
    
    this.patients.set(mockPatient.id, mockPatient);
    
    // 初始化模拟会话
    const mockSession: Session = {
      id: 'session_001',
      patient_id: mockPatient.id,
      status: 'active',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      session_type: 'chat',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updated_at: new Date()
    };
    
    this.sessions.set(mockSession.id, mockSession);
    
    logger.info('模拟数据库初始化完成', {
      patients: this.patients.size,
      sessions: this.sessions.size
    });
  }

  async connect(): Promise<void> {
    this.connected = true;
    logger.info('模拟数据库连接成功');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('模拟数据库连接已断开');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connected) {
      throw new DatabaseError('数据库未连接');
    }
    
    logger.debug('模拟数据库查询', { sql, params });
    
    // 模拟查询延迟
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
    
    return [] as T[];
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new DatabaseError('数据库未连接');
    }
    
    logger.debug('开始模拟数据库事务');
    
    try {
      const result = await callback(this);
      logger.debug('模拟数据库事务提交成功');
      return result;
    } catch (error) {
      logger.error('模拟数据库事务回滚', error);
      throw error;
    }
  }

  // 患者相关操作
  async createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const newPatient: Patient = {
      ...patient,
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.patients.set(newPatient.id, newPatient);
    logger.info('创建患者成功', { patientId: newPatient.id, name: newPatient.name });
    
    return newPatient;
  }

  async getPatient(id: string): Promise<Patient | null> {
    const patient = this.patients.get(id);
    logger.debug('查询患者', { patientId: id, found: !!patient });
    return patient || null;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const patient = this.patients.get(id);
    if (!patient) {
      return null;
    }
    
    const updatedPatient = {
      ...patient,
      ...updates,
      updated_at: new Date()
    };
    
    this.patients.set(id, updatedPatient);
    logger.info('更新患者成功', { patientId: id });
    
    return updatedPatient;
  }

  // 病史相关操作
  async createMedicalHistory(history: Omit<MedicalHistory, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalHistory> {
    const newHistory: MedicalHistory = {
      ...history,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.histories.set(newHistory.id, newHistory);
    logger.info('创建病史记录成功', { historyId: newHistory.id, patientId: newHistory.patient_id });
    
    return newHistory;
  }

  async getMedicalHistory(patientId: string): Promise<MedicalHistory[]> {
    const histories = Array.from(this.histories.values())
      .filter(h => h.patient_id === patientId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    logger.debug('查询病史记录', { patientId, count: histories.length });
    return histories;
  }

  // 会话相关操作
  async createSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> {
    const newSession: Session = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.sessions.set(newSession.id, newSession);
    logger.info('创建会话成功', { sessionId: newSession.id, patientId: newSession.patient_id });
    
    return newSession;
  }

  async getSession(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    logger.debug('查询会话', { sessionId: id, found: !!session });
    return session || null;
  }

  async getSessionsByPatient(patientId: string): Promise<Session[]> {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.patient_id === patientId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    logger.debug('查询患者会话', { patientId, count: sessions.length });
    return sessions;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      updated_at: new Date()
    };
    
    this.sessions.set(id, updatedSession);
    logger.info('更新会话成功', { sessionId: id });
    
    return updatedSession;
  }

  // 消息相关操作
  async createMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.messages.set(newMessage.id, newMessage);
    logger.debug('创建消息成功', { messageId: newMessage.id, sessionId: newMessage.session_id });
    
    return newMessage;
  }

  async getMessagesBySession(sessionId: string, limit?: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(m => m.session_id === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const result = limit ? messages.slice(-limit) : messages;
    logger.debug('查询会话消息', { sessionId, count: result.length, limit });
    
    return result;
  }

  // 家属评分操作
  async createFamilyScore(score: Omit<FamilyScore, 'id' | 'created_at' | 'updated_at'>): Promise<FamilyScore> {
    const newScore: FamilyScore = {
      ...score,
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.familyScores.set(newScore.id, newScore);
    logger.info('创建家属评分成功', { scoreId: newScore.id, sessionId: newScore.session_id });
    
    return newScore;
  }

  async getFamilyScoreBySession(sessionId: string): Promise<FamilyScore | null> {
    const score = Array.from(this.familyScores.values())
      .find(s => s.session_id === sessionId);
    
    logger.debug('查询家属评分', { sessionId, found: !!score });
    return score || null;
  }

  // 医生报告操作
  async createDoctorReport(report: Omit<DoctorReport, 'id' | 'created_at' | 'updated_at'>): Promise<DoctorReport> {
    const newReport: DoctorReport = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.doctorReports.set(newReport.id, newReport);
    logger.info('创建医生报告成功', { reportId: newReport.id, sessionId: newReport.session_id });
    
    return newReport;
  }

  async getDoctorReportBySession(sessionId: string): Promise<DoctorReport | null> {
    const report = Array.from(this.doctorReports.values())
      .find(r => r.session_id === sessionId);
    
    logger.debug('查询医生报告', { sessionId, found: !!report });
    return report || null;
  }

  // 统计信息
  async getStats(): Promise<any> {
    return {
      patients: this.patients.size,
      sessions: this.sessions.size,
      messages: this.messages.size,
      histories: this.histories.size,
      familyScores: this.familyScores.size,
      doctorReports: this.doctorReports.size
    };
  }
}

// Supabase数据库服务类
class SupabaseService implements DatabaseService {
  private client: SupabaseClient;
  private connected: boolean = false;

  constructor() {
    this.client = createClient(
      config.database.supabase_url,
      config.database.supabase_service_key
    );
  }

  async connect(): Promise<void> {
    try {
      // 测试连接
      const { data, error } = await this.client.from('_health').select('*').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, 这是预期的
        throw error;
      }
      
      this.connected = true;
      logger.info('Supabase数据库连接成功');
    } catch (error) {
      logger.error('Supabase数据库连接失败', error as Error);
      throw new DatabaseError('数据库连接失败', error as Error);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Supabase数据库连接已断开');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connected) {
      throw new DatabaseError('数据库未连接');
    }
    
    try {
      logger.debug('Supabase SQL查询', { sql, params });
      
      // 注意：Supabase 不支持直接 SQL 查询，需要使用 RPC 或 REST API
      // 这里作为示例实现
      const result = [] as T[];
      
      return result;
    } catch (error) {
      logger.error('Supabase查询失败', error as Error);
      throw new DatabaseError('数据库查询失败', error as Error);
    }
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new DatabaseError('数据库未连接');
    }
    
    // Supabase 不支持客户端事务，需要使用 Edge Functions 或 Stored Procedures
    logger.debug('Supabase事务模拟');
    
    try {
      const result = await callback(this.client);
      logger.debug('Supabase事务模拟成功');
      return result;
    } catch (error) {
      logger.error('Supabase事务模拟失败', error as Error);
      throw error;
    }
  }

  // Supabase特定方法
  getClient(): SupabaseClient {
    return this.client;
  }

  async createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const { data, error } = await this.client
      .from('patients')
      .insert([patient])
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('创建患者失败', error);
    }
    
    logger.info('Supabase创建患者成功', { patientId: data.id });
    return data;
  }

  async getPatient(id: string): Promise<Patient | null> {
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError('查询患者失败', error);
    }
    
    return data || null;
  }
}

// 数据库服务工厂
class DatabaseServiceFactory {
  private static instance: DatabaseService | null = null;

  static async create(): Promise<DatabaseService> {
    if (DatabaseServiceFactory.instance) {
      return DatabaseServiceFactory.instance;
    }

    let service: DatabaseService;
    
    // 在生产环境中优先使用 Supabase
    if (config.server.env === 'production' && config.database.supabase_url !== 'https://localhost:54321') {
      try {
        service = new SupabaseService();
        await service.connect();
        logger.info('使用 Supabase 数据库服务');
      } catch (error) {
        logger.warn('Supabase 连接失败，使用模拟数据库', { error });
        service = new MockDatabase();
        await service.connect();
      }
    } else {
      logger.info('使用模拟数据库服务');
      service = new MockDatabase();
      await service.connect();
    }

    DatabaseServiceFactory.instance = service;
    return service;
  }

  static getInstance(): DatabaseService | null {
    return DatabaseServiceFactory.instance;
  }

  static async reset(): Promise<void> {
    if (DatabaseServiceFactory.instance) {
      await DatabaseServiceFactory.instance.disconnect();
      DatabaseServiceFactory.instance = null;
    }
  }
}

export { DatabaseServiceFactory, MockDatabase, SupabaseService };
export default DatabaseServiceFactory;