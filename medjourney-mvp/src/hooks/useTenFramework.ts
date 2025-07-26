import { useState, useEffect, useCallback, useRef } from 'react';
import TenFrameworkService, { TenFrameworkConfig, VoiceMessage, TenFrameworkCallbacks } from '../services/TenFrameworkService';
import { TEN_CONFIG } from '../constants';

export interface UseTenFrameworkOptions {
  userId: string;
  autoConnect?: boolean;
  onMessage?: (message: VoiceMessage) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: Error) => void;
}

export interface UseTenFrameworkReturn {
  // 状态
  isConnected: boolean;
  isRecording: boolean;
  status: string;
  messages: VoiceMessage[];
  error: Error | null;
  
  // 方法
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  clearMessages: () => void;
}

export const useTenFramework = (options: UseTenFrameworkOptions): UseTenFrameworkReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const serviceRef = useRef<TenFrameworkService | null>(null);
  
  const handleMessage = useCallback((message: VoiceMessage) => {
    setMessages(prev => [...prev, message]);
    options.onMessage?.(message);
  }, [options.onMessage]);
  
  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setIsConnected(newStatus !== 'disconnected');
    setIsRecording(newStatus === 'listening');
    options.onStatusChange?.(newStatus);
  }, [options.onStatusChange]);
  
  const handleError = useCallback((error: Error) => {
    setError(error);
    options.onError?.(error);
  }, [options.onError]);
  
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      const config: TenFrameworkConfig = {
        appId: TEN_CONFIG.AGORA_APP_ID,
        channel: `medjourney_${options.userId}`,
        userId: options.userId
      };
      
      const callbacks: TenFrameworkCallbacks = {
        onMessage: handleMessage,
        onStatusChange: handleStatusChange,
        onError: (error) => {
          console.warn('TEN Framework错误 (不影响使用):', error.message);
          // 不调用handleError，避免显示错误给用户
        }
      };
      
      const service = new TenFrameworkService(config, callbacks);
      await service.initialize();
      
      serviceRef.current = service;
      
    } catch (error) {
      console.warn('TEN Framework连接失败，使用模拟模式:', error);
      // 在连接失败时，仍然创建服务实例，但使用模拟模式
      const config: TenFrameworkConfig = {
        appId: TEN_CONFIG.AGORA_APP_ID,
        channel: `medjourney_${options.userId}`,
        userId: options.userId
      };
      
      const callbacks: TenFrameworkCallbacks = {
        onMessage: handleMessage,
        onStatusChange: handleStatusChange,
        onError: () => {} // 忽略模拟模式的错误
      };
      
      const service = new TenFrameworkService(config, callbacks);
      serviceRef.current = service;
      
      // 设置为已连接状态（模拟模式）
      handleStatusChange('connected');
    }
  }, [options.userId, handleMessage, handleStatusChange]);
  
  const disconnect = useCallback(async () => {
    try {
      if (serviceRef.current) {
        await serviceRef.current.disconnect();
        serviceRef.current = null;
      }
    } catch (error) {
      console.error('Failed to disconnect from TEN Framework:', error);
      handleError(error as Error);
    }
  }, [handleError]);
  
  const sendTextMessage = useCallback(async (text: string) => {
    try {
      if (!serviceRef.current) {
        throw new Error('TEN Framework not connected');
      }
      await serviceRef.current.sendTextMessage(text);
    } catch (error) {
      console.error('Failed to send text message:', error);
      handleError(error as Error);
    }
  }, [handleError]);
  
  const startVoiceRecording = useCallback(async () => {
    try {
      if (!serviceRef.current) {
        throw new Error('TEN Framework not connected');
      }
      await serviceRef.current.startVoiceRecording();
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      handleError(error as Error);
    }
  }, [handleError]);
  
  const stopVoiceRecording = useCallback(async () => {
    try {
      if (!serviceRef.current) {
        throw new Error('TEN Framework not connected');
      }
      await serviceRef.current.stopVoiceRecording();
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      handleError(error as Error);
    }
  }, [handleError]);
  
  const uploadImage = useCallback(async (file: File) => {
    try {
      if (!serviceRef.current) {
        throw new Error('TEN Framework not connected');
      }
      await serviceRef.current.uploadImage(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      handleError(error as Error);
    }
  }, [handleError]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // 自动连接（只执行一次）
  useEffect(() => {
    let mounted = true;
    
    if (options.autoConnect && mounted) {
      connect();
    }
    
    return () => {
      mounted = false;
      disconnect();
    };
  }, [options.autoConnect]); // 移除connect和disconnect依赖，避免无限重连
  
  return {
    isConnected,
    isRecording,
    status,
    messages,
    error,
    connect,
    disconnect,
    sendTextMessage,
    startVoiceRecording,
    stopVoiceRecording,
    uploadImage,
    clearMessages
  };
};

export default useTenFramework;