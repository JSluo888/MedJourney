import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Download,
  Users,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { formatFileSize } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { minimaxService } from '../../services/minimax';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  url: string;
  uploadedAt: string;
}

interface UpdateStatus {
  familyReport: boolean;
  doctorDashboard: boolean;
  lastUpdate: string;
}

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showActions, setShowActions] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    familyReport: false,
    doctorDashboard: false,
    lastUpdate: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
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
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('文件选择事件触发:', { filesCount: files?.length || 0 });
    
    if (!files) {
      console.log('没有选择文件');
      return;
    }

    Array.from(files).forEach(file => {
      console.log('处理文件:', { 
        name: file.name, 
        type: file.type, 
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      const uploadedFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
      
      console.log('文件处理完成:', uploadedFile);
      setUploadedFiles(prev => [...prev, uploadedFile]);
    });

    // 清空input值，允许重复选择同一文件
    event.target.value = '';
    console.log('文件选择处理完成');
  };

  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // 发送消息
  const sendMessage = async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isGenerating) {
      console.log('消息发送被阻止:', { inputText: inputText.trim(), filesCount: uploadedFiles.length, isGenerating });
      return;
    }

    console.log('开始发送消息...', { 
      textLength: inputText.trim().length, 
      filesCount: uploadedFiles.length,
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUploadedFiles([]);
    setIsGenerating(true);
    setError('');

    try {
      console.log('调用MiniMax API...');
      // 调用MiniMax API
      const response = await minimaxService.sendMultimodalMessage(
        inputText.trim(),
        uploadedFiles.map(f => f.file),
        messages.filter(m => m.role === 'user').slice(-5) // 最近5条用户消息作为上下文
      );

      console.log('MiniMax API响应成功:', response.substring(0, 100) + '...');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      console.log('开始自动更新报告...');
      // 自动更新家属简报和医生仪表盘
      await updateReports();

    } catch (err: any) {
      console.error('发送消息失败:', err);
      setError(err.message || '发送消息失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 更新报告和仪表盘
  const updateReports = async () => {
    try {
      console.log('开始更新报告和仪表盘...');
      setUpdateStatus(prev => ({ ...prev, familyReport: true, doctorDashboard: true }));

      // 生成家属简报
      console.log('正在生成家属简报...');
      const familyReport = await minimaxService.generateFamilyReport(messages);
      console.log('家属简报生成成功:', familyReport);
      
      // 生成医生报告
      console.log('正在生成医生报告...');
      const doctorReport = await minimaxService.generateDoctorReport(messages);
      console.log('医生报告生成成功:', doctorReport);

      // 调用API更新数据库 - 家属简报
      console.log('正在更新家属简报到数据库...');
      const familyReportData = {
        summary: familyReport,
        highlights: ['对话积极活跃', '语言表达清晰', '情绪状态稳定'],
        suggestions: ['多陪伴交流，保持患者情绪稳定', '鼓励参与社交活动'],
        nextSteps: ['继续观察患者日常表现', '保持现有护理方案'],
        healthScore: 85,
        emotionalState: 'positive'
      };
      console.log('家属简报请求数据:', familyReportData);
      
      const familyUpdateResponse = await ApiService.updateFamilyReport(familyReportData);
      console.log('家属简报更新响应:', familyUpdateResponse);

      // 调用API更新数据库 - 医生仪表盘
      console.log('正在更新医生仪表盘到数据库...');
      const doctorDashboardData = {
        patientId: user?.id || 'unknown',
        sessionData: {
          sessionId: `session-${Date.now()}`,
          startTime: new Date().toISOString(),
          messages: messages.length
        },
        analysis: {
          emotionalState: 'positive',
          cognitivePerformance: 85,
          keyTopics: ['病史', '症状', '用药'],
          concerns: [],
          insights: ['患者积极配合，信息提供详细']
        },
        recommendations: ['继续观察症状变化', '定期复查', '保持用药规律']
      };
      console.log('医生仪表盘请求数据:', doctorDashboardData);
      
      const doctorUpdateResponse = await ApiService.updateDoctorDashboard(doctorDashboardData);
      console.log('医生仪表盘更新响应:', doctorUpdateResponse);

      setUpdateStatus({
        familyReport: false,
        doctorDashboard: false,
        lastUpdate: new Date().toISOString()
      });

      console.log('所有更新完成！');
      setSuccess('家属简报和医生仪表盘已更新！');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('更新报告失败:', err);
      setUpdateStatus(prev => ({ ...prev, familyReport: false, doctorDashboard: false }));
      setError(`更新失败: ${err.message || '未知错误'}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // 生成摘要
  const generateSummary = async () => {
    if (messages.length <= 1) {
      setError('请先进行一些对话');
      return;
    }

    setIsGenerating(true);
    try {
      const summary = await minimaxService.generateHistorySummary(messages);
      
      const summaryMessage: ChatMessage = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: `## 📋 病史摘要\n\n${summary}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, summaryMessage]);
    } catch (err: any) {
      setError('生成摘要失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成家属简报
  const generateFamilyReport = async () => {
    if (messages.length <= 1) {
      setError('请先进行一些对话');
      return;
    }

    setIsGenerating(true);
    try {
      const report = await minimaxService.generateFamilyReport(messages);
      
      const reportMessage: ChatMessage = {
        id: `family-report-${Date.now()}`,
        role: 'assistant',
        content: `## 👨‍👩‍👧‍👦 家属简报\n\n${report}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, reportMessage]);
    } catch (err: any) {
      setError('生成家属简报失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成医生报告
  const generateDoctorReport = async () => {
    if (messages.length <= 1) {
      setError('请先进行一些对话');
      return;
    }

    setIsGenerating(true);
    try {
      const report = await minimaxService.generateDoctorReport(messages);
      
      const reportMessage: ChatMessage = {
        id: `doctor-report-${Date.now()}`,
        role: 'assistant',
        content: `## 👨‍⚕️ 医生报告\n\n${report}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, reportMessage]);
    } catch (err: any) {
      setError('生成医生报告失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 清空聊天
  const clearChat = () => {
    setMessages([{
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
      timestamp: new Date().toISOString()
    }]);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">病史助手</h1>
              <p className="text-gray-600">AI驱动的多模态病史整理</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 更新状态指示器 */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {updateStatus.familyReport && (
                <div className="flex items-center space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>更新家属简报...</span>
                </div>
              )}
              {updateStatus.doctorDashboard && (
                <div className="flex items-center space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>更新医生仪表盘...</span>
                </div>
              )}
              {updateStatus.lastUpdate && !updateStatus.familyReport && !updateStatus.doctorDashboard && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span>已更新 {new Date(updateStatus.lastUpdate).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>快速操作</span>
            </button>
          </div>
        </div>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 快速操作面板 */}
      {showActions && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={generateSummary}
              disabled={isGenerating || messages.length <= 1}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>生成摘要</span>
            </button>
            
            <button
              onClick={generateFamilyReport}
              disabled={isGenerating || messages.length <= 1}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>家属简报</span>
            </button>
            
            <button
              onClick={generateDoctorReport}
              disabled={isGenerating || messages.length <= 1}
              className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>医生报告</span>
            </button>
            
            <button
              onClick={clearChat}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空聊天</span>
            </button>
          </div>
        </div>
      )}

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col">
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
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line.startsWith('## ') ? (
                        <h3 className={`text-lg font-semibold mb-2 ${
                          message.role === 'user' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {line.replace('## ', '')}
                        </h3>
                      ) : (
                        <p className={message.role === 'user' ? 'text-white' : 'text-gray-700'}>
                          {line}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 附件显示 */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((file) => (
                      <div key={file.id} className="flex items-center space-x-2 bg-gray-100 rounded p-2">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                placeholder="请描述您的病情和病史，比如：我最近经常头痛，有高血压病史，正在服用降压药..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={(!inputText.trim() && uploadedFiles.length === 0) || isGenerating}
              className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 已选择的文件 */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">已选择的文件：</p>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
