// MiniMax API 服务
export interface MiniMaxMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface MiniMaxResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    name: string;
  }>;
}

class MiniMaxService {
  private apiKey: string;
  private baseUrl: string = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
  private groupId: string = '1948563511118405991';

  constructor() {
    this.apiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJNZWRqb3VybmV5IiwiVXNlck5hbWUiOiJNZWRqb3VybmV5IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5NDg1NjM1MTExMjI2MDAyOTUiLCJQaG9uZSI6IjEzOTAxNzYxMjk2IiwiR3JvdXBJRCI6IjE5NDg1NjM1MTExMTg0MDU5OTEiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0wNy0yNyAwNDozMDozMSIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.XCWZU3wWNp0DE_uuE53sS27RJ33hNKtvTmL4Dv31ArQ2YUpO6Cn_hUj65_JrOcw-NXkX1M6G1otGY3znzA1ken8YpUUZlIWX5t2ClWBN29472FGNSZxTTihrTUtb6QWsysITblmExacjF1UNEkN8mc1K0tR0dlo_n7E5ZhnziROmyAh9iFYwiDf9ix029-ggNTJbQW-3fqnvxtBttnTDqQ3o-0CQv3LAo3Ufy5xgLP9dgNN0XwvIVe8SDCUTiJ11GzOWtAtmsjE2C2IGw74uBfW-W2ONAb6KqVjJvQuyvya_zQ8TiDqygBXztJljnxjerHh_oMMHPDiCqxZTtEh_3Q';
  }

  // 发送聊天消息
  async sendMessage(
    messages: MiniMaxMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<MiniMaxResponse> {
    const {
      model = 'abab6.5s-chat',
      temperature = 0.7,
      maxTokens = 2048,
      stream = false
    } = options;

    const response = await fetch(`${this.baseUrl}?GroupId=${this.groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        tools: [{"type": "web_search"}],
        tool_choice: "none"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API错误: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // 处理多模态消息（文本+图片）
  async sendMultimodalMessage(
    text: string,
    images: File[] = [],
    history: ChatMessage[] = []
  ): Promise<string> {
    // 转换历史消息格式
    const systemMessage: MiniMaxMessage = {
      role: 'system',
      content: `你是一个专业的医疗AI助手，专门帮助用户整理和分析病史信息。你的任务是：

1. 帮助用户整理病史信息，包括症状、诊断、用药等
2. 分析上传的医疗文档和图片
3. 生成结构化的病史摘要
4. 为家属简报和医生仪表板提供专业建议
5. 使用温和、专业的语气，避免过于复杂的医学术语

请根据用户提供的信息，帮助整理和优化病史记录。`
    };

    const historyMessages: MiniMaxMessage[] = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // 处理图片上传
    let imageUrls: string[] = [];
    if (images.length > 0) {
      // 这里应该实现图片上传到服务器并获取URL的逻辑
      // 暂时使用模拟的base64数据
      for (const image of images) {
        const base64 = await this.fileToBase64(image);
        imageUrls.push(`data:${image.type};base64,${base64}`);
      }
    }

    // 构建消息内容
    const messageContent: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }> = [];

    // 添加文本内容
    if (text.trim()) {
      messageContent.push({
        type: 'text',
        text: text
      });
    }

    // 添加图片内容
    imageUrls.forEach(url => {
      messageContent.push({
        type: 'image_url',
        image_url: { url }
      });
    });

    const userMessage: MiniMaxMessage = {
      role: 'user',
      content: messageContent
    };

    const allMessages = [systemMessage, ...historyMessages, userMessage];

    try {
      const response = await this.sendMessage(allMessages, {
        temperature: 0.7,
        maxTokens: 2048
      });

      return response.choices[0]?.message?.content || '抱歉，我无法处理您的请求。';
    } catch (error) {
      console.error('MiniMax API调用失败:', error);
      throw error;
    }
  }

  // 文件转base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // 生成病史摘要
  async generateHistorySummary(history: ChatMessage[]): Promise<{
    summary: string;
    keyPoints: string[];
    recommendations: string[];
  }> {
    const messages: MiniMaxMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的医疗AI助手。请根据对话历史生成一个结构化的病史摘要，包括：
1. 主要症状和诊断
2. 用药情况
3. 家族病史
4. 生活习惯
5. 关键时间节点

请以JSON格式返回：
{
  "summary": "病史摘要",
  "keyPoints": ["关键点1", "关键点2"],
  "recommendations": ["建议1", "建议2"]
}`
      },
      {
        role: 'user',
        content: `请根据以下对话历史生成病史摘要：\n\n${history
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join('\n')}`
      }
    ];

    try {
      const response = await this.sendMessage(messages, {
        temperature: 0.3,
        maxTokens: 1024
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        // 尝试解析JSON响应
        const parsed = JSON.parse(content);
        return {
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          recommendations: parsed.recommendations || []
        };
      } catch {
        // 如果JSON解析失败，返回原始内容
        return {
          summary: content,
          keyPoints: [],
          recommendations: []
        };
      }
    } catch (error) {
      console.error('生成病史摘要失败:', error);
      throw error;
    }
  }

  // 生成家属简报
  async generateFamilyReport(history: ChatMessage[]): Promise<string> {
    const messages: MiniMaxMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的医疗AI助手。请根据病史信息生成一份家属简报，内容包括：
1. 患者基本情况
2. 主要症状和变化
3. 用药提醒
4. 日常护理建议
5. 需要关注的事项

请使用通俗易懂的语言，避免过于专业的医学术语。`
      },
      {
        role: 'user',
        content: `请根据以下病史信息生成家属简报：\n\n${history
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join('\n')}`
      }
    ];

    try {
      const response = await this.sendMessage(messages, {
        temperature: 0.5,
        maxTokens: 1024
      });

      return response.choices[0]?.message?.content || '无法生成家属简报。';
    } catch (error) {
      console.error('生成家属简报失败:', error);
      throw error;
    }
  }

  // 生成医生报告
  async generateDoctorReport(history: ChatMessage[]): Promise<string> {
    const messages: MiniMaxMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的医疗AI助手。请根据病史信息生成一份医生报告，内容包括：
1. 患者基本信息
2. 主诉和现病史
3. 既往史和家族史
4. 体格检查要点
5. 初步诊断和鉴别诊断
6. 治疗建议和随访计划

请使用专业的医学术语，格式规范。`
      },
      {
        role: 'user',
        content: `请根据以下病史信息生成医生报告：\n\n${history
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join('\n')}`
      }
    ];

    try {
      const response = await this.sendMessage(messages, {
        temperature: 0.3,
        maxTokens: 1024
      });

      return response.choices[0]?.message?.content || '无法生成医生报告。';
    } catch (error) {
      console.error('生成医生报告失败:', error);
      throw error;
    }
  }
}

export const minimaxService = new MiniMaxService();
export default minimaxService; 