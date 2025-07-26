// 认证相关Hook

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { ApiService } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider组件
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        
        if (token && userInfo) {
          const userData = JSON.parse(userInfo);
          
          // 验证token是否仍然有效（可选）
          try {
            await ApiService.healthCheck();
            setUser(userData);
          } catch (error) {
            // token已过期，清除本地存储
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_INFO);
          }
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 登录函数
  const login = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await ApiService.login(credentials);
      
      const { token, user: userData } = response.data;
      
      // 存储token和用户信息
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // 调用后端登出接口（可选）
      try {
        await ApiService.logout();
      } catch (error) {
        console.warn('后端登出失败:', error);
      }
      
      // 清除本地存储
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.PATIENT_INFO);
      localStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
      
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 模拟登录函数（仅开发环境使用）
export function useMockAuth() {
  const mockLogin = (role: 'patient' | 'family' | 'doctor' = 'patient') => {
    const mockUser: User = {
      id: `mock-${role}-${Date.now()}`,
      name: role === 'patient' ? '张大爹' : role === 'family' ? '张小明' : '李医生',
      role,
      email: `${role}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock-token');
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(mockUser));
    
    return mockUser;
  };

  return { mockLogin };
}
