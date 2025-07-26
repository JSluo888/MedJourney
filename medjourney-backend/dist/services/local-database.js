"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localDatabaseService = exports.LocalDatabaseService = void 0;
// 本地SQLite数据库服务
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
class LocalDatabaseService {
    db;
    dbPath;
    constructor() {
        // 确保数据目录存在
        const dataDir = path_1.default.join(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = path_1.default.join(dataDir, 'medjourney.db');
        this.db = new better_sqlite3_1.default(this.dbPath);
        logger_1.logger.info('本地SQLite数据库初始化', {
            path: this.dbPath,
            exists: fs_1.default.existsSync(this.dbPath)
        });
        this.initializeTables();
    }
    initializeTables() {
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
            // 插入测试数据
            this.insertTestData();
            logger_1.logger.info('数据库表初始化完成');
        }
        catch (error) {
            logger_1.logger.error('数据库表初始化失败', error);
            throw error;
        }
    }
    insertTestData() {
        const now = new Date().toISOString();
        // 检查是否已有测试数据
        const existingPatient = this.db.prepare('SELECT COUNT(*) as count FROM patients').get();
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
            logger_1.logger.info('测试数据插入完成');
        }
    }
    // 患者相关方法
    async createPatient(patient) {
        const id = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const insertStmt = this.db.prepare(`
      INSERT INTO patients (id, name, age, medical_history, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        insertStmt.run(id, patient.name, patient.age, patient.medical_history || '', now, now);
        return this.getPatient(id);
    }
    async getPatient(patientId) {
        const stmt = this.db.prepare('SELECT * FROM patients WHERE id = ?');
        const result = stmt.get(patientId);
        return result || null;
    }
    async getPatients() {
        const stmt = this.db.prepare('SELECT * FROM patients ORDER BY created_at DESC');
        return stmt.all();
    }
    // 对话会话相关方法
    async createConversationSession(session) {
        const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const insertStmt = this.db.prepare(`
      INSERT INTO conversation_sessions (id, patient_id, session_type, status, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        insertStmt.run(id, session.patient_id, session.session_type, session.status || 'active', now, now, session.metadata || null);
        return this.getConversationSession(id);
    }
    async getConversationSession(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM conversation_sessions WHERE id = ?');
        const result = stmt.get(sessionId);
        return result || null;
    }
    async updateConversationSession(sessionId, updates) {
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
    async getConversationsByPatient(patientId) {
        const stmt = this.db.prepare('SELECT * FROM conversation_sessions WHERE patient_id = ? ORDER BY created_at DESC');
        return stmt.all(patientId);
    }
    // 对话消息相关方法
    async addConversationMessage(message) {
        const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        const insertStmt = this.db.prepare(`
      INSERT INTO conversation_messages (id, session_id, role, content, message_type, emotion_analysis, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertStmt.run(id, message.session_id, message.role, message.content, message.message_type || 'text', message.emotion_analysis || null, timestamp, message.metadata || null);
        const stmt = this.db.prepare('SELECT * FROM conversation_messages WHERE id = ?');
        return stmt.get(id);
    }
    async getConversationMessages(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM conversation_messages WHERE session_id = ? ORDER BY timestamp ASC');
        return stmt.all(sessionId);
    }
    // 健康报告相关方法
    async createHealthReport(report) {
        const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const created_at = new Date().toISOString();
        const insertStmt = this.db.prepare(`
      INSERT INTO health_reports (id, session_id, patient_id, report_type, content, summary, recommendations, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertStmt.run(id, report.session_id, report.patient_id, report.report_type, report.content, report.summary, report.recommendations || '', created_at, report.metadata || null);
        const stmt = this.db.prepare('SELECT * FROM health_reports WHERE id = ?');
        return stmt.get(id);
    }
    async getHealthReports(patientId) {
        const stmt = this.db.prepare('SELECT * FROM health_reports WHERE patient_id = ? ORDER BY created_at DESC');
        return stmt.all(patientId);
    }
    async getHealthReport(reportId) {
        const stmt = this.db.prepare('SELECT * FROM health_reports WHERE id = ?');
        const result = stmt.get(reportId);
        return result || null;
    }
    // 统计方法
    async getStatistics() {
        const patientsCount = this.db.prepare('SELECT COUNT(*) as count FROM patients').get();
        const sessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM conversation_sessions').get();
        const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM conversation_messages').get();
        const reportsCount = this.db.prepare('SELECT COUNT(*) as count FROM health_reports').get();
        return {
            patients: patientsCount.count,
            sessions: sessionsCount.count,
            messages: messagesCount.count,
            reports: reportsCount.count
        };
    }
    async connect() {
        // SQLite连接在构造函数中已建立
        logger_1.logger.info('本地数据库连接成功');
    }
    async disconnect() {
        if (this.db) {
            this.db.close();
            logger_1.logger.info('本地数据库连接已关闭');
        }
    }
    async healthCheck() {
        try {
            const result = this.db.prepare('SELECT 1 as status').get();
            return result.status === 1;
        }
        catch (error) {
            logger_1.logger.error('数据库健康检查失败', error);
            return false;
        }
    }
}
exports.LocalDatabaseService = LocalDatabaseService;
exports.localDatabaseService = new LocalDatabaseService();
//# sourceMappingURL=local-database.js.map