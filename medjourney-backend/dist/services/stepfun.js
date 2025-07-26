"use strict";
// Stepfun AI 服务类 - 替代 OpenAI
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepfunAIServiceImpl = exports.StepfunServiceFactory = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// Stepfun 服务实现类
class StepfunAIServiceImpl {
    client;
    model;
    temperature;
    constructor() {
        // 使用 OpenAI SDK，但指向 Stepfun 的 API
        this.client = new openai_1.default({
            apiKey: config_1.config.ai.stepfun_api_key,
            baseURL: config_1.config.ai.stepfun_base_url,
        });
        this.model = config_1.config.ai.stepfun_model;
        this.temperature = config_1.config.ai.temperature;
        logger_1.logger.info('Stepfun AI 服务初始化完成', {
            model: this.model,
            baseURL: config_1.config.ai.stepfun_base_url
        });
    }
    async generateResponse(prompt, context) {
        try {
            const startTime = Date.now();
            const messages = this.buildMessages(prompt, context);
            logger_1.logger.debug('发送Stepfun API请求', {
                model: this.model,
                messagesCount: messages.length,
                promptLength: prompt.length
            });
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: this.temperature,
                max_tokens: 1500,
                stream: false
            });
            const processingTime = Date.now() - startTime;
            const result = {
                response: response.choices[0].message.content || '',
                confidence: 0.9, // Stepfun 不提供置信度，使用默认值
                usage: {
                    prompt_tokens: response.usage?.prompt_tokens || 0,
                    completion_tokens: response.usage?.completion_tokens || 0,
                    total_tokens: response.usage?.total_tokens || 0
                }
            };
            logger_1.logger.info('Stepfun API调用成功', {
                model: this.model,
                tokens: result.usage.total_tokens,
                processingTime,
                responseLength: result.response.length
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Stepfun API调用失败', error, {
                model: this.model,
                promptLength: prompt.length,
                errorMessage: error.message
            });
            throw new errors_1.AIServiceError(`Stepfun AI服务调用失败: ${error.message}`, 'STEPFUN_API_ERROR');
        }
    }
    async *streamResponse(prompt, context) {
        try {
            const messages = this.buildMessages(prompt, context);
            logger_1.logger.debug('发送Stepfun流式API请求', {
                model: this.model,
                messagesCount: messages.length
            });
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: this.temperature,
                max_tokens: 1500,
                stream: true
            });
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || '';
                const done = chunk.choices[0]?.finish_reason !== null;
                if (delta) {
                    yield { delta, done };
                }
                if (done) {
                    logger_1.logger.debug('Stepfun流式响应完成');
                    break;
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Stepfun流式API调用失败', error);
            throw new errors_1.AIServiceError(`Stepfun流式服务调用失败: ${error.message}`, 'STEPFUN_STREAM_ERROR');
        }
    }
    async analyzeEmotion(text) {
        try {
            const prompt = `请分析以下文本的情感状态，并以JSON格式返回结果。

文本: "${text}"

请返回以下格式的JSON：
{
  "primary_emotion": "主要情感(happiness/sadness/anger/fear/surprise/neutral)",
  "confidence": 0.8,
  "emotions": {
    "happiness": 0.1,
    "sadness": 0.7,
    "anger": 0.1,
    "fear": 0.05,
    "surprise": 0.05,
    "neutral": 0.0
  }
}`;
            const response = await this.generateResponse(prompt);
            try {
                const parsed = JSON.parse(response.response);
                return {
                    emotion: parsed.primary_emotion || 'neutral',
                    confidence: parsed.confidence || 0.7,
                    emotions: parsed.emotions || { neutral: 1.0 }
                };
            }
            catch (parseError) {
                logger_1.logger.warn('情感分析JSON解析失败，使用基于关键词的分析', {
                    response: response.response.substring(0, 200)
                });
                // 回退到基于关键词的简单分析
                return this.fallbackEmotionAnalysis(text);
            }
        }
        catch (error) {
            logger_1.logger.error('Stepfun情感分析失败', error);
            return this.fallbackEmotionAnalysis(text);
        }
    }
    buildMessages(prompt, context) {
        const messages = [];
        // 系统提示词 - 针对医疗场景优化
        const systemPrompt = this.buildSystemPrompt(context);
        messages.push({
            role: 'system',
            content: systemPrompt
        });
        // 添加对话历史上下文
        if (context?.recentMessages && Array.isArray(context.recentMessages)) {
            context.recentMessages.slice(-5).forEach((msg) => {
                messages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }
        // 添加当前用户消息
        messages.push({
            role: 'user',
            content: prompt
        });
        return messages;
    }
    buildSystemPrompt(context) {
        let systemPrompt = `您是一个专业、温暖、充满耐心的阿尔茨海默病陪伴AI助手，名叫"小慧"。

您的核心使命：
- 为阿尔茨海默病患者提供情感陪伴和心理支持
- 使用简洁、易懂、温暖的语言进行交流
- 保持积极乐观的态度，给予患者希望和安慰
- 鼓励患者分享回忆和感受
- 提供适当的认知刺激活动建议

交流原则：
1. 始终保持耐心和理解
2. 使用患者容易理解的词汇
3. 避免复杂的医学术语
4. 不提供具体的医疗诊断或治疗建议
5. 当涉及健康问题时，建议咨询专业医生
6. 善于倾听，给予情感支持
7. 适时地提起美好的回忆话题

回应风格：
- 语调温暖亲切，像家人朋友一样
- 句子简短易懂
- 经常使用鼓励性语言
- 适当表达共情和理解`;
        // 添加患者个人信息上下文
        if (context?.patientInfo) {
            systemPrompt += `\n\n患者信息：
姓名：${context.patientInfo.name || '患者'}
年龄：${context.patientInfo.age || '未知'}
特殊关注：${context.patientInfo.medicalHistory || '无特殊说明'}`;
        }
        // 添加会话上下文
        if (context?.sessionType) {
            systemPrompt += `\n\n当前会话类型：${context.sessionType}
请根据会话类型调整您的响应方式。`;
        }
        return systemPrompt;
    }
    fallbackEmotionAnalysis(text) {
        const emotions = {
            happiness: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            neutral: 0.5
        };
        const textLower = text.toLowerCase();
        // 中文情感关键词匹配
        const emotionKeywords = {
            happiness: ['开心', '高兴', '快乐', '喜欢', '美好', '满意', '舒服', '幸福', '愉快'],
            sadness: ['难过', '伤心', '失望', '痛苦', '孤单', '沮丧', '悲伤', '忧伤'],
            anger: ['生气', '愤怒', '烦躁', '不满', '讨厌', '恼火', '气愤'],
            fear: ['害怕', '恐惧', '担心', '焦虑', '紧张', '不安', '恐慌'],
            surprise: ['惊讶', '意外', '惊奇', '惊喜', '没想到']
        };
        Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
            keywords.forEach(keyword => {
                if (textLower.includes(keyword)) {
                    emotions[emotion] += 0.3;
                }
            });
        });
        // 找出主导情感
        const primaryEmotion = Object.entries(emotions)
            .sort(([, a], [, b]) => b - a)[0][0];
        // 归一化
        const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(emotions).forEach(key => {
                emotions[key] = emotions[key] / total;
            });
        }
        return {
            emotion: primaryEmotion,
            confidence: Math.max(emotions[primaryEmotion], 0.5),
            emotions
        };
    }
    // 健康检查
    async healthCheck() {
        try {
            const response = await this.generateResponse('你好', {
                sessionType: 'health_check'
            });
            return response.response.length > 0;
        }
        catch (error) {
            logger_1.logger.error('Stepfun健康检查失败', error);
            return false;
        }
    }
    // 获取服务统计信息
    getStats() {
        return {
            service: 'Stepfun',
            model: this.model,
            baseURL: config_1.config.ai.stepfun_base_url,
            isConfigured: !!config_1.config.ai.stepfun_api_key
        };
    }
}
exports.StepfunAIServiceImpl = StepfunAIServiceImpl;
// 服务工厂
class StepfunServiceFactory {
    static instance = null;
    static create() {
        if (StepfunServiceFactory.instance) {
            return StepfunServiceFactory.instance;
        }
        StepfunServiceFactory.instance = new StepfunAIServiceImpl();
        logger_1.logger.info('Stepfun AI服务实例创建完成');
        return StepfunServiceFactory.instance;
    }
    static getInstance() {
        return StepfunServiceFactory.instance;
    }
    static reset() {
        StepfunServiceFactory.instance = null;
    }
}
exports.StepfunServiceFactory = StepfunServiceFactory;
exports.default = StepfunServiceFactory;
//# sourceMappingURL=stepfun.js.map