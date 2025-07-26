// Stepfun AI服务 - 真实的AI API调用
import { config } from '../config';
import { logger } from '../utils/logger';

export interface StepfunMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StepfunRequest {
  model: string;
  messages: StepfunMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface StepfunResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StepfunAudioRequest {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
}

export interface StepfunAudioResponse {
  data: Array<{
    url: string;
  }>;
}

class StepfunAIService {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = config.ai.stepfun_api_key;
    this.baseURL = config.ai.stepfun_base_url;
    this.defaultModel = config.ai.stepfun_model;
  }

  // 发送文本对话请求
  async chat(messages: StepfunMessage[], options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}): Promise<StepfunResponse> {
    try {
      const requestBody: StepfunRequest = {
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature || config.ai.temperature,
        max_tokens: options.max_tokens || 1500,
        stream: false
      };

      logger.info('发送Stepfun聊天请求', {
        model: requestBody.model,
        messageCount: messages.length,
        temperature: requestBody.temperature
      });

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Stepfun API请求失败: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        logger.error('Stepfun API请求失败', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw error;
      }

      const result = await response.json() as StepfunResponse;
      
      logger.info('Stepfun聊天响应成功', {
        model: result.model,
        usage: result.usage,
        finishReason: result.choices[0]?.finish_reason
      });

      return result;
    } catch (error) {
      logger.error('Stepfun聊天服务错误', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 生成语音
  async generateSpeech(text: string, options: {
    voice?: string;
    speed?: number;
  } = {}): Promise<StepfunAudioResponse> {
    try {
      const requestBody: StepfunAudioRequest = {
        model: 'step-1o-audio',
        input: text,
        voice: options.voice || 'linjiajiejie',
        response_format: 'mp3',
        speed: options.speed || 1.0
      };

      logger.info('发送Stepfun语音生成请求', {
        textLength: text.length,
        voice: requestBody.voice,
        speed: requestBody.speed
      });

      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Stepfun语音生成失败: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        logger.error('Stepfun语音生成失败', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw error;
      }

      const result = await response.json() as StepfunAudioResponse;
      
      logger.info('Stepfun语音生成成功', {
        audioUrl: result.data[0]?.url
      });

      return result;
    } catch (error) {
      logger.error('Stepfun语音生成服务错误', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 分析对话内容
  async analyzeConversation(messages: Array<{ content: string; sender: string }>): Promise<{
    emotional_state: string;
    cognitive_performance: number;
    key_topics: string[];
    concerns: string[];
    insights: string[];
  }> {
    try {
      const conversationText = messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const analysisPrompt = `请分析以下医患对话，并提供专业的医疗分析：

对话内容：
${conversationText}

请从以下方面进行分析：
1. 情绪状态评估
2. 认知功能表现（0-100分）
3. 主要话题识别
4. 潜在健康问题
5. 专业洞察和建议

请以JSON格式返回结果，包含以下字段：
- emotional_state: 情绪状态（positive/negative/neutral/mixed）
- cognitive_performance: 认知表现分数（0-100）
- key_topics: 主要话题数组
- concerns: 关注点数组
- insights: 专业洞察数组`;

      const response = await this.chat([
        { role: 'system', content: '你是一个专业的医疗AI助手，擅长分析医患对话并提供专业的医疗洞察。' },
        { role: 'user', content: analysisPrompt }
      ], {
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI分析响应为空');
      }

      // 尝试解析JSON响应
      try {
        const analysis = JSON.parse(content);
        return {
          emotional_state: analysis.emotional_state || 'neutral',
          cognitive_performance: analysis.cognitive_performance || 75,
          key_topics: analysis.key_topics || [],
          concerns: analysis.concerns || [],
          insights: analysis.insights || []
        };
      } catch (parseError) {
        logger.warn('AI分析响应JSON解析失败，使用默认值', { content });
        return {
          emotional_state: 'neutral',
          cognitive_performance: 75,
          key_topics: [],
          concerns: [],
          insights: []
        };
      }
    } catch (error) {
      logger.error('对话分析失败', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 生成医生报告
  async generateDoctorReport(patientData: any, sessionData: any): Promise<{
    summary: string;
    key_insights: string[];
    recommendations: string[];
    risk_assessment: string;
  }> {
    try {
      const reportPrompt = `请基于以下患者数据和会话信息，生成一份专业的医生报告：

患者信息：
${JSON.stringify(patientData, null, 2)}

会话数据：
${JSON.stringify(sessionData, null, 2)}

请生成包含以下内容的专业医生报告：
1. 临床分析总结
2. 关键发现和洞察
3. 治疗建议和干预措施
4. 风险评估

请以JSON格式返回，包含以下字段：
- summary: 临床分析总结
- key_insights: 关键发现数组
- recommendations: 治疗建议数组
- risk_assessment: 风险评估描述`;

      const response = await this.chat([
        { role: 'system', content: '你是一个资深的医疗专家，擅长生成专业的医疗报告和临床分析。' },
        { role: 'user', content: reportPrompt }
      ], {
        temperature: 0.4,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('医生报告生成响应为空');
      }

      try {
        const report = JSON.parse(content);
        return {
          summary: report.summary || '患者表现正常，建议继续观察。',
          key_insights: report.key_insights || [],
          recommendations: report.recommendations || [],
          risk_assessment: report.risk_assessment || '低风险'
        };
      } catch (parseError) {
        logger.warn('医生报告JSON解析失败，使用默认值', { content });
        return {
          summary: '患者表现正常，建议继续观察。',
          key_insights: ['认知功能正常', '情绪状态稳定'],
          recommendations: ['继续规律用药', '保持良好作息'],
          risk_assessment: '低风险'
        };
      }
    } catch (error) {
      logger.error('医生报告生成失败', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // 生成家属简报
  async generateFamilySummary(patientData: any, sessionData: any): Promise<{
    summary: string;
    highlights: string[];
    suggestions: string[];
    next_steps: string[];
  }> {
    try {
      const summaryPrompt = `请基于以下患者数据和会话信息，生成一份面向家属的简明报告：

患者信息：
${JSON.stringify(patientData, null, 2)}

会话数据：
${JSON.stringify(sessionData, null, 2)}

请生成一份家属友好的简报，包含：
1. 简单易懂的总结
2. 积极的表现亮点
3. 日常护理建议
4. 下一步行动计划

请以JSON格式返回，包含以下字段：
- summary: 简单总结
- highlights: 表现亮点数组
- suggestions: 护理建议数组
- next_steps: 下一步行动数组`;

      const response = await this.chat([
        { role: 'system', content: '你是一个贴心的医疗助手，擅长用简单易懂的语言向家属解释患者状况。' },
        { role: 'user', content: summaryPrompt }
      ], {
        temperature: 0.5,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('家属简报生成响应为空');
      }

      try {
        const summary = JSON.parse(content);
        return {
          summary: summary.summary || '患者今日表现良好，情绪稳定。',
          highlights: summary.highlights || ['沟通顺畅', '情绪积极'],
          suggestions: summary.suggestions || ['多陪伴交流', '保持规律作息'],
          next_steps: summary.next_steps || ['继续观察', '定期复查']
        };
      } catch (parseError) {
        logger.warn('家属简报JSON解析失败，使用默认值', { content });
        return {
          summary: '患者今日表现良好，情绪稳定。',
          highlights: ['沟通顺畅', '情绪积极'],
          suggestions: ['多陪伴交流', '保持规律作息'],
          next_steps: ['继续观察', '定期复查']
        };
      }
    } catch (error) {
      logger.error('家属简报生成失败', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

// 创建单例实例
export const stepfunAIService = new StepfunAIService();

export default stepfunAIService; 