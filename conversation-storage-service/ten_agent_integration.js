/**
 * MedJourney 对话存储服务 - TEN Agent 集成示例
 * 
 * 这个文件展示了如何在 TEN Agent 中集成对话存储和报告生成功能
 */

// 配置
const CONFIG = {
    API_BASE_URL: 'http://36.50.226.131:8000',
    ENDPOINTS: {
        SESSIONS: '/api/v1/conversations/sessions',
        MESSAGES: '/api/v1/conversations/messages',
        REPORTS: '/api/v1/reports/generate',
        GET_MESSAGES: '/api/v1/conversations/sessions',
        GET_REPORTS: '/api/v1/reports'
    }
};

/**
 * 对话存储服务类
 */
class ConversationStorageService {
    constructor() {
        this.currentSessionId = null;
        this.currentUserId = null;
        this.isInitialized = false;
    }

    /**
     * 初始化服务
     * @param {string} userId - 用户ID
     * @param {string} sessionId - 会话ID（可选，如果不提供会自动生成）
     */
    async initialize(userId, sessionId = null) {
        try {
            this.currentUserId = userId;
            
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            this.currentSessionId = sessionId;
            
            // 创建会话
            const sessionData = {
                session_id: sessionId,
                user_id: userId,
                session_type: 'medical_assessment',
                status: 'active',
                metadata: {
                    source: 'ten_agent',
                    created_at: new Date().toISOString()
                }
            };
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SESSIONS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData)
            });
            
            if (response.ok) {
                this.isInitialized = true;
                console.log('✅ 对话存储服务初始化成功', { sessionId, userId });
                return sessionId;
            } else {
                throw new Error(`会话创建失败: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ 对话存储服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 保存用户消息
     * @param {string} content - 消息内容
     * @param {Object} emotionAnalysis - 情感分析结果（可选）
     * @param {Object} metadata - 额外元数据（可选）
     */
    async saveUserMessage(content, emotionAnalysis = null, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('服务未初始化，请先调用 initialize()');
        }
        
        return this.saveMessage('user', content, emotionAnalysis, metadata);
    }

    /**
     * 保存AI助手消息
     * @param {string} content - 消息内容
     * @param {Object} metadata - 额外元数据（可选）
     */
    async saveAssistantMessage(content, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('服务未初始化，请先调用 initialize()');
        }
        
        return this.saveMessage('assistant', content, null, metadata);
    }

    /**
     * 保存消息的通用方法
     * @param {string} role - 角色 ('user' 或 'assistant')
     * @param {string} content - 消息内容
     * @param {Object} emotionAnalysis - 情感分析结果
     * @param {Object} metadata - 额外元数据
     */
    async saveMessage(role, content, emotionAnalysis = null, metadata = {}) {
        try {
            const messageData = {
                session_id: this.currentSessionId,
                user_id: this.currentUserId,
                role: role,
                content: content,
                timestamp: new Date().toISOString(),
                emotion_analysis: emotionAnalysis,
                metadata: {
                    ...metadata,
                    source: 'ten_agent',
                    saved_at: new Date().toISOString()
                }
            };
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.MESSAGES}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${role} 消息保存成功:`, result.data.message_id);
                return result.data;
            } else {
                throw new Error(`消息保存失败: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ${role} 消息保存失败:`, error);
            throw error;
        }
    }

    /**
     * 生成医生报告
     * @param {Object} options - 选项
     * @returns {Object} 报告数据
     */
    async generateDoctorReport(options = {}) {
        return this.generateReport('doctor', options);
    }

    /**
     * 生成家属报告
     * @param {Object} options - 选项
     * @returns {Object} 报告数据
     */
    async generateFamilyReport(options = {}) {
        return this.generateReport('family', options);
    }

    /**
     * 生成报告的通用方法
     * @param {string} reportType - 报告类型 ('doctor' 或 'family')
     * @param {Object} options - 选项
     * @returns {Object} 报告数据
     */
    async generateReport(reportType, options = {}) {
        if (!this.isInitialized) {
            throw new Error('服务未初始化，请先调用 initialize()');
        }
        
        try {
            const reportData = {
                session_id: this.currentSessionId,
                report_type: reportType,
                format: options.format || 'json',
                include_analysis: options.includeAnalysis !== false
            };
            
            console.log(`🔄 正在生成${reportType === 'doctor' ? '医生' : '家属'}报告...`);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORTS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${reportType === 'doctor' ? '医生' : '家属'}报告生成成功:`, result.data.report_id);
                return result.data;
            } else {
                throw new Error(`报告生成失败: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ${reportType === 'doctor' ? '医生' : '家属'}报告生成失败:`, error);
            throw error;
        }
    }

    /**
     * 获取会话的所有消息
     * @returns {Array} 消息列表
     */
    async getMessages() {
        if (!this.isInitialized) {
            throw new Error('服务未初始化，请先调用 initialize()');
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GET_MESSAGES}/${this.currentSessionId}/messages`);
            
            if (response.ok) {
                const result = await response.json();
                return result.data.messages;
            } else {
                throw new Error(`获取消息失败: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ 获取消息失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前会话ID
     * @returns {string} 会话ID
     */
    getCurrentSessionId() {
        return this.currentSessionId;
    }

    /**
     * 获取当前用户ID
     * @returns {string} 用户ID
     */
    getCurrentUserId() {
        return this.currentUserId;
    }
}

/**
 * TEN Agent 集成示例
 */
class TenAgentIntegration {
    constructor() {
        this.storageService = new ConversationStorageService();
        this.conversationHistory = [];
    }

    /**
     * 开始新的对话会话
     * @param {string} userId - 用户ID
     * @param {string} sessionId - 会话ID（可选）
     */
    async startConversation(userId, sessionId = null) {
        try {
            await this.storageService.initialize(userId, sessionId);
            this.conversationHistory = [];
            console.log('🎉 新对话会话已开始');
        } catch (error) {
            console.error('❌ 开始对话会话失败:', error);
            throw error;
        }
    }

    /**
     * 处理用户输入
     * @param {string} userInput - 用户输入
     * @param {Object} emotionAnalysis - 情感分析结果（可选）
     */
    async handleUserInput(userInput, emotionAnalysis = null) {
        try {
            // 保存用户消息
            await this.storageService.saveUserMessage(userInput, emotionAnalysis);
            
            // 添加到本地历史
            this.conversationHistory.push({
                role: 'user',
                content: userInput,
                timestamp: new Date().toISOString()
            });
            
            console.log('👤 用户消息已保存:', userInput.substring(0, 50) + '...');
            
            // 这里可以调用 TEN Agent 的 AI 处理逻辑
            // const aiResponse = await this.processWithAI(userInput);
            
            // 模拟 AI 响应
            const aiResponse = await this.simulateAIResponse(userInput);
            
            // 保存 AI 响应
            await this.storageService.saveAssistantMessage(aiResponse);
            
            // 添加到本地历史
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            });
            
            console.log('🤖 AI 响应已保存:', aiResponse.substring(0, 50) + '...');
            
            return aiResponse;
        } catch (error) {
            console.error('❌ 处理用户输入失败:', error);
            throw error;
        }
    }

    /**
     * 模拟 AI 响应（实际使用时替换为真实的 AI 处理）
     * @param {string} userInput - 用户输入
     * @returns {string} AI 响应
     */
    async simulateAIResponse(userInput) {
        // 模拟 AI 处理延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 简单的响应逻辑
        if (userInput.includes('头晕') || userInput.includes('头痛')) {
            return '我理解您的症状。头晕可能由多种原因引起，比如压力、疲劳或血压问题。建议您先休息一下，如果症状持续，请及时就医。';
        } else if (userInput.includes('睡眠') || userInput.includes('失眠')) {
            return '睡眠问题确实会影响健康。建议您保持规律的作息时间，睡前避免使用电子设备，可以尝试放松技巧来改善睡眠质量。';
        } else if (userInput.includes('压力') || userInput.includes('焦虑')) {
            return '压力是现代人常见的问题。建议您尝试一些放松方法，比如深呼吸、冥想或适度运动。如果压力持续影响生活，建议寻求专业帮助。';
        } else {
            return '我理解您的感受。请详细描述一下您的症状，这样我可以更好地帮助您。';
        }
    }

    /**
     * 结束对话并生成报告
     * @param {string} reportType - 报告类型 ('doctor', 'family', 'both')
     * @returns {Object} 报告结果
     */
    async endConversationAndGenerateReport(reportType = 'both') {
        try {
            console.log('📊 正在生成报告...');
            
            const reports = {};
            
            if (reportType === 'doctor' || reportType === 'both') {
                reports.doctor = await this.storageService.generateDoctorReport();
            }
            
            if (reportType === 'family' || reportType === 'both') {
                reports.family = await this.storageService.generateFamilyReport();
            }
            
            console.log('✅ 报告生成完成');
            return reports;
        } catch (error) {
            console.error('❌ 生成报告失败:', error);
            throw error;
        }
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * 获取存储服务实例
     * @returns {ConversationStorageService} 存储服务实例
     */
    getStorageService() {
        return this.storageService;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ConversationStorageService,
        TenAgentIntegration
    };
}

// 浏览器环境下的全局变量
if (typeof window !== 'undefined') {
    window.MedJourneyConversationStorage = {
        ConversationStorageService,
        TenAgentIntegration
    };
}

/**
 * 使用示例
 */
async function exampleUsage() {
    console.log('🚀 MedJourney 对话存储服务集成示例');
    
    // 创建集成实例
    const integration = new TenAgentIntegration();
    
    try {
        // 开始对话
        await integration.startConversation('patient_123', 'session_456');
        
        // 模拟对话
        const conversation = [
            { input: '医生，我今天感觉有点头晕', emotion: { emotion: 'concerned', confidence: 0.8 } },
            { input: '从早上开始，大概有2个小时了，感觉有点恶心', emotion: { emotion: 'anxious', confidence: 0.9 } },
            { input: '最近确实睡得不太好，经常失眠，而且工作压力比较大', emotion: { emotion: 'stressed', confidence: 0.85 } }
        ];
        
        for (const turn of conversation) {
            console.log(`\n👤 用户: ${turn.input}`);
            const response = await integration.handleUserInput(turn.input, turn.emotion);
            console.log(`🤖 AI: ${response}`);
            
            // 等待一下，模拟真实对话
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 生成报告
        console.log('\n📊 生成报告...');
        const reports = await integration.endConversationAndGenerateReport('both');
        
        console.log('\n📋 报告摘要:');
        if (reports.doctor) {
            console.log('👨‍⚕️ 医生报告:');
            console.log(`   健康评分: ${reports.doctor.summary.health_score}`);
            console.log(`   情绪状态: ${reports.doctor.summary.emotional_state}`);
        }
        
        if (reports.family) {
            console.log('👨‍👩‍👧‍👦 家属报告:');
            console.log(`   健康评分: ${reports.family.summary.health_score}`);
            console.log(`   简单总结: ${reports.family.summary.simple_summary}`);
        }
        
    } catch (error) {
        console.error('❌ 示例执行失败:', error);
    }
}

// 如果在浏览器中运行，自动执行示例
if (typeof window !== 'undefined') {
    // 等待页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', exampleUsage);
    } else {
        exampleUsage();
    }
} 