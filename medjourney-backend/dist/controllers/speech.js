"use strict";
// 语音合成控制器
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechController = void 0;
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
const elevenlabs_1 = __importDefault(require("../services/elevenlabs"));
class SpeechController {
    elevenLabsService;
    constructor() {
        this.elevenLabsService = elevenlabs_1.default.create();
    }
    // ElevenLabs 语音合成
    async synthesizeSpeech(req, res) {
        try {
            const { text, voice_id, model_id, voice_settings } = req.body;
            const userId = req.user?.patient_id;
            logger_1.logger.info('开始语音合成', {
                textLength: text.length,
                voice_id,
                model_id,
                userId
            });
            // 调用 ElevenLabs 服务进行语音合成
            const speechResult = await this.elevenLabsService.synthesizeSpeech(text, {
                voice_id,
                model_id,
                voice_settings
            });
            // 记录语音合成日志
            logger_1.logger.info('语音合成成功', {
                textLength: text.length,
                audioSize: speechResult.audio_data.byteLength,
                duration: speechResult.duration_ms,
                userId
            });
            const response = response_1.default.success(res, {
                audio_url: speechResult.audio_url,
                duration_ms: speechResult.duration_ms,
                audio_size: speechResult.audio_data.byteLength,
                text_length: text.length,
                voice_id: voice_id || '默认声音',
                model_id: model_id || '默认模型',
                created_at: new Date().toISOString()
            }, '语音合成成功');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('语音合成失败', error);
            const response = response_1.default.error(res, '语音合成失败', 'SPEECH_SYNTHESIS_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 流式语音合成
    async streamSpeech(req, res) {
        try {
            const { text, voice_id, model_id } = req.body;
            const userId = req.user?.patient_id;
            logger_1.logger.info('开始流式语音合成', {
                textLength: text.length,
                voice_id,
                model_id,
                userId
            });
            // 设置响应头为流式数据
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            let totalChunks = 0;
            let totalSize = 0;
            try {
                // 创建流式语音合成迬代器
                const speechStream = this.elevenLabsService.streamSpeech(text, {
                    voice_id,
                    model_id
                });
                // 流式输出音频数据
                for await (const chunk of speechStream) {
                    if (chunk.audio_chunk.byteLength > 0) {
                        res.write(Buffer.from(chunk.audio_chunk));
                        totalChunks++;
                        totalSize += chunk.audio_chunk.byteLength;
                    }
                    if (chunk.is_final) {
                        break;
                    }
                }
                res.end();
                logger_1.logger.info('流式语音合成完成', {
                    textLength: text.length,
                    totalChunks,
                    totalSize,
                    userId
                });
            }
            catch (streamError) {
                logger_1.logger.error('流式语音合成错误', streamError);
                if (!res.headersSent) {
                    const response = response_1.default.error(res, '流式语音合成失败', 'STREAM_SPEECH_ERROR', streamError.message);
                    res.status(500).json(response);
                }
                else {
                    res.end();
                }
            }
        }
        catch (error) {
            logger_1.logger.error('流式语音合成初始化失败', error);
            if (!res.headersSent) {
                const response = response_1.default.error(res, '流式语音合成初始化失败', 'STREAM_SPEECH_INIT_ERROR', error.message);
                res.status(500).json(response);
            }
        }
    }
    // 获取可用声音列表
    async getVoices(req, res) {
        try {
            logger_1.logger.debug('获取ElevenLabs声音列表');
            const voices = await this.elevenLabsService.getVoices();
            // 过滤出支持中文的声音
            const chineseVoices = voices.filter((voice) => voice.language.includes('中文') ||
                voice.language.includes('Chinese') ||
                voice.language.includes('zh'));
            const response = response_1.default.success(res, {
                voices: voices,
                chinese_voices: chineseVoices,
                total_count: voices.length,
                chinese_count: chineseVoices.length,
                recommended_voice: chineseVoices[0] || voices[0]
            }, '声音列表获取成功');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('获取声音列表失败', error);
            const response = response_1.default.error(res, '获取声音列表失败', 'GET_VOICES_ERROR', error.message);
            res.status(500).json(response);
        }
    }
    // 获取语音合成服务状态
    async getStatus(req, res) {
        try {
            logger_1.logger.debug('获取ElevenLabs服务状态');
            // 检查服务健康状态
            const isHealthy = await this.elevenLabsService.healthCheck();
            const stats = this.elevenLabsService.getStats();
            const status = {
                service: 'ElevenLabs',
                status: isHealthy ? 'healthy' : 'unhealthy',
                configuration: {
                    voice_id: stats.voice_id,
                    model_id: stats.model_id,
                    is_configured: stats.isConfigured
                },
                last_check: new Date().toISOString(),
                capabilities: [
                    'text_to_speech',
                    'stream_synthesis',
                    'voice_selection',
                    'chinese_support'
                ]
            };
            const response = response_1.default.success(res, status, 'ElevenLabs服务状态获取成功');
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('获取ElevenLabs服务状态失败', error);
            const response = response_1.default.error(res, '获取服务状态失败', 'GET_STATUS_ERROR', error.message);
            res.status(500).json(response);
        }
    }
}
exports.SpeechController = SpeechController;
//# sourceMappingURL=speech.js.map