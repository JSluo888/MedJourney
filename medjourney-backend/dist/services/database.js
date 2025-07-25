"use strict";
// 数据库服务类 - 集成Supabase和模拟数据库
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = exports.MockDatabase = exports.DatabaseServiceFactory = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// 模拟数据存储
class MockDatabase {
    patients = new Map();
    sessions = new Map();
    messages = new Map();
    histories = new Map();
    familyScores = new Map();
    doctorReports = new Map();
    connected = false;
    constructor() {
        this.initializeMockData();
    }
    initializeMockData() {
        // 初始化模拟数据
        const mockPatient = {
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
        const mockSession = {
            id: 'session_001',
            patient_id: mockPatient.id,
            status: 'active',
            started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
            session_type: 'chat',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
            updated_at: new Date()
        };
        this.sessions.set(mockSession.id, mockSession);
        logger_1.logger.info('模拟数据库初始化完成', {
            patients: this.patients.size,
            sessions: this.sessions.size
        });
    }
    async connect() {
        this.connected = true;
        logger_1.logger.info('模拟数据库连接成功');
    }
    async disconnect() {
        this.connected = false;
        logger_1.logger.info('模拟数据库连接已断开');
    }
    isConnected() {
        return this.connected;
    }
    async query(sql, params) {
        if (!this.connected) {
            throw new errors_1.DatabaseError('数据库未连接');
        }
        logger_1.logger.debug('模拟数据库查询', { sql, params });
        // 模拟查询延迟
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
        return [];
    }
    async transaction(callback) {
        if (!this.connected) {
            throw new errors_1.DatabaseError('数据库未连接');
        }
        logger_1.logger.debug('开始模拟数据库事务');
        try {
            const result = await callback(this);
            logger_1.logger.debug('模拟数据库事务提交成功');
            return result;
        }
        catch (error) {
            logger_1.logger.error('模拟数据库事务回滚', error);
            throw error;
        }
    }
    // 患者相关操作
    async createPatient(patient) {
        const newPatient = {
            ...patient,
            id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.patients.set(newPatient.id, newPatient);
        logger_1.logger.info('创建患者成功', { patientId: newPatient.id, name: newPatient.name });
        return newPatient;
    }
    async getPatient(id) {
        const patient = this.patients.get(id);
        logger_1.logger.debug('查询患者', { patientId: id, found: !!patient });
        return patient || null;
    }
    async updatePatient(id, updates) {
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
        logger_1.logger.info('更新患者成功', { patientId: id });
        return updatedPatient;
    }
    // 病史相关操作
    async createMedicalHistory(history) {
        const newHistory = {
            ...history,
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.histories.set(newHistory.id, newHistory);
        logger_1.logger.info('创建病史记录成功', { historyId: newHistory.id, patientId: newHistory.patient_id });
        return newHistory;
    }
    async getMedicalHistory(patientId) {
        const histories = Array.from(this.histories.values())
            .filter(h => h.patient_id === patientId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        logger_1.logger.debug('查询病史记录', { patientId, count: histories.length });
        return histories;
    }
    // 会话相关操作
    async createSession(session) {
        const newSession = {
            ...session,
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.sessions.set(newSession.id, newSession);
        logger_1.logger.info('创建会话成功', { sessionId: newSession.id, patientId: newSession.patient_id });
        return newSession;
    }
    async getSession(id) {
        const session = this.sessions.get(id);
        logger_1.logger.debug('查询会话', { sessionId: id, found: !!session });
        return session || null;
    }
    async getSessionsByPatient(patientId) {
        const sessions = Array.from(this.sessions.values())
            .filter(s => s.patient_id === patientId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        logger_1.logger.debug('查询患者会话', { patientId, count: sessions.length });
        return sessions;
    }
    async updateSession(id, updates) {
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
        logger_1.logger.info('更新会话成功', { sessionId: id });
        return updatedSession;
    }
    // 消息相关操作
    async createMessage(message) {
        const newMessage = {
            ...message,
            id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.messages.set(newMessage.id, newMessage);
        logger_1.logger.debug('创建消息成功', { messageId: newMessage.id, sessionId: newMessage.session_id });
        return newMessage;
    }
    async getMessagesBySession(sessionId, limit) {
        const messages = Array.from(this.messages.values())
            .filter(m => m.session_id === sessionId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const result = limit ? messages.slice(-limit) : messages;
        logger_1.logger.debug('查询会话消息', { sessionId, count: result.length, limit });
        return result;
    }
    // 家属评分操作
    async createFamilyScore(score) {
        const newScore = {
            ...score,
            id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.familyScores.set(newScore.id, newScore);
        logger_1.logger.info('创建家属评分成功', { scoreId: newScore.id, sessionId: newScore.session_id });
        return newScore;
    }
    async getFamilyScoreBySession(sessionId) {
        const score = Array.from(this.familyScores.values())
            .find(s => s.session_id === sessionId);
        logger_1.logger.debug('查询家属评分', { sessionId, found: !!score });
        return score || null;
    }
    // 医生报告操作
    async createDoctorReport(report) {
        const newReport = {
            ...report,
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
        };
        this.doctorReports.set(newReport.id, newReport);
        logger_1.logger.info('创建医生报告成功', { reportId: newReport.id, sessionId: newReport.session_id });
        return newReport;
    }
    async getDoctorReportBySession(sessionId) {
        const report = Array.from(this.doctorReports.values())
            .find(r => r.session_id === sessionId);
        logger_1.logger.debug('查询医生报告', { sessionId, found: !!report });
        return report || null;
    }
    // 统计信息
    async getStats() {
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
exports.MockDatabase = MockDatabase;
// Supabase数据库服务类
class SupabaseService {
    client;
    connected = false;
    constructor() {
        this.client = (0, supabase_js_1.createClient)(config_1.config.database.supabase_url, config_1.config.database.supabase_service_key);
    }
    async connect() {
        try {
            // 测试连接
            const { data, error } = await this.client.from('_health').select('*').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, 这是预期的
                throw error;
            }
            this.connected = true;
            logger_1.logger.info('Supabase数据库连接成功');
        }
        catch (error) {
            logger_1.logger.error('Supabase数据库连接失败', error);
            throw new errors_1.DatabaseError('数据库连接失败', error);
        }
    }
    async disconnect() {
        this.connected = false;
        logger_1.logger.info('Supabase数据库连接已断开');
    }
    isConnected() {
        return this.connected;
    }
    async query(sql, params) {
        if (!this.connected) {
            throw new errors_1.DatabaseError('数据库未连接');
        }
        try {
            logger_1.logger.debug('Supabase SQL查询', { sql, params });
            // 注意：Supabase 不支持直接 SQL 查询，需要使用 RPC 或 REST API
            // 这里作为示例实现
            const result = [];
            return result;
        }
        catch (error) {
            logger_1.logger.error('Supabase查询失败', error);
            throw new errors_1.DatabaseError('数据库查询失败', error);
        }
    }
    async transaction(callback) {
        if (!this.connected) {
            throw new errors_1.DatabaseError('数据库未连接');
        }
        // Supabase 不支持客户端事务，需要使用 Edge Functions 或 Stored Procedures
        logger_1.logger.debug('Supabase事务模拟');
        try {
            const result = await callback(this.client);
            logger_1.logger.debug('Supabase事务模拟成功');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Supabase事务模拟失败', error);
            throw error;
        }
    }
    // Supabase特定方法
    getClient() {
        return this.client;
    }
    async createPatient(patient) {
        const { data, error } = await this.client
            .from('patients')
            .insert([patient])
            .select()
            .single();
        if (error) {
            throw new errors_1.DatabaseError('创建患者失败', error);
        }
        logger_1.logger.info('Supabase创建患者成功', { patientId: data.id });
        return data;
    }
    async getPatient(id) {
        const { data, error } = await this.client
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new errors_1.DatabaseError('查询患者失败', error);
        }
        return data || null;
    }
}
exports.SupabaseService = SupabaseService;
// 数据库服务工厂
class DatabaseServiceFactory {
    static instance = null;
    static async create() {
        if (DatabaseServiceFactory.instance) {
            return DatabaseServiceFactory.instance;
        }
        let service;
        // 在生产环境中优先使用 Supabase
        if (config_1.config.server.env === 'production' && config_1.config.database.supabase_url !== 'https://localhost:54321') {
            try {
                service = new SupabaseService();
                await service.connect();
                logger_1.logger.info('使用 Supabase 数据库服务');
            }
            catch (error) {
                logger_1.logger.warn('Supabase 连接失败，使用模拟数据库', { error });
                service = new MockDatabase();
                await service.connect();
            }
        }
        else {
            logger_1.logger.info('使用模拟数据库服务');
            service = new MockDatabase();
            await service.connect();
        }
        DatabaseServiceFactory.instance = service;
        return service;
    }
    static getInstance() {
        return DatabaseServiceFactory.instance;
    }
    static async reset() {
        if (DatabaseServiceFactory.instance) {
            await DatabaseServiceFactory.instance.disconnect();
            DatabaseServiceFactory.instance = null;
        }
    }
}
exports.DatabaseServiceFactory = DatabaseServiceFactory;
exports.default = DatabaseServiceFactory;
//# sourceMappingURL=database.js.map