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
  private groupId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_MINIMAX_API_KEY || '';
    this.groupId = import.meta.env.VITE_MINIMAX_GROUP_ID || '';
    
    if (!this.apiKey || !this.groupId) {
    }
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
    // MiniMax multimodal message processing

    // 转换历史消息格式
    const systemMessage: MiniMaxMessage = {
      role: 'system',
      content: `你是一个专业的医疗AI助手，专门帮助用户整理和分析非结构化的病史信息。你的任务是：

1. 理解用户提供的非结构化病情描述和过往病史
2. 从描述中提取关键信息：
   - 主要症状和不适
   - 疾病史和手术史
   - 用药情况
   - 家族病史
   - 生活习惯和过敏史
   - 检查结果
3. 将非结构化信息整理成结构化的病史记录
4. 分析健康状况和潜在风险
5. 为家属简报和医生仪表板提供专业建议
6. 使用温和、专业的语气，避免过于复杂的医学术语

请根据用户提供的非结构化描述，帮助整理和优化病史记录。如果信息不完整，可以适当询问补充信息。`
    };

    const historyMessages: MiniMaxMessage[] = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // History messages processed

    // 处理图片上传
    let imageUrls: string[] = [];
    if (images.length > 0) {
      try {
        for (const image of images) {
          const base64 = await this.fileToBase64(image);
          const dataUrl = `data:${image.type};base64,${base64}`;
          imageUrls.push(dataUrl);
        }
      } catch (error) {
        console.error('图片处理失败:', error);
        throw new Error(`图片处理失败: ${error}`);
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
      // Text content added
    }

    // 添加图片内容
    imageUrls.forEach((url, index) => {
      messageContent.push({
        type: 'image_url',
        image_url: { url }
      });
      // Image added to message content
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

      const result = response.choices[0]?.message?.content || '抱歉，我无法处理您的请求。';
      return result;
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
        content: `你是一个专业的医疗AI助手。请根据用户提供的非结构化病史描述，生成一个结构化的病史摘要。

请从病史描述中提取并整理以下信息：
1. 主要症状和不适表现
2. 疾病史和手术史
3. 用药情况（当前用药、既往用药、药物过敏等）
4. 家族病史
5. 生活习惯和过敏史
6. 检查结果（如有）
7. 关键时间节点和病情变化

请以JSON格式返回：
{
  "summary": "病史摘要（简要概述患者的主要病史信息）",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "recommendations": ["建议1", "建议2", "建议3"]
}

关键点应包含最重要的病史信息，建议应包含针对性的医疗建议和注意事项。`
      },
      {
        role: 'user',
        content: `请根据以下病史描述生成病史摘要：\n\n${history
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
        content: `你是一个专业的医疗AI助手。请根据用户提供的非结构化病史描述，生成一份家属简报。

请从病史描述中提取以下信息并整理成家属简报：
1. 患者基本情况（年龄、性别等）
2. 主要症状和不适表现
3. 疾病史和手术史
4. 用药情况和注意事项
5. 家族病史（如有）
6. 生活习惯和过敏史
7. 最近的检查结果

请使用通俗易懂的语言，避免过于专业的医学术语，重点关注：
- 需要家属关注的重要症状变化
- 用药提醒和注意事项
- 日常护理建议
- 需要及时就医的情况
- 预防措施

如果信息不完整，请说明需要补充的信息。`
      },
      {
        role: 'user',
        content: `请根据以下病史描述生成家属简报：\n\n${history
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
        content: `你是一个专业的医疗AI助手。请根据用户提供的非结构化病史描述，生成一份专业的医生报告。

请从病史描述中提取并整理以下信息：
1. 患者基本信息（年龄、性别、职业等）
2. 主诉（主要症状和不适）
3. 现病史（症状的详细描述、时间、变化等）
4. 既往史（疾病史、手术史、外伤史等）
5. 个人史（生活习惯、吸烟饮酒史、过敏史等）
6. 家族史（遗传性疾病、家族成员疾病史等）
7. 用药史（当前用药、既往用药、药物过敏等）
8. 检查结果（如有）

请使用专业的医学术语，格式规范，重点关注：
- 症状的详细描述和演变过程
- 可能的诊断和鉴别诊断
- 需要进一步检查的项目
- 治疗建议和随访计划
- 风险评估和注意事项

如果信息不完整，请指出需要补充的关键信息。`
      },
      {
        role: 'user',
        content: `请根据以下病史描述生成医生报告：\n\n${history
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