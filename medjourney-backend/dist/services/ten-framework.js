"use strict";
// TEN Framework 集成服务
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENFrameworkServiceImpl = exports.TENFrameworkServiceFactory = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const stepfun_1 = __importDefault(require("./stepfun"));
const elevenlabs_1 = __importDefault(require("./elevenlabs"));
// TEN Framework 服务实现类
class TENFrameworkServiceImpl extends events_1.EventEmitter {
    ws = null;
    isConnected = false;
    endpoint;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectInterval = 5000;
    heartbeatInterval = null;
    activeSessions = new Map();
    stepfunService;
    elevenLabsService;
    constructor() {
        super();
        this.endpoint = config_1.config.ai.ten_framework_endpoint;
        this.stepfunService = stepfun_1.default.create();
        this.elevenLabsService = elevenlabs_1.default.create();
        logger_1.logger.info('TEN Framework 服务初始化完成', {
            endpoint: this.endpoint
        });
    }
    async connect() {
        try {
            if (this.isConnected) {
                logger_1.logger.warn('TEN Framework 已经连接');
                return;
            }
            logger_1.logger.info('连接到 TEN Framework', { endpoint: this.endpoint });
            this.ws = new ws_1.default(this.endpoint);
            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('WebSocket 初始化失败'));
                    return;
                }
                const timeout = setTimeout(() => {
                    reject(new Error('TEN Framework 连接超时'));
                }, 10000);
                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    logger_1.logger.info('TEN Framework 连接成功');
                    // 发送初始化消息
                    this.sendInitMessage();
                    // 启动心跳
                    this.startHeartbeat();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    this.handleMessage(data);
                });
                this.ws.on('close', (code, reason) => {
                    clearTimeout(timeout);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    logger_1.logger.warn('TEN Framework 连接关闭', {
                        code,
                        reason: reason.toString()
                    });
                    // 自动重连
                    this.handleReconnect();
                });
                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    logger_1.logger.error('TEN Framework 连接错误', error);
                    reject(new errors_1.AIServiceError(`TEN Framework 连接失败: ${error.message}`, 'TEN_CONNECTION_ERROR'));
                });
            });
        }
        catch (error) {
            logger_1.logger.error('TEN Framework 连接失败', error);
            throw new errors_1.AIServiceError(`TEN Framework 连接失败: ${error.message}`, 'TEN_CONNECTION_ERROR');
        }
    }
    async disconnect() {
        if (this.ws) {
            this.isConnected = false;
            this.stopHeartbeat();
            this.ws.close();
            this.ws = null;
            logger_1.logger.info('TEN Framework 连接已断开');
        }
    }
    isConnected() {
        return this.isConnected && this.ws?.readyState === ws_1.default.OPEN;
    }
    async sendMessage(message) {
        try {
            if (!this.isConnected() || !this.ws) {
                throw new Error('TEN Framework 未连接');
            }
            const messageId = this.generateMessageId();
            logger_1.logger.debug('TEN Framework 发送消息', {
                messageId,
                type: message.type,
                sessionId: message.sessionId,
                contentLength: typeof message.content === 'string' ? message.content.length : message.content.byteLength
            });
            // 根据消息类型处理
            await this.processMessage({
                messageId,
                ...message
            });
            return {
                messageId,
                status: 'sent'
            };
        }
        catch (error) {
            logger_1.logger.error('TEN Framework 发送消息失败', error);
            throw new errors_1.AIServiceError(`TEN Framework 消息发送失败: ${error.message}`, 'TEN_SEND_MESSAGE_ERROR');
        }
    }
    onMessage(callback) {
        this.on('message', callback);
    }
    onStatusChange(callback) {
        this.on('statusChange', callback);
    }
    async createSession(options) {
        try {
            const sessionId = this.generateSessionId();
            // 创建会话上下文
            const sessionContext = {
                sessionId,
                patientId: options.patientId,
                agoraChannelName: options.agoraChannelName,
                agoraUid: options.agoraUid,
                createdAt: new Date(),
                status: 'idle'
            };
            this.activeSessions.set(sessionId, sessionContext);
            // 生成 Agora Token（实际应用中应该调用 Agora 的 Token 生成服务）
            const agoraToken = this.generateAgoraToken(options.agoraChannelName, options.agoraUid);
            logger_1.logger.info('TEN Framework 会话创建成功', {
                sessionId,
                patientId: options.patientId,
                agoraChannelName: options.agoraChannelName
            });
            return {
                sessionId,
                agoraToken
            };
        }
        catch (error) {
            logger_1.logger.error('TEN Framework 会话创建失败', error);
            throw new errors_1.AIServiceError(`TEN Framework 会话创建失败: ${error.message}`, 'TEN_CREATE_SESSION_ERROR');
        }
    }
    // 私有方法：处理消息
    async processMessage(message) {
        try {
            const session = this.activeSessions.get(message.sessionId);
            if (!session) {
                throw new Error(`会话 ${message.sessionId} 不存在`);
            }
            // 更新会话状态
            this.updateSessionStatus(message.sessionId, 'processing');
            let textContent = '';
            // 根据消息类型处理
            if (message.type === 'text') {
                textContent = message.content;
            }
            else if (message.type === 'audio') {
                // 音频转文本（这里需要集成 STT 服务）
                textContent = await this.audioToText(message.content);
            }
            else if (message.type === 'image') {
                // 图像识别（这里需要集成视觉理解服务）
                textContent = await this.imageToText(message.content);
            }
            // 使用 Stepfun 生成回应
            const aiResponse = await this.stepfunService.generateResponse(textContent, {
                sessionId: message.sessionId,
                patientInfo: session.patientInfo
            });
            // 使用 ElevenLabs 合成语音
            this.updateSessionStatus(message.sessionId, 'speaking');
            const speechResponse = await this.elevenLabsService.synthesizeSpeech(aiResponse.response);
            // 发送响应
            const response = {
                messageId: this.generateMessageId(),
                type: 'text',
                content: aiResponse.response,
                confidence: aiResponse.confidence,
                sessionId: message.sessionId,
                metadata: {
                    audio_url: speechResponse.audio_url,
                    duration_ms: speechResponse.duration_ms,
                    original_message_id: message.messageId
                }
            };
            this.emit('message', response);
            // 更新会话状态为空闲
            this.updateSessionStatus(message.sessionId, 'idle');
            logger_1.logger.debug('TEN Framework 消息处理完成', {
                messageId: message.messageId,
                responseId: response.messageId,
                sessionId: message.sessionId
            });
        }
        catch (error) {
            logger_1.logger.error('TEN Framework 消息处理失败', error);
            // 发送错误响应
            this.emit('message', {
                messageId: this.generateMessageId(),
                type: 'text',
                content: '抱歉，我的大脑暂时无法思考，请稍后再试。',
                confidence: 0.0,
                sessionId: message.sessionId,
                metadata: {
                    error: true,
                    error_message: error.message
                }
            });
            this.updateSessionStatus(message.sessionId, 'idle');
        }
    }
    // 私有方法：更新会话状态
    updateSessionStatus(sessionId, status) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = status;
            this.activeSessions.set(sessionId, session);
            this.emit('statusChange', {
                sessionId,
                status
            });
            logger_1.logger.debug('TEN Framework 会话状态更新', {
                sessionId,
                status
            });
        }
    }
    // 私有方法：处理接收到的消息
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            logger_1.logger.debug('TEN Framework 接收消息', {
                type: message.type,
                sessionId: message.sessionId
            });
            // 处理不同类型的消息
            if (message.type === 'ping') {
                this.sendPong();
            }
            else if (message.type === 'status_update') {
                this.emit('statusChange', message.data);
            }
            else if (message.type === 'response') {
                this.emit('message', message.data);
            }
        }
        catch (error) {
            logger_1.logger.error('TEN Framework 消息解析失败', error);
        }
    }
    // 私有方法：处理重连
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger_1.logger.info(`TEN Framework 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect().catch(error => {
                    logger_1.logger.error('TEN Framework 重连失败', error);
                });
            }, this.reconnectInterval);
        }
        else {
            logger_1.logger.error('TEN Framework 重连尝试超过最大次数');
        }
    }
    // 私有方法：发送初始化消息
    sendInitMessage() {
        if (this.ws && this.isConnected) {
            const initMessage = {
                type: 'init',
                data: {
                    version: '1.0.0',
                    capabilities: ['text', 'audio', 'image'],
                    agora_app_id: config_1.config.ai.agora_app_id
                }
            };
            this.ws.send(JSON.stringify(initMessage));
            logger_1.logger.debug('TEN Framework 初始化消息已发送');
        }
    }
    // 私有方法：启动心跳
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // 每30秒发送一次心跳
    }
    // 私有方法：停止心跳
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    // 私有方法：发送 Pong 消息
    sendPong() {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'pong' }));
        }
    }
    // 私有方法：音频转文本（模拟实现）
    async audioToText(audioBuffer) {
        // 这里应该集成真实的 STT 服务（如 Deepgram）
        logger_1.logger.debug('音频转文本（模拟）', {
            audioSize: audioBuffer.byteLength
        });
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        return '用户通过语音说了一句话'; // 模拟结果
    }
    // 私有方法：图像转文本（模拟实现）
    async imageToText(imageUrl) {
        // 这里应该集成真实的视觉理解服务
        logger_1.logger.debug('图像识别（模拟）', {
            imageUrl: imageUrl.substring(0, 100)
        });
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        return '用户分享了一张图片'; // 模拟结果
    }
    // 私有方法：生成消息 ID
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    // 私有方法：生成会话 ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    // 私有方法：生成 Agora Token（模拟实现）
    generateAgoraToken(channelName, uid) {
        // 实际应用中应该使用 Agora 的 Token 生成算法
        const fakeToken = `agora_token_${channelName}_${uid}_${Date.now()}`;
        logger_1.logger.debug('Agora Token 生成（模拟）', {
            channelName,
            uid,
            token: fakeToken.substring(0, 50)
        });
        return fakeToken;
    }
    // 健康检查
    async healthCheck() {
        return this.isConnected();
    }
    // 获取服务统计信息
    getStats() {
        return {
            service: 'TEN Framework',
            endpoint: this.endpoint,
            isConnected: this.isConnected(),
            activeSessions: this.activeSessions.size,
            reconnectAttempts: this.reconnectAttempts
        };
    }
    // 获取活跃会话
    getActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }
    // 关闭会话
    async closeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            this.activeSessions.delete(sessionId);
            logger_1.logger.info('TEN Framework 会话已关闭', { sessionId });
        }
    }
}
exports.TENFrameworkServiceImpl = TENFrameworkServiceImpl;
// 服务工厂
class TENFrameworkServiceFactory {
    static instance = null;
    static create() {
        if (TENFrameworkServiceFactory.instance) {
            return TENFrameworkServiceFactory.instance;
        }
        TENFrameworkServiceFactory.instance = new TENFrameworkServiceImpl();
        logger_1.logger.info('TEN Framework 服务实例创建完成');
        return TENFrameworkServiceFactory.instance;
    }
    static getInstance() {
        return TENFrameworkServiceFactory.instance;
    }
    static reset() {
        TENFrameworkServiceFactory.instance = null;
    }
}
exports.TENFrameworkServiceFactory = TENFrameworkServiceFactory;
exports.default = TENFrameworkServiceFactory;
//# sourceMappingURL=ten-framework.js.map