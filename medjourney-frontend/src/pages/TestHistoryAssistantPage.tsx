import React, { useState } from 'react';
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
  Users,
  Stethoscope,
  RefreshCw,
  Play,
  Stop
} from 'lucide-react';
import { minimaxService } from '../services/minimax';
import { ApiService } from '../utils/api';

interface TestResult {
  id: string;
  testName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  timestamp: string;
}

const TestHistoryAssistantPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const addTestResult = (testName: string, status: TestResult['status'], result?: string, error?: string) => {
    const testResult: TestResult = {
      id: `test-${Date.now()}`,
      testName,
      status,
      result,
      error,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [...prev, testResult]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // 测试1: MiniMax API连接
      addTestResult('MiniMax API连接测试', 'running');
      try {
        const response = await minimaxService.sendMessage([
          { role: 'user', content: '你好，请简单回复一下' }
        ]);
        addTestResult('MiniMax API连接测试', 'success', `API响应正常: ${response.choices[0]?.message?.content?.substring(0, 50)}...`);
      } catch (error: any) {
        addTestResult('MiniMax API连接测试', 'error', undefined, error.message);
      }

      // 测试2: 多模态消息发送（仅文本）
      addTestResult('多模态消息测试（文本）', 'running');
      try {
        const response = await minimaxService.sendMultimodalMessage(
          '我最近经常头痛，特别是下午的时候，有高血压病史，正在服用硝苯地平，我父亲也有高血压',
          []
        );
        addTestResult('多模态消息测试（文本）', 'success', `多模态API响应正常: ${response.substring(0, 50)}...`);
      } catch (error: any) {
        addTestResult('多模态消息测试（文本）', 'error', undefined, error.message);
      }

      // 测试3: 多模态消息发送（带文件）
      if (selectedFile) {
        addTestResult('多模态消息测试（文件）', 'running');
        try {
          const response = await minimaxService.sendMultimodalMessage(
            '请分析这个文件',
            [selectedFile]
          );
          addTestResult('多模态消息测试（文件）', 'success', `文件处理成功: ${response.substring(0, 50)}...`);
        } catch (error: any) {
          addTestResult('多模态消息测试（文件）', 'error', undefined, error.message);
        }
      }

      // 测试4: 家属简报生成
      addTestResult('家属简报生成测试', 'running');
      try {
        const mockMessages = [
          { id: '1', role: 'user' as const, content: '我最近经常头痛，特别是下午的时候，有高血压病史，正在服用硝苯地平', timestamp: new Date().toISOString() },
          { id: '2', role: 'assistant' as const, content: '我理解您的症状。头痛可能是高血压控制不佳的表现。', timestamp: new Date().toISOString() },
          { id: '3', role: 'user' as const, content: '我父亲也有高血压，我每天按时吃药，但血压还是有点高', timestamp: new Date().toISOString() }
        ];
        const report = await minimaxService.generateFamilyReport(mockMessages);
        addTestResult('家属简报生成测试', 'success', `简报生成成功: ${report.substring(0, 50)}...`);
      } catch (error: any) {
        addTestResult('家属简报生成测试', 'error', undefined, error.message);
      }

      // 测试5: 医生报告生成
      addTestResult('医生报告生成测试', 'running');
      try {
        const mockMessages = [
          { id: '1', role: 'user' as const, content: '我最近经常头痛，特别是下午的时候，有高血压病史，正在服用硝苯地平', timestamp: new Date().toISOString() },
          { id: '2', role: 'assistant' as const, content: '我理解您的症状。头痛可能是高血压控制不佳的表现。', timestamp: new Date().toISOString() },
          { id: '3', role: 'user' as const, content: '我父亲也有高血压，我每天按时吃药，但血压还是有点高', timestamp: new Date().toISOString() }
        ];
        const report = await minimaxService.generateDoctorReport(mockMessages);
        addTestResult('医生报告生成测试', 'success', `报告生成成功: ${report.substring(0, 50)}...`);
      } catch (error: any) {
        addTestResult('医生报告生成测试', 'error', undefined, error.message);
      }

      // 测试6: API更新家属简报
      addTestResult('API更新家属简报测试', 'running');
      try {
        const result = await ApiService.updateFamilyReport({
          summary: '患者今日表现良好，情绪稳定',
          highlights: ['对话积极活跃', '语言表达清晰'],
          suggestions: ['多陪伴交流', '保持规律作息'],
          nextSteps: ['继续观察', '定期复查'],
          healthScore: 85,
          emotionalState: 'positive'
        });
        addTestResult('API更新家属简报测试', 'success', `更新成功: ${result.data?.id || '模拟响应'}`);
      } catch (error: any) {
        addTestResult('API更新家属简报测试', 'error', undefined, error.message);
      }

      // 测试7: API更新医生仪表盘
      addTestResult('API更新医生仪表盘测试', 'running');
      try {
        const result = await ApiService.updateDoctorDashboard({
          patientId: 'test-patient',
          sessionData: {
            sessionId: 'test-session',
            startTime: new Date().toISOString(),
            messages: 5
          },
          analysis: {
            emotionalState: 'positive',
            cognitivePerformance: 85,
            keyTopics: ['病史', '症状'],
            concerns: [],
            insights: ['患者积极配合']
          },
          recommendations: ['继续观察', '定期复查']
        });
        addTestResult('API更新医生仪表盘测试', 'success', `更新成功: ${result.data?.id || '模拟响应'}`);
      } catch (error: any) {
        addTestResult('API更新医生仪表盘测试', 'error', undefined, error.message);
      }

      // 测试8: 获取实时家属简报
      addTestResult('获取实时家属简报测试', 'running');
      try {
        const result = await ApiService.getRealTimeFamilyReport();
        addTestResult('获取实时家属简报测试', 'success', `获取成功: ${result.data?.lastUpdated || '模拟数据'}`);
      } catch (error: any) {
        addTestResult('获取实时家属简报测试', 'error', undefined, error.message);
      }

      // 测试9: 获取实时医生仪表盘
      addTestResult('获取实时医生仪表盘测试', 'running');
      try {
        const result = await ApiService.getRealTimeDoctorDashboard();
        addTestResult('获取实时医生仪表盘测试', 'success', `获取成功: ${result.data?.lastUpdated || '模拟数据'}`);
      } catch (error: any) {
        addTestResult('获取实时医生仪表盘测试', 'error', undefined, error.message);
      }

      // 测试10: 完整流程测试
      addTestResult('完整流程测试', 'running');
      try {
        // 模拟完整的病史助手流程
        const mockMessages = [
          { id: '1', role: 'user' as const, content: '我最近经常头痛，特别是下午的时候，有高血压病史，正在服用硝苯地平', timestamp: new Date().toISOString() },
          { id: '2', role: 'assistant' as const, content: '我理解您的症状。头痛可能是高血压控制不佳的表现。', timestamp: new Date().toISOString() },
          { id: '3', role: 'user' as const, content: '我父亲也有高血压，我每天按时吃药，但血压还是有点高', timestamp: new Date().toISOString() }
        ];
        
        // 生成报告
        const familyReport = await minimaxService.generateFamilyReport(mockMessages);
        const doctorReport = await minimaxService.generateDoctorReport(mockMessages);
        
        // 更新数据库
        await ApiService.updateFamilyReport({
          summary: familyReport,
          highlights: ['对话积极活跃', '语言表达清晰'],
          suggestions: ['多陪伴交流', '保持规律作息'],
          nextSteps: ['继续观察', '定期复查'],
          healthScore: 85,
          emotionalState: 'positive'
        });
        
        await ApiService.updateDoctorDashboard({
          patientId: 'test-patient',
          sessionData: {
            sessionId: 'test-session',
            startTime: new Date().toISOString(),
            messages: mockMessages.length
          },
          analysis: {
            emotionalState: 'positive',
            cognitivePerformance: 85,
            keyTopics: ['病史', '症状'],
            concerns: [],
            insights: ['患者积极配合']
          },
          recommendations: ['继续观察', '定期复查']
        });
        
        addTestResult('完整流程测试', 'success', '完整流程测试通过：报告生成和数据库更新都成功');
      } catch (error: any) {
        addTestResult('完整流程测试', 'error', undefined, error.message);
      }

    } catch (error: any) {
      addTestResult('测试执行', 'error', undefined, error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (testName: string) => {
    addTestResult(testName, 'running');
    
    try {
      switch (testName) {
        case 'MiniMax API连接测试':
          const response = await minimaxService.sendMessage([
            { role: 'user', content: '你好，请简单回复一下' }
          ]);
          addTestResult(testName, 'success', `API响应正常: ${response.choices[0]?.message?.content?.substring(0, 50)}...`);
          break;
          
        case '多模态消息测试':
          const multimodalResponse = await minimaxService.sendMultimodalMessage(
            '请分析这张图片',
            selectedFile ? [selectedFile] : []
          );
          addTestResult(testName, 'success', `多模态API响应正常: ${multimodalResponse.substring(0, 50)}...`);
          break;
          
        default:
          addTestResult(testName, 'error', undefined, '未知测试类型');
      }
    } catch (error: any) {
      addTestResult(testName, 'error', undefined, error.message);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面头部 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">病史助手功能测试</h1>
            <p className="text-gray-600">测试MiniMax API集成和实时更新功能</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? '测试中...' : '运行所有测试'}</span>
            </button>
            
            <button
              onClick={clearResults}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空结果</span>
            </button>
          </div>
        </div>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">测试文件上传</h2>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>已选择: {selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 单个测试按钮 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">单个测试</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => runSingleTest('MiniMax API连接测试')}
            className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>API连接测试</span>
          </button>
          
          <button
            onClick={() => runSingleTest('多模态消息测试')}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>多模态测试</span>
          </button>
        </div>
      </div>

      {/* 测试结果 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">测试结果</h2>
        <div className="space-y-4">
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无测试结果</p>
              <p className="text-sm">点击"运行所有测试"开始测试</p>
            </div>
          ) : (
            testResults.map((result) => (
              <div
                key={result.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${getStatusColor(result.status)}`}>
                      {result.testName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.status === 'running' && (
                    <p className="text-sm text-blue-600 mt-1">测试进行中...</p>
                  )}
                  
                  {result.status === 'success' && result.result && (
                    <p className="text-sm text-green-700 mt-1">{result.result}</p>
                  )}
                  
                  {result.status === 'error' && result.error && (
                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 统计信息 */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">测试统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{testResults.length}</div>
              <div className="text-sm text-gray-600">总测试数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {testResults.filter(r => r.status === 'running').length}
              </div>
              <div className="text-sm text-gray-600">进行中</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistoryAssistantPage; 