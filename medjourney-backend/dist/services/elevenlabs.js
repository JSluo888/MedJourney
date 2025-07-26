"use strict";
// ElevenLabs 语音合成服务
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsServiceImpl = exports.ElevenLabsServiceFactory = void 0;
// 使用动态导入处理ES模块
let fetch;
const ws_1 = __importDefault(require("ws"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// ElevenLabs 服务实现类
class ElevenLabsServiceImpl {
    apiKey;
    voiceId;
    modelId;
    baseURL = 'https://api.elevenlabs.io/v1';
    constructor() {
        this.apiKey = config_1.config.ai.elevenlabs_api_key;
        this.voiceId = config_1.config.ai.elevenlabs_voice_id;
        this.modelId = config_1.config.ai.elevenlabs_model_id;
        logger_1.logger.info('ElevenLabs 语音合成服务初始化完成', {
            voiceId: this.voiceId,
            modelId: this.modelId
        });
    }
    async synthesizeSpeech(text, options) {
        try {
            // 初始化 fetch
            if (!fetch) {
                const { default: fetchImpl } = await Promise.resolve().then(() => __importStar(require('node-fetch')));
                fetch = fetchImpl;
            }
            const startTime = Date.now();
            const voiceId = options?.voice_id || this.voiceId;
            const modelId = options?.model_id || this.modelId;
            logger_1.logger.debug('开始 ElevenLabs 语音合成', {
                textLength: text.length,
                voiceId,
                modelId
            });
            const requestBody = {
                text,
                model_id: modelId,
                voice_settings: {
                    stability: options?.voice_settings?.stability || 0.5,
                    similarity_boost: options?.voice_settings?.similarity_boost || 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            };
            const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API 错误: ${response.status} - ${errorText}`);
            }
            const audioBuffer = await response.arrayBuffer();
            const processingTime = Date.now() - startTime;
            // 模拟音频时长（基于文本长度估算）
            const estimatedDuration = Math.max(text.length * 100, 1000); // 每个字符约100ms
            logger_1.logger.info('ElevenLabs 语音合成成功', {
                textLength: text.length,
                audioSize: audioBuffer.byteLength,
                processingTime,
                estimatedDuration
            });
            // 生成临时URL（实际项目中需要上传到存储服务）
            const audioUrl = this.generateTempAudioUrl(audioBuffer);
            return {
                audio_url: audioUrl,
                audio_data: audioBuffer,
                duration_ms: estimatedDuration
            };
        }
        catch (error) {
            logger_1.logger.error('ElevenLabs 语音合成失败', error, {
                textLength: text.length,
                errorMessage: error.message
            });
            throw new errors_1.AIServiceError(`ElevenLabs 语音合成失败: ${error.message}`, 'ELEVENLABS_SYNTHESIS_ERROR');
        }
    }
    async *streamSpeech(text, options) {
        try {
            const voiceId = options?.voice_id || this.voiceId;
            const modelId = options?.model_id || this.modelId;
            logger_1.logger.debug('开始 ElevenLabs 流式语音合成', {
                textLength: text.length,
                voiceId
            });
            // 构建 WebSocket URL
            const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`;
            const ws = new ws_1.default(wsUrl);
            return new Promise((resolve, reject) => {
                const audioChunks = [];
                let chunkIndex = 0;
                ws.on('open', () => {
                    logger_1.logger.debug('ElevenLabs WebSocket 连接已建立');
                    // 发送BOS（Beginning of Speech）消息
                    const bosMessage = {
                        text: ' ', // 必须包含一个空格
                        voice_settings: {
                            stability: options?.voice_settings?.stability || 0.5,
                            similarity_boost: options?.voice_settings?.similarity_boost || 0.75
                        },
                        xi_api_key: this.apiKey
                    };
                    ws.send(JSON.stringify(bosMessage));
                    // 分块发送文本
                    const textChunks = this.splitTextIntoChunks(text, 100);
                    textChunks.forEach((chunk, index) => {
                        setTimeout(() => {
                            const message = {
                                text: chunk,
                                try_trigger_generation: true
                            };
                            ws.send(JSON.stringify(message));
                        }, index * 100); // 每100ms发送一个块
                    });
                    // 发送EOS（End of Speech）消息
                    setTimeout(() => {
                        const eosMessage = { text: '' };
                        ws.send(JSON.stringify(eosMessage));
                    }, textChunks.length * 100 + 500);
                });
                ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        if (response.audio) {
                            const audioChunk = Buffer.from(response.audio, 'base64');
                            audioChunks.push(audioChunk.buffer.slice(audioChunk.byteOffset, audioChunk.byteOffset + audioChunk.byteLength));
                            // 返回流式数据
                            resolve((async function* () {
                                yield {
                                    audio_chunk: audioChunk.buffer,
                                    is_final: false
                                };
                            })());
                        }
                        if (response.isFinal) {
                            logger_1.logger.debug('ElevenLabs 流式合成完成');
                            resolve((async function* () {
                                yield {
                                    audio_chunk: new ArrayBuffer(0),
                                    is_final: true
                                };
                            })());
                        }
                    }
                    catch (parseError) {
                        logger_1.logger.error('ElevenLabs WebSocket 消息解析失败', parseError);
                    }
                });
                ws.on('error', (error) => {
                    logger_1.logger.error('ElevenLabs WebSocket 错误', error);
                    reject(new errors_1.AIServiceError(`ElevenLabs 流式服务错误: ${error.message}`, 'ELEVENLABS_STREAM_ERROR'));
                });
                ws.on('close', () => {
                    logger_1.logger.debug('ElevenLabs WebSocket 连接关闭');
                });
            });
        }
        catch (error) {
            logger_1.logger.error('ElevenLabs 流式语音合成失败', error);
            throw new errors_1.AIServiceError(`ElevenLabs 流式服务失败: ${error.message}`, 'ELEVENLABS_STREAM_ERROR');
        }
    }
    async getVoices() {
        try {
            // 初始化 fetch
            if (!fetch) {
                const { default: fetchImpl } = await Promise.resolve().then(() => __importStar(require('node-fetch')));
                fetch = fetchImpl;
            }
            logger_1.logger.debug('获取 ElevenLabs 声音列表');
            const response = await fetch(`${this.baseURL}/voices`, {
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`获取声音列表失败: ${response.status}`);
            }
            const data = await response.json();
            const voices = data.voices.map(voice => ({
                voice_id: voice.voice_id,
                name: voice.name,
                category: voice.category,
                language: voice.labels?.language || '未知'
            }));
            logger_1.logger.info('ElevenLabs 声音列表获取成功', {
                voiceCount: voices.length
            });
            return voices;
        }
        catch (error) {
            logger_1.logger.error('ElevenLabs 获取声音列表失败', error);
            throw new errors_1.AIServiceError(`获取ElevenLabs声音列表失败: ${error.message}`, 'ELEVENLABS_VOICES_ERROR');
        }
    }
    // 辅助方法：将文本分块
    splitTextIntoChunks(text, maxChunkSize) {
        const sentences = text.split(/[。！？、，]/);
        const chunks = [];
        let currentChunk = '';
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
            else {
                currentChunk += sentence;
            }
        }
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks.filter(chunk => chunk.length > 0);
    }
    // 辅助方法：生成临时音频URL
    generateTempAudioUrl(audioBuffer) {
        // 实际应用中，这里应该上传到存储服务并返回真实 URL
        // 这里仅作为示例
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        return `data:audio/mpeg;base64,${base64Audio}`;
    }
    // 健康检查
    async healthCheck() {
        try {
            const voices = await this.getVoices();
            return voices.length > 0;
        }
        catch (error) {
            logger_1.logger.error('ElevenLabs 健康检查失败', error);
            return false;
        }
    }
    // 获取服务统计信息
    getStats() {
        return {
            service: 'ElevenLabs',
            voice_id: this.voiceId,
            model_id: this.modelId,
            isConfigured: !!this.apiKey
        };
    }
}
exports.ElevenLabsServiceImpl = ElevenLabsServiceImpl;
// 服务工厂
class ElevenLabsServiceFactory {
    static instance = null;
    static create() {
        if (ElevenLabsServiceFactory.instance) {
            return ElevenLabsServiceFactory.instance;
        }
        ElevenLabsServiceFactory.instance = new ElevenLabsServiceImpl();
        logger_1.logger.info('ElevenLabs 语音合成服务实例创建完成');
        return ElevenLabsServiceFactory.instance;
    }
    static getInstance() {
        return ElevenLabsServiceFactory.instance;
    }
    static reset() {
        ElevenLabsServiceFactory.instance = null;
    }
}
exports.ElevenLabsServiceFactory = ElevenLabsServiceFactory;
exports.default = ElevenLabsServiceFactory;
//# sourceMappingURL=elevenlabs.js.map