import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, SessionState, HealthScore, Message } from '../types';
import { STORAGE_KEYS } from '../constants';

interface AppState {
  // 用户状态
  user: User | null;
  setUser: (user: User | null) => void;
  
  // 会话状态
  sessionState: SessionState;
  setSessionState: (state: Partial<SessionState>) => void;
  
  // 健康评分
  healthScore: HealthScore | null;
  setHealthScore: (score: HealthScore) => void;
  
  // 消息历史
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  
  // UI状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      sessionState: {
        isConnected: false,
        isRecording: false,
        isProcessing: false,
        isPlaying: false,
      },
      healthScore: null,
      messages: [],
      isLoading: false,
      error: null,
      
      // 操作方法
      setUser: (user) => set({ user }),
      
      setSessionState: (newState) => set((state) => ({
        sessionState: { ...state.sessionState, ...newState }
      })),
      
      setHealthScore: (score) => set({ healthScore: score }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      clearMessages: () => set({ messages: [] }),
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE,
      partialize: (state) => ({
        user: state.user,
        healthScore: state.healthScore,
      }),
    }
  )
);