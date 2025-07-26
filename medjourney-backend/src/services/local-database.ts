// 本地SQLite数据库服务
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
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

export class LocalDatabaseService implements DatabaseService {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // 确保数据目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'medjourney.db');
    this.db = new Database(this.dbPath);
    
    logger.info('本地SQLite数据库初始化', {
      path: this.dbPath,
      exists: fs.existsSync(this.dbPath)
    });

    this.initializeTables();
  }

  private initializeTables(): void {
    try {
      // 患者表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          age INTEGER,
          medical_history TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // 对话会话表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_sessions (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          session_type TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          metadata TEXT,
          FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
      `);

      // 对话消息表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          emotion_analysis TEXT,
          timestamp TEXT NOT NULL,
          metadata TEXT,
          FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
        )
      `);

      // 健康报告表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS health_reports (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          patient_id TEXT NOT NULL,
          report_type TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT NOT NULL,
          recommendations TEXT,
          created_at TEXT NOT NULL,
          metadata TEXT,
          FOREIGN KEY (session_id) REFERENCES conversation_sessions (id),
          FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
      `);

      // 评估数据表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS assessments (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          assessment_type TEXT NOT NULL,
          assessment_data TEXT NOT NULL,
          submitted_by TEXT,
          submitted_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
        )
      `);

      // 评估分析表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS assessment_analyses (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          analysis_data TEXT NOT NULL,
          analysis_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
        )
      `);

      // 病历文件表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS medical_files (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER,
          file_url TEXT,
          description TEXT,
          uploaded_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
      `);

      // 插入测试数据
      this.insertTestData();

      logger.info('数据库表初始化完成');
    } catch (error) {
      logger.error('数据库表初始化失败', error as Error);
      throw error;
    }
  }

  private insertTestData(): void {
    const now = new Date().toISOString();
    
    // 检查是否已有测试数据
    const existingPatient = this.db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    
    if (existingPatient.count === 0) {
      // 插入测试患者
      const insertPatient = this.db.prepare(`
        INSERT INTO patients (id, name, age, medical_history, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertPatient.run('test-patient-001', '张老师', 72, 'Alzheimer早期症状，记忆力减退', now, now);
      
      // 插入测试会话
      const insertSession = this.db.prepare(`
        INSERT INTO conversation_sessions (id, patient_id, session_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertSession.run('session-001', 'test-patient-001', 'consultation', 'active', now, now);
      
      logger.info('测试数据插入完成');
    }
  }

  // 患者相关方法
  async createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const id = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO patients (id, name, age, medical_history, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(id, patient.name, patient.age, patient.medical_history || '', now, now);
    
    return this.getPatient(id);
  }

  async getPatient(patientId: string): Promise<Patient | null> {
    const stmt = this.db.prepare('SELECT * FROM patients WHERE id = ?');
    const result = stmt.get(patientId) as Patient | undefined;
    return result || null;
  }

  async getPatients(): Promise<Patient[]> {
    const stmt = this.db.prepare('SELECT * FROM patients ORDER BY created_at DESC');
    return stmt.all() as Patient[];
  }

  // 对话会话相关方法
  async createConversationSession(session: Omit<ConversationSession, 'id' | 'created_at' | 'updated_at'>): Promise<ConversationSession> {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO conversation_sessions (id, patient_id, session_type, status, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id, 
      session.patient_id, 
      session.session_type, 
      session.status || 'active', 
      now, 
      now,
      session.metadata || null
    );
    
    return this.getConversationSession(id);
  }

  async getConversationSession(sessionId: string): Promise<ConversationSession | null> {
    const stmt = this.db.prepare('SELECT * FROM conversation_sessions WHERE id = ?');
    const result = stmt.get(sessionId) as ConversationSession | undefined;
    return result || null;
  }

  async updateConversationSession(sessionId: string, updates: Partial<ConversationSession>): Promise<ConversationSession | null> {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return this.getConversationSession(sessionId);
    }
    
    values.push(sessionId);
    
    const updateStmt = this.db.prepare(`
      UPDATE conversation_sessions 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    updateStmt.run(...values);
    
    return this.getConversationSession(sessionId);
  }

  async getConversationsByPatient(patientId: string): Promise<ConversationSession[]> {
    const stmt = this.db.prepare('SELECT * FROM conversation_sessions WHERE patient_id = ? ORDER BY created_at DESC');
    return stmt.all(patientId) as ConversationSession[];
  }

  // 对话消息相关方法
  async addConversationMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<ConversationMessage> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO conversation_messages (id, session_id, role, content, message_type, emotion_analysis, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      message.session_id,
      message.role,
      message.content,
      message.message_type || 'text',
      message.emotion_analysis || null,
      timestamp,
      message.metadata || null
    );
    
    const stmt = this.db.prepare('SELECT * FROM conversation_messages WHERE id = ?');
    return stmt.get(id) as ConversationMessage;
  }

  async getConversationMessages(sessionId: string): Promise<ConversationMessage[]> {
    const stmt = this.db.prepare('SELECT * FROM conversation_messages WHERE session_id = ? ORDER BY timestamp ASC');
    return stmt.all(sessionId) as ConversationMessage[];
  }

  // 健康报告相关方法
  async createHealthReport(report: Omit<HealthReport, 'id' | 'created_at'>): Promise<HealthReport> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const created_at = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO health_reports (id, session_id, patient_id, report_type, content, summary, recommendations, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      report.session_id,
      report.patient_id,
      report.report_type,
      report.content,
      report.summary,
      report.recommendations || '',
      created_at,
      report.metadata || null
    );
    
    const stmt = this.db.prepare('SELECT * FROM health_reports WHERE id = ?');
    return stmt.get(id) as HealthReport;
  }

  // 评估数据相关方法
  async createAssessment(assessment: {
    session_id: string;
    assessment_type: string;
    assessment_data: any;
    submitted_by?: string;
  }): Promise<any> {
    const id = `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO assessments (id, session_id, assessment_type, assessment_data, submitted_by, submitted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      assessment.session_id,
      assessment.assessment_type,
      JSON.stringify(assessment.assessment_data),
      assessment.submitted_by || null,
      now,
      now,
      now
    );
    
    const stmt = this.db.prepare('SELECT * FROM assessments WHERE id = ?');
    return stmt.get(id);
  }

  async getAssessmentsBySession(sessionId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM assessments WHERE session_id = ? ORDER BY created_at ASC');
    return stmt.all(sessionId);
  }

  async getAssessmentById(assessmentId: string): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM assessments WHERE id = ?');
    return stmt.get(assessmentId) || null;
  }

  // 评估分析相关方法
  async createAssessmentAnalysis(analysis: {
    session_id: string;
    analysis_data: any;
    analysis_type: string;
  }): Promise<any> {
    const id = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO assessment_analyses (id, session_id, analysis_data, analysis_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      analysis.session_id,
      JSON.stringify(analysis.analysis_data),
      analysis.analysis_type,
      now
    );
    
    const stmt = this.db.prepare('SELECT * FROM assessment_analyses WHERE id = ?');
    return stmt.get(id);
  }

  async getAssessmentAnalysesBySession(sessionId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM assessment_analyses WHERE session_id = ? ORDER BY created_at ASC');
    return stmt.all(sessionId);
  }

  // 病历文件相关方法
  async createMedicalFile(file: {
    patient_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url?: string;
    description?: string;
  }): Promise<any> {
    const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO medical_files (id, patient_id, file_name, file_type, file_size, file_url, description, uploaded_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      file.patient_id,
      file.file_name,
      file.file_type,
      file.file_size,
      file.file_url || null,
      file.description || null,
      now,
      now
    );
    
    const stmt = this.db.prepare('SELECT * FROM medical_files WHERE id = ?');
    return stmt.get(id);
  }

  async getMedicalFilesByPatient(patientId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM medical_files WHERE patient_id = ? ORDER BY created_at DESC');
    return stmt.all(patientId);
  }

  async deleteMedicalFile(fileId: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM medical_files WHERE id = ?');
    const result = stmt.run(fileId);
    return result.changes > 0;
  }

  // 统计方法
  async getStatistics(): Promise<{
    patients: number;
    sessions: number;
    messages: number;
    reports: number;
  }> {
    const patientsCount = this.db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    const sessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM conversation_sessions').get() as { count: number };
    const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM conversation_messages').get() as { count: number };
    const reportsCount = this.db.prepare('SELECT COUNT(*) as count FROM health_reports').get() as { count: number };
    
    return {
      patients: patientsCount.count,
      sessions: sessionsCount.count,
      messages: messagesCount.count,
      reports: reportsCount.count
    };
  }

  async connect(): Promise<void> {
    // SQLite连接在构造函数中已建立
    logger.info('本地数据库连接成功');
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      logger.info('本地数据库连接已关闭');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = this.db.prepare('SELECT 1 as status').get() as { status: number };
      return result.status === 1;
    } catch (error) {
      logger.error('数据库健康检查失败', error as Error);
      return false;
    }
  }
}

export const localDatabaseService = new LocalDatabaseService();
