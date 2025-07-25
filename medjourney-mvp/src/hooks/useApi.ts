// 自定义API Hooks - 提供类型安全的数据获取
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { User, Message, HealthScore, SessionRecord } from '../types';

// 通用API状态类型
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 通用API Hook
function useApiState<T>(initialData: T | null = null): [
  ApiState<T>,
  (data: T | null) => void,
  (loading: boolean) => void,
  (error: string | null) => void
] {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  return [state, setData, setLoading, setError];
}

// 用户相关Hooks
export function useUser(userId?: string) {
  const [state, setData, setLoading, setError] = useApiState<User>();

  const fetchUser = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const user = await api.users.get(id);
      setData(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取用户信息失败');
    }
  }, [setData, setLoading, setError]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await api.users.update(id, updates);
      setData(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  return {
    ...state,
    fetchUser,
    updateUser
  };
}

// 健康评分Hooks
export function useHealthScore(userId?: string) {
  const [state, setData, setLoading, setError] = useApiState<HealthScore>();

  const fetchHealthScore = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const score = await api.health.getScore(id);
      setData(score);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取健康评分失败');
    }
  }, [setData, setLoading, setError]);

  const updateHealthScore = useCallback(async (id: string, score: HealthScore) => {
    setLoading(true);
    try {
      const updatedScore = await api.health.updateScore(id, score);
      setData(updatedScore);
      return updatedScore;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新健康评分失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  const generateDailyReport = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const report = await api.health.generateDailyReport(id);
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成健康报告失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    if (userId) {
      fetchHealthScore(userId);
    }
  }, [userId, fetchHealthScore]);

  return {
    ...state,
    fetchHealthScore,
    updateHealthScore,
    generateDailyReport
  };
}

// 消息Hooks
export function useMessages(userId?: string) {
  const [state, setData, setLoading, setError] = useApiState<Message[]>([]);

  const fetchMessages = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const messages = await api.messages.get(id);
      setData(messages);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取消息失败');
    }
  }, [setData, setLoading, setError]);

  const addMessage = useCallback(async (id: string, message: Message) => {
    try {
      const newMessage = await api.messages.add(id, message);
      const currentMessages = state.data || [];
      setData([...currentMessages, newMessage]);
      return newMessage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setError]);

  const clearMessages = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.messages.clear(id);
      setData([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : '清空消息失败');
    }
  }, [setData, setLoading, setError]);

  const sendMessage = useCallback(async (id: string, content: string, type: 'text' | 'audio' | 'image' = 'text') => {
    try {
      // 先添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        type,
        sender: 'user',
        timestamp: new Date()
      };
      
      await addMessage(id, userMessage);
      
      // 获取AI回复
      const aiResponse = await api.ai.sendMessage(id, content, type);
      const currentMessages = state.data || [];
      setData([...currentMessages, aiResponse]);
      
      return aiResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [addMessage, setData, setError]);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId, fetchMessages]);

  return {
    ...state,
    fetchMessages,
    addMessage,
    clearMessages,
    sendMessage
  };
}

// 会话Hooks
export function useSessions(userId?: string) {
  const [state, setData, setLoading, setError] = useApiState<SessionRecord[]>([]);

  const fetchSessions = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const sessions = await api.sessions.get(id);
      setData(sessions);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取会话记录失败');
    }
  }, [setData, setLoading, setError]);

  const createSession = useCallback(async (id: string, record: Omit<SessionRecord, 'id'>) => {
    setLoading(true);
    try {
      const newSession = await api.sessions.create(id, record);
      const currentSessions = state.data || [];
      setData([...currentSessions, newSession]);
      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建会话记录失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  const endSession = useCallback(async (id: string, sessionId: string, messages: Message[]) => {
    setLoading(true);
    try {
      const sessionRecord = await api.sessions.end(id, sessionId, messages);
      const currentSessions = state.data || [];
      const updatedSessions = currentSessions.map(session => 
        session.id === sessionId ? sessionRecord : session
      );
      const finalSessions = updatedSessions.some(s => s.id === sessionId) ? updatedSessions : [...updatedSessions, sessionRecord];
      setData(finalSessions);
      return sessionRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '结束会话失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => {
    if (userId) {
      fetchSessions(userId);
    }
  }, [userId, fetchSessions]);

  return {
    ...state,
    fetchSessions,
    createSession,
    endSession
  };
}

// 病史Hooks
export function useMedicalHistory(userId?: string) {
  const [state, setData, setLoading, setError] = useApiState<string>('');

  const fetchMedicalHistory = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const history = await api.medical.getHistory(id);
      setData(history);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取病史失败');
    }
  }, [setData, setLoading, setError]);

  const saveMedicalHistory = useCallback(async (id: string, history: string, files?: File[]) => {
    setLoading(true);
    try {
      await api.medical.saveHistory(id, history, files);
      setData(history);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存病史失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => {
    if (userId) {
      fetchMedicalHistory(userId);
    }
  }, [userId, fetchMedicalHistory]);

  return {
    ...state,
    fetchMedicalHistory,
    saveMedicalHistory
  };
}

// 认知评估Hooks
export function useCognitiveAssessment() {
  const [state, setData, setLoading, setError] = useApiState<any>();

  const performAssessment = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const assessment = await api.ai.cognitiveAssessment(userId);
      setData(assessment);
      return assessment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '认知评估失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  return {
    ...state,
    performAssessment
  };
}

// 报告生成Hooks
export function useReports() {
  const [state, setData, setLoading, setError] = useApiState<Blob>();

  const generateFamilyReport = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const report = await api.reports.generateFamilyReport(userId);
      setData(report);
      
      // 自动下载
      const url = URL.createObjectURL(report);
      const a = document.createElement('a');
      a.href = url;
      a.download = `家属简报-${new Date().toLocaleDateString('zh-CN')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成家属简报失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  const generateDoctorReport = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const report = await api.reports.generateDoctorReport(sessionId);
      setData(report);
      
      // 自动下载
      const url = URL.createObjectURL(report);
      const a = document.createElement('a');
      a.href = url;
      a.download = `医生报告-${sessionId}-${new Date().toLocaleDateString('zh-CN')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成医生报告失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setData, setLoading, setError]);

  return {
    ...state,
    generateFamilyReport,
    generateDoctorReport
  };
}

export default {
  useUser,
  useHealthScore,
  useMessages,
  useSessions,
  useMedicalHistory,
  useCognitiveAssessment,
  useReports
};