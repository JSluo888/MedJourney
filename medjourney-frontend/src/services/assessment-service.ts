import { api } from './api';
import { BasicAssessment, CaseAssessment } from '../types';

export interface AssessmentSession {
  id: string;
  patientId: string;
  status: 'basic' | 'case' | 'chat' | 'completed';
  basicData?: BasicAssessment;
  caseData?: CaseAssessment;
  chatData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class AssessmentService {
  private static instance: AssessmentService;
  private currentSession: AssessmentSession | null = null;

  static getInstance(): AssessmentService {
    if (!AssessmentService.instance) {
      AssessmentService.instance = new AssessmentService();
    }
    return AssessmentService.instance;
  }

  // 创建新的评估会话
  async createAssessmentSession(patientId: string): Promise<AssessmentSession> {
    try {
      const response = await api.post('/assessment/session', { patientId });
      this.currentSession = response.data.session;
      return this.currentSession;
    } catch (error) {
      console.error('创建评估会话失败:', error);
      throw error;
    }
  }

  // 提交基础评估数据
  async submitBasicAssessment(data: BasicAssessment): Promise<void> {
    if (!this.currentSession) {
      throw new Error('没有活动的评估会话');
    }

    try {
      await api.post(`/assessment/${this.currentSession.id}/basic`, {
        assessmentData: data,
        assessmentType: 'basic'
      });

      this.currentSession.basicData = data;
      this.currentSession.status = 'case';
      this.currentSession.updatedAt = new Date();
    } catch (error) {
      console.error('提交基础评估失败:', error);
      throw error;
    }
  }

  // 提交病例评估数据
  async submitCaseAssessment(data: CaseAssessment): Promise<void> {
    if (!this.currentSession) {
      throw new Error('没有活动的评估会话');
    }

    try {
      // 处理图片文件上传
      const uploadedFiles = await this.uploadImages(data.images);
      
      const caseDataWithFiles = {
        ...data,
        images: uploadedFiles
      };

      await api.post(`/assessment/${this.currentSession.id}/case`, {
        assessmentData: caseDataWithFiles,
        assessmentType: 'case'
      });

      this.currentSession.caseData = caseDataWithFiles;
      this.currentSession.status = 'chat';
      this.currentSession.updatedAt = new Date();
    } catch (error) {
      console.error('提交病例评估失败:', error);
      throw error;
    }
  }

  // 上传图片文件
  private async uploadImages(images: any[]): Promise<any[]> {
    const uploadedFiles = [];
    
    for (const image of images) {
      if (image.url && image.url.startsWith('data:')) {
        // 将 base64 转换为文件对象
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], `image_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // 上传文件
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', image.type);
        formData.append('description', image.description);
        
        try {
          const uploadResponse = await api.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          uploadedFiles.push({
            ...image,
            fileId: uploadResponse.data.fileId,
            url: uploadResponse.data.url
          });
        } catch (uploadError) {
          console.error('图片上传失败:', uploadError);
          // 继续处理其他图片
        }
      } else {
        uploadedFiles.push(image);
      }
    }
    
    return uploadedFiles;
  }

  // 完成评估会话
  async completeAssessment(chatData?: any): Promise<any> {
    if (!this.currentSession) {
      throw new Error('没有活动的评估会话');
    }

    try {
      const response = await api.post(`/assessment/${this.currentSession.id}/complete`, {
        chatData,
        assessmentType: 'complete'
      });

      this.currentSession.chatData = chatData;
      this.currentSession.status = 'completed';
      this.currentSession.updatedAt = new Date();

      return response.data;
    } catch (error) {
      console.error('完成评估失败:', error);
      throw error;
    }
  }

  // 获取评估报告
  async getAssessmentReport(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`/assessment/${sessionId}/report`);
      return response.data;
    } catch (error) {
      console.error('获取评估报告失败:', error);
      throw error;
    }
  }

  // 获取评估历史
  async getAssessmentHistory(patientId: string, options?: {
    page?: number;
    limit?: number;
    assessmentType?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.assessmentType) params.append('assessmentType', options.assessmentType);

      const response = await api.get(`/assessment/history/${patientId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('获取评估历史失败:', error);
      throw error;
    }
  }

  // 获取当前会话
  getCurrentSession(): AssessmentSession | null {
    return this.currentSession;
  }

  // 设置当前会话
  setCurrentSession(session: AssessmentSession): void {
    this.currentSession = session;
  }

  // 清除当前会话
  clearCurrentSession(): void {
    this.currentSession = null;
  }

  // 保存会话到本地存储
  saveSessionToStorage(): void {
    if (this.currentSession) {
      localStorage.setItem('currentAssessmentSession', JSON.stringify(this.currentSession));
    }
  }

  // 从本地存储恢复会话
  loadSessionFromStorage(): AssessmentSession | null {
    try {
      const sessionData = localStorage.getItem('currentAssessmentSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        this.currentSession = session;
        return session;
      }
    } catch (error) {
      console.error('从本地存储恢复会话失败:', error);
    }
    return null;
  }

  // 清除本地存储的会话
  clearSessionFromStorage(): void {
    localStorage.removeItem('currentAssessmentSession');
  }
}

// 导出单例实例
export const assessmentService = AssessmentService.getInstance(); 