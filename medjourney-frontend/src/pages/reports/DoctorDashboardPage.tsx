import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Brain,
  Heart,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { ROUTES } from '../../utils/constants';
import { formatDate, getHealthScoreLevel } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface PatientSession {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  sessionDate: string;
  duration: string;
  healthScore: number;
  mentalHealthScore: number;
  cognitiveScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  keySymptoms: string[];
  lastSession?: string;
}

interface DashboardStats {
  totalPatients: number;
  todaySessions: number;
  highRiskPatients: number;
  averageHealthScore: number;
}

const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'risk'>('date');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟统计数据
      const mockStats: DashboardStats = {
        totalPatients: 156,
        todaySessions: 23,
        highRiskPatients: 12,
        averageHealthScore: 72
      };
      
      // 模拟患者会话数据
      const mockSessions: PatientSession[] = [
        {
          id: 'session-1',
          patientId: 'patient-1',
          patientName: '李奶奶',
          patientAge: 78,
          sessionDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: '25分钟',
          healthScore: 65,
          mentalHealthScore: 68,
          cognitiveScore: 62,
          riskLevel: 'medium',
          keySymptoms: ['记忆力下降', '定向障碍', '情绪波动'],
          lastSession: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'session-2',
          patientId: 'patient-2',
          patientName: '王爷爷',
          patientAge: 82,
          sessionDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          duration: '18分钟',
          healthScore: 45,
          mentalHealthScore: 42,
          cognitiveScore: 48,
          riskLevel: 'high',
          keySymptoms: ['严重记忆缺失', '语言理解困难', '焦虑情绪'],
          lastSession: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'session-3',
          patientId: 'patient-3',
          patientName: '张阿姨',
          patientAge: 73,
          sessionDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          duration: '32分钟',
          healthScore: 82,
          mentalHealthScore: 85,
          cognitiveScore: 79,
          riskLevel: 'low',
          keySymptoms: ['轻微健忘', '偶发情绪低落'],
          lastSession: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'session-4',
          patientId: 'patient-4',
          patientName: '陈老师',
          patientAge: 76,
          sessionDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          duration: '22分钟',
          healthScore: 71,
          mentalHealthScore: 73,
          cognitiveScore: 69,
          riskLevel: 'medium',
          keySymptoms: ['注意力分散', '语言表达困难'],
          lastSession: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setStats(mockStats);
      setSessions(mockSessions);
      
    } catch (err: any) {
      setError('加载仪表板数据失败');
      console.error('加载仪表板数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤和排序会话
  const filteredSessions = sessions
    .filter(session => {
      const matchesSearch = session.patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = filterRisk === 'all' || session.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
        case 'score':
          return a.healthScore - b.healthScore;
        case 'risk':
          const riskOrder = { high: 0, medium: 1, low: 2 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        default:
          return 0;
      }
    });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">正在加载医生仪表板...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">医生工作台</h1>
            <p className="text-indigo-100">
              欢迎回来，{user?.name || '医生'}！今天有 {stats?.todaySessions} 个患者会话需要查看
            </p>
          </div>
          <div className="hidden md:block">
            <Brain className="w-16 h-16 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总患者数</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日会话</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todaySessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">高风险患者</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.highRiskPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均健康分</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageHealthScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索患者姓名..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as 'all' | 'low' | 'medium' | 'high')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有风险等级</option>
              <option value="high">高风险</option>
              <option value="medium">中风险</option>
              <option value="low">低风险</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'risk')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">按时间排序</option>
              <option value="score">按健康评分</option>
              <option value="risk">按风险等级</option>
            </select>
          </div>
        </div>
      </div>

      {/* 患者会话列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">患者会话记录</h2>
          <p className="text-sm text-gray-600 mt-1">共 {filteredSessions.length} 条记录</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSessions.map((session) => {
            const healthScoreLevel = getHealthScoreLevel(session.healthScore);
            
            return (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.patientName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {session.patientAge}岁 · 患者ID: {session.patientId}
                        </p>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        getRiskColor(session.riskLevel)
                      }`}>
                        {getRiskLabel(session.riskLevel)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">会话时间</p>
                        <p className="font-medium">{formatDate(session.sessionDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">会话时长</p>
                        <p className="font-medium">{session.duration}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">健康评分</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{session.healthScore}</span>
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: healthScoreLevel.color + '20',
                              color: healthScoreLevel.color 
                            }}
                          >
                            {healthScoreLevel.label}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">认知评分</p>
                        <p className="font-medium">{session.cognitiveScore}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">主要症状</p>
                      <div className="flex flex-wrap gap-2">
                        {session.keySymptoms.map((symptom, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {session.lastSession && (
                      <div>
                        <p className="text-sm text-gray-600">
                          上次会话：{formatDate(session.lastSession, 'relative')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      to={`${ROUTES.DOCTOR_REPORT}/${session.id}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看详情</span>
                    </Link>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                      <Download className="w-4 h-4" />
                      <span>下载报告</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm || filterRisk !== 'all' ? '没有找到匹配的会话记录' : '暂无会话记录'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;