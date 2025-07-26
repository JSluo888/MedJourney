import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Brain,
  Heart,
  AlertCircle,
  Loader,
  MessageCircle,
  Volume2,
  Mic,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useMessages } from '../hooks/useApi';
import { Message, VoiceMessage } from '../types';
import VoiceRecorder from '../components/VoiceRecorder';
import { useTenFramework } from '../hooks/useTenFramework';

const ChatPageEnhanced: React.FC = () => {
  const { user } = useAppStore();
  const { data: messages, loading: messagesLoading, sendMessage } = useMessages(user?.id);
  
  const [textInput, setTextInput] = useState('');
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // TEN Framework集成
  const {
    isConnected: tenConnected,
    isRecording,
    status: tenStatus,
    messages: tenMessages,
    error: tenError,
    sendTextMessage: sendTenMessage,
    uploadImage: uploadTenImage
  } = useTenFramework({
    userId: user?.id || 'anonymous',
    autoConnect: true,
    onMessage: (message: VoiceMessage) => {
      setVoiceMessages(prev => [...prev, message]);
      // 同时添加到常规消息列表
      if (user) {
        sendMessage(user.id, message.content, message.type === 'user' ? 'text' : 'text');
      }
    },
    onStatusChange: (status: string) => {
      console.log('TEN状态变化:', status);
    },
    onError: (error: Error) => {
      console.error('TEN错误:', error);
    }
  });
  
  // 自动滚动到消息底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceMessages]);
  
  // 发送文本消息
  const handleSendText = async () => {
    if (!textInput.trim() || !user) return;
    
    try {
      // 发送到常规API
      await sendMessage(user.id, textInput.trim(), 'text');
      
      // 发送到TEN Framework
      if (tenConnected) {
        await sendTenMessage(textInput.trim());
      }
      
      setTextInput('');
    } catch (error) {
      console.error('发送消息失败:', error);
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
        
        // 添加到上传图片列表
        setUploadedImages(prev => [...prev, imageUrl]);
        
        // 发送到常规API
        await sendMessage(user.id, imageUrl, 'image');
        
        // 发送到TEN Framework
        if (tenConnected && file) {
          await uploadTenImage(file);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片上传失败:', error);
    }
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 合并所有消息
  const allMessages = [
    ...(messages || []).map(m => ({ ...m, source: 'api' })),
    ...voiceMessages.map(m => ({
      id: m.id,
      content: m.content,
      sender: m.type === 'user' ? 'user' : 'assistant',
      type: 'text' as const,
      timestamp: m.timestamp,
      source: 'ten'
    }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
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
              <p className="text-gray-600">多模态智能对话，支持语音、文字和图像</p>
            </div>
          </div>
          
          {/* TEN连接状态 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                tenConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                TEN: {tenConnected ? '已连接' : '未连接'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Mic className={`w-4 h-4 ${
                isRecording ? 'text-red-500' : 
                tenStatus === 'listening' ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {tenStatus === 'listening' ? '正在倾听' :
                 tenStatus === 'processing' ? '处理中' :
                 tenStatus === 'speaking' ? 'AI回复中' : '准备就绪'}
              </span>
            </div>
          </div>
        </div>
        
        {/* TEN错误提示 */}
        {tenError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{tenError.message}</span>
          </div>
        )}
      </div>
      
      {/* 语音录制器 */}
      {showVoiceRecorder && (
        <div className="border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">语音对话</h3>
              <button
                onClick={() => setShowVoiceRecorder(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            
            <VoiceRecorder
              userId={user?.id || 'anonymous'}
              onMessage={(message) => {
                setVoiceMessages(prev => [...prev, message]);
              }}
              onStatusChange={(status) => {
                console.log('语音状态:', status);
              }}
            />
          </div>
        </div>
      )}
      
      {!showVoiceRecorder && (
        <div className="px-6 py-2 border-b border-gray-200">
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm">显示语音对话</span>
          </button>
        </div>
      )}
      
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messagesLoading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">加载消息中...</p>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">您好，{user?.name}!</h2>
            <p className="text-gray-600 text-lg mb-6">我是您的 AI 陪伴助手，支持多种交互方式：</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Mic className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">语音对话</p>
                <p className="text-xs text-gray-500 mt-1">支持实时语音交互和打断</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">文字聊天</p>
                <p className="text-xs text-gray-500 mt-1">输入文字进行对话</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <ImageIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">图像识别</p>
                <p className="text-xs text-gray-500 mt-1">上传图片进行分析</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((message, index) => (
              <div
                key={`${message.source}-${message.id}-${index}`}
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
                        alt="上传的图片"
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
                    
                    {/* 标识消息来源 */}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.source === 'ten' 
                        ? message.sender === 'user' ? 'bg-blue-400 text-blue-100' : 'bg-green-100 text-green-600'
                        : 'opacity-50'
                    }`}>
                      {message.source === 'ten' ? '🎤' : '💬'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          {/* 文本输入 */}
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
              placeholder="输入消息，或使用上方的语音对话功能..."
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <button
              onClick={handleSendText}
              disabled={!textInput.trim()}
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
              className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 上传的图片预览 */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">最近上传的图片:</p>
            <div className="flex space-x-2 overflow-x-auto">
              {uploadedImages.slice(-3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`上传图片${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}
        
        {/* 功能提示 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            💡 使用语音对话获得更自然的交互体验，支持实时打断和多模态输入
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPageEnhanced;