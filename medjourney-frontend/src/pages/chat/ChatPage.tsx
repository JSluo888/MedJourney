import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Image as ImageIcon,
  Camera,
  Volume2,
  VolumeX,
  Bot,
  User,
  Pause,
  Play,
  Square,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { AgoraService } from '../../services/agora';
import { WebSocketService } from '../../services/websocket';
import { formatDate, debounce } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Message {
  id: string;
  type: 'text' | 'audio' | 'image';
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  audioUrl?: string;
  imageUrl?: string;
  status?: 'sending' | 'sent' | 'error';
}

type ChatStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agoraService = useRef<AgoraService | null>(null);
  const websocketService = useRef<WebSocketService | null>(null);
  
  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 初始化服务
  useEffect(() => {
    initializeServices();
    
    return () => {
      cleanup();
    };
  }, []);
  
  const initializeServices = async () => {
    try {
      setIsLoading(true);
      
      // 创建新的对话会话
      const response = await ApiService.createConversationSession();
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      
      // 初始化Agora服务
      agoraService.current = new AgoraService();
      await agoraService.current.initialize();
      
      // 初始化WebSocket服务
      websocketService.current = new WebSocketService();
      websocketService.current.on('connected', () => {
        setIsConnected(true);
        setError('');
      });
      
      websocketService.current.on('disconnected', () => {
        setIsConnected(false);
      });
      
      websocketService.current.on('aiResponse', (data: any) => {
        handleAIResponse(data);
      });
      
      websocketService.current.on('statusChange', (status: ChatStatus) => {
        setChatStatus(status);
      });
      
      websocketService.current.on('error', (error: string) => {
        setError(error);
        setChatStatus('error');
      });
      
      await websocketService.current.connect();
      
      // 添加欢迎消息
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        type: 'text',
        content: '你好！我是您的AI健康助手。我可以通过语音或文字与您交流，帮助您了解健康状况、回答医疗问题，并提供情感支持。请问今天感觉怎么样？',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages([welcomeMessage]);
      
    } catch (err: any) {
      console.error('初始化服务失败:', err);
      setError('连接服务失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };
  
  const cleanup = () => {
    agoraService.current?.cleanup();
    websocketService.current?.disconnect();
  };
  
  // 处理AI响应
  const handleAIResponse = (data: any) => {
    const aiMessage: Message = {
      id: 'ai-' + Date.now(),
      type: data.type || 'text',
      content: data.text || data.content,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      audioUrl: data.audioUrl,
      status: 'sent'
    };
    
    setMessages(prev => {
      // 移除loading消息并添加AI响应
      const filtered = prev.filter(msg => msg.id !== 'ai-loading');
      return [...filtered, aiMessage];
    });
    
    setChatStatus('idle');
    
    // 如果有音频，自动播放
    if (data.audioUrl) {
      playAudio(data.audioUrl);
    }
  };
  
  // 发送文本消息
  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId) return;
    
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      type: 'text',
      content: currentMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // 添加AI思考中的消息
    const loadingMessage: Message = {
      id: 'ai-loading',
      type: 'text',
      content: '正在思考中...',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    setChatStatus('processing');
    
    try {
      // 发送消息到后端
      await ApiService.sendMessage(sessionId, {
        type: 'text',
        content: currentMessage,
        timestamp: new Date().toISOString()
      });
      
      // 通过WebSocket发送消息给AI
      websocketService.current?.sendMessage({
        type: 'text_message',
        sessionId,
        content: currentMessage
      });
      
    } catch (err: any) {
      console.error('发送消息失败:', err);
      setError('发送消息失败');
      // 移除loading消息并标记用户消息为错误
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === 'ai-loading') return null;
          if (msg.id === userMessage.id) return { ...msg, status: 'error' };
          return msg;
        }).filter(Boolean) as Message[];
      });
    }
  };
  
  // 开始录音
  const startRecording = async () => {
    try {
      setError('');
      setIsRecording(true);
      setChatStatus('listening');
      
      await agoraService.current?.startRecording();
      
      // 通知WebSocket开始语音会话
      websocketService.current?.sendMessage({
        type: 'start_voice_session',
        sessionId
      });
      
    } catch (err: any) {
      console.error('开始录音失败:', err);
      setError('无法访问麦克风，请检查权限设置');
      setIsRecording(false);
      setChatStatus('idle');
    }
  };
  
  // 停止录音
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setChatStatus('processing');
      
      const audioData = await agoraService.current?.stopRecording();
      
      if (audioData) {
        // 添加用户语音消息
        const userMessage: Message = {
          id: 'user-' + Date.now(),
          type: 'audio',
          content: '[语音消息]',
          sender: 'user',
          timestamp: new Date().toISOString(),
          audioUrl: audioData.url,
          status: 'sent'
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // 添加AI处理中消息
        const loadingMessage: Message = {
          id: 'ai-loading',
          type: 'text',
          content: '正在处理语音...',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          status: 'sending'
        };
        
        setMessages(prev => [...prev, loadingMessage]);
        
        // 发送语音数据到后端处理
        websocketService.current?.sendMessage({
          type: 'voice_message',
          sessionId,
          audioData: audioData.data
        });
      }
      
    } catch (err: any) {
      console.error('停止录音失败:', err);
      setError('录音处理失败');
      setChatStatus('idle');
    }
  };
  
  // 播放音频
  const playAudio = async (audioUrl: string) => {
    try {
      setIsSpeaking(true);
      setChatStatus('speaking');
      
      await agoraService.current?.playAudio(audioUrl);
      
    } catch (err: any) {
      console.error('播放音频失败:', err);
    } finally {
      setIsSpeaking(false);
      setChatStatus('idle');
    }
  };
  
  // 停止播放
  const stopSpeaking = () => {
    agoraService.current?.stopAudio();
    setIsSpeaking(false);
    setChatStatus('idle');
  };
  
  // 上传图片
  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('sessionId', sessionId);
      
      const response = await ApiService.uploadImage(formData);
      
      if (response.success && response.imageUrl) {
        const userMessage: Message = {
          id: 'user-' + Date.now(),
          type: 'image',
          content: '[图片]',
          sender: 'user',
          timestamp: new Date().toISOString(),
          imageUrl: response.imageUrl,
          status: 'sent'
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // 通知AI处理图片
        websocketService.current?.sendMessage({
          type: 'image_message',
          sessionId,
          imageUrl: response.imageUrl
        });
      }
      
    } catch (err: any) {
      console.error('图片上传失败:', err);
      setError('图片上传失败');
    }
  };
  
  // 防抖输入处理
  const debouncedInput = debounce((value: string) => {
    // 可以在这里实现输入提示功能
  }, 300);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentMessage(value);
    debouncedInput(value);
  };
  
  // 获取状态显示文本
  const getStatusText = () => {
    switch (chatStatus) {
      case 'listening': return '正在听您说话...';
      case 'processing': return 'AI正在思考中...';
      case 'speaking': return 'AI正在回复...';
      case 'error': return '连接出现问题';
      default: return isConnected ? '准备就绪' : '连接中...';
    }
  };
  
  // 获取状态颜色
  const getStatusColor = () => {
    switch (chatStatus) {
      case 'listening': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'speaking': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return isConnected ? 'text-green-600' : 'text-gray-500';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">正在初始化AI助手...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gray-50 rounded-lg overflow-hidden">
      {/* 头部状态栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI健康助手</h1>
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 连接状态指示器 */}
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            
            {/* 音频控制 */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="停止播放"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 shadow-sm border border-gray-200'
            }`}>
              {/* 消息内容 */}
              {message.type === 'text' && (
                <div className="space-y-2">
                  {message.status === 'sending' && message.sender === 'ai' ? (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              )}
              
              {message.type === 'audio' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => message.audioUrl && playAudio(message.audioUrl)}
                    className={`p-2 rounded-full ${
                      message.sender === 'user'
                        ? 'bg-blue-500 hover:bg-blue-400'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <span className="text-sm">{message.content}</span>
                </div>
              )}
              
              {message.type === 'image' && message.imageUrl && (
                <div className="space-y-2">
                  <img
                    src={message.imageUrl}
                    alt="上传的图片"
                    className="max-w-full h-auto rounded-lg"
                  />
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
              
              {/* 时间戳和状态 */}
              <div className={`flex items-center justify-between mt-2 text-xs ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span>{formatDate(message.timestamp, 'relative')}</span>
                {message.status === 'error' && (
                  <span className="text-red-500">发送失败</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* 语音按钮 */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={chatStatus === 'processing' || chatStatus === 'speaking'}
            className={`p-3 rounded-full transition-all duration-150 ${
              isRecording
                ? 'bg-red-600 text-white scale-110'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'
            }`}
            title={isRecording ? '松开结束录音' : '按住开始录音'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* 文本输入 */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入消息或按住语音按钮说话..."
              disabled={chatStatus === 'processing' || chatStatus === 'speaking'}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            
            {/* 图片上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              title="上传图片"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />
          </div>
          
          {/* 发送按钮 */}
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || chatStatus === 'processing' || chatStatus === 'speaking'}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-150"
            title="发送消息"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* 录音提示 */}
        {isRecording && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700">正在录音中，松开结束</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;