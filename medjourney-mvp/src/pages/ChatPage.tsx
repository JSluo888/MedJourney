import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  Camera, 
  Play, 
  Square,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Brain,
  Heart,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useMessages } from '../hooks/useApi';
import { Message } from '../types';
import EnhancedAgoraService from '../services/EnhancedAgoraService';

const ChatPage: React.FC = () => {
  const { user } = useAppStore();
  const { data: messages, loading: messagesLoading, sendMessage } = useMessages(user?.id);
  
  const [textInput, setTextInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tenConnected, setTenConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [aiStatus, setAiStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agoraServiceRef = useRef<EnhancedAgoraService | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 初始化增强版服务
  useEffect(() => {
    const initializeServices = async () => {
      if (agoraServiceRef.current || !user) return;
      
      try {
        setIsConnecting(true);
        setError(null);
        
        const callbacks = {
          onConnectionStateChange: (connected: boolean) => {
            setIsConnected(connected);
            if (connected) {
              setTenConnected(agoraServiceRef.current?.getTENConnectionState() || false);
            } else {
              setTenConnected(false);
              setError('连接中断，请检查网络连接');
            }
          },
          onAudioLevel: (level: number) => {
            setAudioLevel(level);
          },
          onMessage: (message: Message) => {
            console.log('收到AI消息:', message);
            // 消息已通过useMessages hook自动处理
          },
          onStatusChange: (status: 'idle' | 'listening' | 'processing' | 'speaking') => {
            setAiStatus(status);
          },
          onError: (error: string) => {
            console.error('服务错误:', error);
            setError(error);
          }
        };
        
        agoraServiceRef.current = new EnhancedAgoraService(callbacks);
        await agoraServiceRef.current.initialize();
        
        console.log('增强版服务初始化成功');
      } catch (error) {
        console.error('初始化服务失败:', error);
        setError('初始化失败，请刷新页面重试');
      } finally {
        setIsConnecting(false);
      }
    };
    
    initializeServices();
    
    return () => {
      if (agoraServiceRef.current) {
        agoraServiceRef.current.disconnect();
      }
    };
  }, [user]);
  
  // 自动滚动到消息底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 监听TEN连接状态变化
  useEffect(() => {
    const checkTenConnection = () => {
      if (agoraServiceRef.current && isConnected) {
        const tenState = agoraServiceRef.current.getTENConnectionState();
        setTenConnected(tenState);
      }
    };
    
    const interval = setInterval(checkTenConnection, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);
  
  // 开始/停止录音
  const handleRecording = async () => {
    if (!agoraServiceRef.current) return;
    
    try {
      if (isRecording) {
        await agoraServiceRef.current.stopRecording();
        setIsRecording(false);
      } else {
        await agoraServiceRef.current.startRecording();
        setIsRecording(true);
        setTextInput(''); // 清空文本输入
      }
    } catch (error) {
      console.error('录音操作失败:', error);
      setError('录音操作失败');
    }
  };
  
  // 发送文本消息
  const handleSendText = async () => {
    if (!textInput.trim() || !user) return;
    
    try {
      // 使用hooks发送消息，这会自动处理用户消息和AI回复
      await sendMessage(user.id, textInput.trim(), 'text');
      
      // 同时通过Agora/TEN发送消息
      if (agoraServiceRef.current) {
        await agoraServiceRef.current.sendTextMessage(textInput.trim());
      }
      
      setTextInput('');
    } catch (error) {
      console.error('发送消息失败:', error);
      setError('消息发送失败');
    }
  };
  
  // 上传图片
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        // 使用hooks发送图像消息
        await sendMessage(user.id, imageUrl, 'image');
        
        // 同时通过Agora/TEN发送图像
        if (agoraServiceRef.current) {
          await agoraServiceRef.current.sendImageMessage(imageUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('发送图像失败:', error);
      setError('图像处理失败');
    }
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 打断AI语音
  const handleInterrupt = async () => {
    if (agoraServiceRef.current && aiStatus === 'speaking') {
      try {
        await agoraServiceRef.current.interruptAI();
      } catch (error) {
        console.error('打断失败:', error);
      }
    }
  };
  
  // 获取状态指示器
  const getStatusIndicator = () => {
    if (isConnecting) {
      return { text: '连接中...', color: 'text-yellow-600', icon: Loader };
    }
    if (!isConnected) {
      return { text: '连接断开', color: 'text-red-600', icon: WifiOff };
    }
    if (!tenConnected) {
      return { text: 'AI服务连接中...', color: 'text-orange-600', icon: Loader };
    }
    
    switch (aiStatus) {
      case 'listening':
        return { text: '正在倾听...', color: 'text-blue-600', icon: Mic };
      case 'processing':
        return { text: 'AI思考中...', color: 'text-purple-600', icon: Brain };
      case 'speaking':
        return { text: 'AI回复中...', color: 'text-green-600', icon: Volume2 };
      default:
        return { text: '准备就绪', color: 'text-green-600', icon: Wifi };
    }
  };
  
  const statusInfo = getStatusIndicator();
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 头部状态栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 陪伴助手</h1>
              <p className="text-gray-600">我在这里陪伴您，随时为您提供帮助</p>
            </div>
          </div>
          
          {/* 连接状态指示器 */}
          <div className="flex items-center space-x-6">
            {/* 主状态 */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isConnected && tenConnected ? 'bg-green-500' : 
                isConnecting ? 'bg-yellow-500' : 'bg-red-500'
              } ${isConnecting ? 'animate-pulse' : ''}`}></div>
              
              <div className="flex items-center space-x-2">
                <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${
                  statusInfo.icon === Loader ? 'animate-spin' : ''
                }`} />
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
            
            {/* 详细连接状态 */}
            {isConnected && (
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <Wifi className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-gray-500">Agora</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${tenConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-500">TEN</span>
                </div>
                
                {/* 音频级别 */}
                {audioLevel > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">音量:</span>
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${audioLevel}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messagesLoading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">加载消息中...</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">您好，{user?.name}!</h2>
            <p className="text-gray-600 text-lg mb-6">我是您的 AI 陪伴助手，您可以：</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Mic className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">点击麦克风开始语音对话</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Send className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">输入文字发送消息</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <ImageIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">上传图片分享</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl relative ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 shadow-md border border-gray-100'
                }`}>
                  {message.type === 'text' && (
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {message.type === 'image' && (
                    <div>
                      <img
                        src={message.content}
                        alt="用户上传的图片"
                        className="rounded-lg max-w-full h-auto mb-2"
                      />
                      {message.sender === 'user' && (
                        <p className="text-sm opacity-75">已上传图片</p>
                      )}
                    </div>
                  )}
                  
                  {message.type === 'audio' && (
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-5 h-5" />
                      <span>语音消息</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    
                    {message.type === 'audio' && (
                      <Volume2 className="w-3 h-3 opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* 音频波形显示 */}
      {isRecording && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm text-blue-700 mr-4">正在录音</span>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
            <button
              onClick={handleInterrupt}
              className="ml-4 text-xs text-blue-700 hover:text-blue-900 underline"
            >
              打断
            </button>
          </div>
        </div>
      )}
      
      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          {/* 录音按钮 */}
          <button
            onClick={handleRecording}
            disabled={!isConnected || !tenConnected}
            className={`relative p-4 rounded-full transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            {isRecording && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
            )}
          </button>
          
          {/* 文本输入 */}
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
              placeholder="输入消息或点击麦克风开始对话..."
              disabled={!isConnected || !tenConnected || aiStatus === 'processing'}
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            <button
              onClick={handleSendText}
              disabled={!textInput.trim() || !isConnected || !tenConnected || aiStatus === 'processing'}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* 图片上传 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || !tenConnected || aiStatus === 'processing'}
              className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 状态提示 */}
        <div className="mt-3 text-center">
          {aiStatus === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              点击打断AI语音
            </button>
          )}
          
          {(!isConnected || !tenConnected) && (
            <p className="text-sm text-gray-500">
              {!isConnected ? '等待连接...' : '等待AI服务...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;