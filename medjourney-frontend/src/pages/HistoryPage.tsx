import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Download,
  MessageCircle,
  Brain,
  Users,
  Stethoscope,
  Plus,
  Paperclip,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import minimaxService, { ChatMessage } from '../services/minimax';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

const HistoryPage: React.FC = () => {
  const { user, setIsLoading, isLoading } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的医疗AI助手，专门帮助您整理和分析病史信息。

我可以帮您：
• 📝 整理病史信息，包括症状、诊断、用药等
• 🖼️ 分析上传的医疗文档和图片
• 📊 生成结构化的病史摘要
• 👨‍👩‍👧‍👦 为家属简报提供专业建议
• 👨‍⚕️ 为医生仪表板生成详细报告

请告诉我您的病史信息，或者上传相关的医疗文档和图片。`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type === 'application/pdf' || file.type.includes('document');
      return isImage || isDocument;
    });
    
    validFiles.forEach(file => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document'
      };
      
      if (uploadedFile.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev, uploadedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
    });
  }, []);

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  // 删除文件
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // 发送消息
  const sendMessage = async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isGenerating) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      attachments: uploadedFiles.map(file => ({
        type: file.type,
        url: file.preview || '',
        name: file.file.name
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedFiles(uploadedFiles.map(f => f.file));
    setUploadedFiles([]);
    setIsGenerating(true);

    try {
      const response = await minimaxService.sendMultimodalMessage(
        inputText.trim(),
        selectedFiles,
        messages
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我暂时无法处理您的请求。请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setSelectedFiles([]);
    }
  };

  // 生成病史摘要
  const generateSummary = async () => {
    if (messages.length <= 1) {
      alert('请先进行一些对话后再生成摘要');
      return;
    }

    setIsLoading(true);
    try {
      const summary = await minimaxService.generateHistorySummary(messages);
      
      const summaryMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📋 病史摘要

**主要摘要：**
${summary.summary}

**关键要点：**
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

**专业建议：**
${summary.recommendations.map(rec => `• ${rec}`).join('\n')}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('生成摘要失败:', error);
      alert('生成摘要失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成家属简报
  const generateFamilyReport = async () => {
    if (messages.length <= 1) {
      alert('请先进行一些对话后再生成简报');
      return;
    }

    setIsLoading(true);
    try {
      const report = await minimaxService.generateFamilyReport(messages);
      
      const reportMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 👨‍👩‍👧‍👦 家属简报

${report}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, reportMessage]);
    } catch (error) {
      console.error('生成家属简报失败:', error);
      alert('生成家属简报失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成医生报告
  const generateDoctorReport = async () => {
    if (messages.length <= 1) {
      alert('请先进行一些对话后再生成报告');
      return;
    }

    setIsLoading(true);
    try {
      const report = await minimaxService.generateDoctorReport(messages);
      
      const reportMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 👨‍⚕️ 医生报告

${report}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, reportMessage]);
    } catch (error) {
      console.error('生成医生报告失败:', error);
      alert('生成医生报告失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话
  const clearChat = () => {
    if (confirm('确定要清空所有对话吗？')) {
      setMessages([]);
      setUploadedFiles([]);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">病史导入助手</h1>
              <p className="text-sm text-gray-600">AI驱动的多模态病史整理工具</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 快捷操作按钮 */}
        {showActions && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={generateSummary}
              disabled={isLoading || messages.length <= 1}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>生成摘要</span>
            </button>
            
            <button
              onClick={generateFamilyReport}
              disabled={isLoading || messages.length <= 1}
              className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>家属简报</span>
            </button>
            
            <button
              onClick={generateDoctorReport}
              disabled={isLoading || messages.length <= 1}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>医生报告</span>
            </button>
            
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>清空对话</span>
            </button>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* 消息内容 */}
              <div className="prose prose-sm max-w-none">
                {message.content.includes('##') ? (
                  <div dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* 附件 */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {attachment.type === 'image' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 时间戳 */}
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {/* 生成中状态 */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-gray-600">AI正在思考中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 文件上传区域 */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2"
              >
                {file.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                ) : (
                  <FileText className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm text-gray-700">{file.file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          {/* 文件上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="上传文件"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 文本输入框 */}
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="请输入您的病史信息，或描述上传的文档..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* 发送按钮 */}
          <button
            onClick={sendMessage}
            disabled={(!inputText.trim() && uploadedFiles.length === 0) || isGenerating}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-2 text-xs text-gray-500">
          支持文本输入和图片/文档上传，按 Enter 发送消息，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;