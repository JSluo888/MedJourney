// 模拟API服务层 - 提供完整的数据接口
import { User, Message, HealthScore, SessionRecord, HealthMetrics } from '../types';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟数据存储
class MockDatabase {
  private users: Map<string, User> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private healthScores: Map<string, HealthScore> = new Map();
  private sessionRecords: Map<string, SessionRecord[]> = new Map();
  private medicalHistory: Map<string, string> = new Map();
  private uploadedFiles: Map<string, any[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 初始化模拟用户
    const mockUser: User = {
      id: 'user_001',
      name: '王奶奶',
      email: 'wang.nainai@example.com',
      age: 72,
      medicalHistory: '阿尔茨海默病早期，高血压，糖尿病',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face'
    };
    
    this.users.set(mockUser.id, mockUser);
    
    // 初始化健康评分
    const mockHealthScore: HealthScore = {
      overall: 85,
      cognitive: 78,
      emotional: 92,
      social: 88,
      lastUpdated: new Date()
    };
    
    this.healthScores.set(mockUser.id, mockHealthScore);
    
    // 初始化会话记录
    const mockSessions: SessionRecord[] = [
      {
        id: 'session_001',
        userId: mockUser.id,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        messages: [],
        healthMetrics: {
          emotionalState: 'positive',
          cognitivePerformance: 82,
          responseTime: 3.2,
          conversationQuality: 88
        }
      }
    ];
    
    this.sessionRecords.set(mockUser.id, mockSessions);
  }

  // 用户相关API
  async getUser(id: string): Promise<User | null> {
    await delay(200);
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(300);
    const user = this.users.get(id);
    if (!user) throw new Error('用户不存在');
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // 健康评分API
  async getHealthScore(userId: string): Promise<HealthScore | null> {
    await delay(150);
    return this.healthScores.get(userId) || null;
  }

  async updateHealthScore(userId: string, score: HealthScore): Promise<HealthScore> {
    await delay(200);
    const updatedScore = { ...score, lastUpdated: new Date() };
    this.healthScores.set(userId, updatedScore);
    return updatedScore;
  }

  // 消息API
  async getMessages(userId: string): Promise<Message[]> {
    await delay(100);
    const messages = this.messages.get(userId) || [];
    return messages;
  }

  async addMessage(userId: string, message: Message): Promise<Message> {
    await delay(150);
    const userMessages = this.messages.get(userId) || [];
    const newMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    userMessages.push(newMessage);
    this.messages.set(userId, userMessages);
    return newMessage;
  }

  async clearMessages(userId: string): Promise<void> {
    await delay(100);
    this.messages.set(userId, []);
  }

  // 病史API
  async getMedicalHistory(userId: string): Promise<string> {
    await delay(200);
    return this.medicalHistory.get(userId) || '';
  }

  async saveMedicalHistory(userId: string, history: string, files?: File[]): Promise<void> {
    await delay(1000); // 模拟文件上传时间
    this.medicalHistory.set(userId, history);
    
    if (files && files.length > 0) {
      const fileRecords = files.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }));
      
      const existingFiles = this.uploadedFiles.get(userId) || [];
      this.uploadedFiles.set(userId, [...existingFiles, ...fileRecords]);
    }
  }

  // 会话记录API
  async getSessionRecords(userId: string): Promise<SessionRecord[]> {
    await delay(300);
    return this.sessionRecords.get(userId) || [];
  }

  async createSessionRecord(userId: string, record: Omit<SessionRecord, 'id'>): Promise<SessionRecord> {
    await delay(200);
    const sessionRecord: SessionRecord = {
      ...record,
      id: 'session_' + Date.now().toString()
    };
    
    const userSessions = this.sessionRecords.get(userId) || [];
    userSessions.push(sessionRecord);
    this.sessionRecords.set(userId, userSessions);
    
    return sessionRecord;
  }

  // AI分析API
  async analyzeConversation(messages: Message[]): Promise<HealthMetrics> {
    await delay(2000); // 模拟AI分析时间
    
    // 模拟AI分析逻辑
    const positiveWords = ['好', '开心', '喜欢', '不错', '很好'];
    const negativeWords = ['不好', '难受', '痛苦', '烦恼', '担心'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let totalResponseTime = 0;
    
    messages.forEach(message => {
      if (message.sender === 'user') {
        positiveWords.forEach(word => {
          if (message.content.includes(word)) positiveCount++;
        });
        negativeWords.forEach(word => {
          if (message.content.includes(word)) negativeCount++;
        });
        
        // 模拟响应时间计算
        totalResponseTime += 2 + Math.random() * 3;
      }
    });
    
    const emotionalState = positiveCount > negativeCount ? 'positive' : 
                          negativeCount > positiveCount ? 'negative' : 'neutral';
    
    return {
      emotionalState,
      cognitivePerformance: 75 + Math.random() * 20, // 75-95
      responseTime: totalResponseTime / Math.max(1, messages.filter(m => m.sender === 'user').length),
      conversationQuality: 80 + Math.random() * 15 // 80-95
    };
  }
}

// 创建全局数据库实例
const mockDB = new MockDatabase();

// API接口
export const api = {
  // 认证API
  auth: {
    login: async (name: string, age?: number): Promise<User> => {
      await delay(1000);
      
      const user: User = {
        id: 'user_' + Date.now().toString(),
        name,
        email: `${name.toLowerCase()}@medjourney.com`,
        age
      };
      
      // 保存用户并初始化数据
      await mockDB.updateUser(user.id, user);
      
      // 初始化健康评分
      const initialScore: HealthScore = {
        overall: 80 + Math.random() * 15,
        cognitive: 75 + Math.random() * 20,
        emotional: 85 + Math.random() * 10,
        social: 80 + Math.random() * 15,
        lastUpdated: new Date()
      };
      
      await mockDB.updateHealthScore(user.id, initialScore);
      
      return user;
    },
    
    getCurrentUser: async (): Promise<User | null> => {
      // 从localStorage获取用户信息
      const userStr = localStorage.getItem('medjourney_user_profile');
      if (userStr) {
        const data = JSON.parse(userStr);
        return data.state?.user || null;
      }
      return null;
    }
  },

  // 用户API
  users: {
    get: mockDB.getUser.bind(mockDB),
    update: mockDB.updateUser.bind(mockDB)
  },

  // 健康评分API
  health: {
    getScore: mockDB.getHealthScore.bind(mockDB),
    updateScore: mockDB.updateHealthScore.bind(mockDB),
    
    // 生成每日健康报告
    generateDailyReport: async (userId: string): Promise<any> => {
      await delay(1500);
      
      const healthScore = await mockDB.getHealthScore(userId);
      const sessions = await mockDB.getSessionRecords(userId);
      
      return {
        date: new Date().toISOString().split('T')[0],
        healthScore,
        sessionCount: sessions.length,
        insights: [
          '今日的对话表现良好，情绪状态稳定',
          '认知测试结果在正常范围内',
          '建议继续保持规律的对话练习'
        ],
        recommendations: [
          '增加户外活动时间',
          '保持良好的睡眠习惯',
          '定期与家人交流'
        ]
      };
    }
  },

  // 消息API
  messages: {
    get: mockDB.getMessages.bind(mockDB),
    add: mockDB.addMessage.bind(mockDB),
    clear: mockDB.clearMessages.bind(mockDB)
  },

  // 病史API
  medical: {
    getHistory: mockDB.getMedicalHistory.bind(mockDB),
    saveHistory: mockDB.saveMedicalHistory.bind(mockDB)
  },

  // 会话API
  sessions: {
    get: mockDB.getSessionRecords.bind(mockDB),
    create: mockDB.createSessionRecord.bind(mockDB),
    
    // 结束会话并生成分析
    end: async (userId: string, sessionId: string, messages: Message[]): Promise<SessionRecord> => {
      const healthMetrics = await mockDB.analyzeConversation(messages);
      
      const sessionRecord: Omit<SessionRecord, 'id'> = {
        userId,
        startTime: new Date(Date.now() - messages.length * 30000), // 假设每条消息30秒
        endTime: new Date(),
        messages,
        healthMetrics
      };
      
      return await mockDB.createSessionRecord(userId, sessionRecord);
    }
  },

  // AI助手API
  ai: {
    // 发送消息并获取AI回复
    sendMessage: async (userId: string, message: string, type: 'text' | 'audio' | 'image' = 'text'): Promise<Message> => {
      await delay(800 + Math.random() * 1200); // 模拟AI处理时间
      
      // 智能回复逻辑
      let aiResponse = '';
      
      if (message.includes('你好') || message.includes('您好')) {
        aiResponse = '您好！很高兴与您聊天。今天感觉怎么样？';
      } else if (message.includes('疼') || message.includes('不舒服')) {
        aiResponse = '听起来您感到不适。请描述一下具体的情况，我会尽力帮助您。';
      } else if (message.includes('记不起') || message.includes('忘记')) {
        aiResponse = '记忆问题很常见，不用担心。我们可以一起慢慢回忆，或者聊聊其他开心的事情。';
      } else if (message.includes('家人') || message.includes('孩子')) {
        aiResponse = '家人是我们生活中最重要的支撑。您想分享一些关于家人的美好回忆吗？';
      } else if (message.includes('害怕') || message.includes('担心')) {
        aiResponse = '我理解您的担心。有什么具体让您感到不安的吗？我们可以一起面对。';
      } else {
        const responses = [
          '这听起来很有趣，请告诉我更多。',
          '我很想了解您的想法，继续说说吧。',
          '您说得很好，这让我想到了很多。',
          '这是一个很好的话题，我们深入聊聊。',
          '我在认真听您说话，请继续。'
        ];
        aiResponse = responses[Math.floor(Math.random() * responses.length)];
      }
      
      const responseMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse,
        type: 'text',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      // 保存AI回复
      await mockDB.addMessage(userId, responseMessage);
      
      return responseMessage;
    },
    
    // 认知评估
    cognitiveAssessment: async (userId: string): Promise<any> => {
      await delay(3000);
      
      return {
        assessmentId: 'assessment_' + Date.now(),
        date: new Date(),
        scores: {
          memory: 75 + Math.random() * 20,
          attention: 80 + Math.random() * 15,
          language: 85 + Math.random() * 10,
          orientation: 90 + Math.random() * 8,
          visualSpatial: 78 + Math.random() * 18
        },
        overallScore: 82 + Math.random() * 12,
        recommendations: [
          '建议增加记忆训练游戏',
          '保持规律的社交活动',
          '进行适度的体育锻炼'
        ]
      };
    }
  },

  // 报告API
  reports: {
    // 生成家属简报
    generateFamilyReport: async (userId: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob | any> => {
      try {
        const response = await fetch('/api/v1/reports/family-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ 
            userId,
            format,
            includeCharts: true
          })
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }

        if (format === 'json') {
          return response.json();
        } else {
          return response.blob();
        }
      } catch (error) {
        console.error('生成家属简报失败:', error);
        throw new Error('生成家属简报失败');
      }
    },
    
    // 生成医生报告
    generateDoctorReport: async (sessionId: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob | any> => {
      try {
        const response = await fetch(`/api/v1/reports/${sessionId}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ 
            format,
            includeCharts: true,
            includeRecommendations: true
          })
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }

        if (format === 'json') {
          return response.json();
        } else {
          return response.blob();
        }
      } catch (error) {
        console.error('生成医生报告失败:', error);
        throw new Error('生成医生报告失败');
      }
    },

    // 获取报告列表
    getReportsList: async (patientId: string, options?: {
      limit?: number;
      offset?: number;
      reportType?: string;
    }): Promise<any> => {
      try {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.reportType) params.append('reportType', options.reportType);

        const response = await fetch(`/api/v1/reports/list/${patientId}?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error('获取报告列表失败:', error);
        throw new Error('获取报告列表失败');
      }
    },

    // 获取特定报告
    getReport: async (reportId: string, format: 'json' | 'html' = 'json'): Promise<any> => {
      try {
        const response = await fetch(`/api/v1/reports/${reportId}?format=${format}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }

        if (format === 'html') {
          return response.text();
        }
        return response.json();
      } catch (error) {
        console.error('获取报告失败:', error);
        throw new Error('获取报告失败');
      }
    },

    // 下载报告
    downloadReport: async (reportId: string): Promise<Blob> => {
      try {
        const response = await fetch(`/api/v1/reports/${reportId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }

        return response.blob();
      } catch (error) {
        console.error('下载报告失败:', error);
        throw new Error('下载报告失败');
      }
    },

    // 删除报告
    deleteReport: async (reportId: string): Promise<void> => {
      try {
        const response = await fetch(`/api/v1/reports/${reportId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }
      } catch (error) {
        console.error('删除报告失败:', error);
        throw new Error('删除报告失败');
      }
    }
  }
};

export default api;