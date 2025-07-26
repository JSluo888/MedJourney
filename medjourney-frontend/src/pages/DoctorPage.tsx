import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Brain, 
  Heart,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

interface PatientSession {
  id: string;
  patientName: string;
  patientId: string;
  sessionDate: string;
  duration: number;
  healthScore: {
    overall: number;
    cognitive: number;
    emotional: number;
  };
  status: 'completed' | 'in-progress' | 'scheduled';
  riskLevel: 'low' | 'medium' | 'high';
  keyInsights: string[];
}

const DoctorPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'scheduled'>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  
  // 模拟患者会话数据
  const patientSessions: PatientSession[] = [
    {
      id: 'session_001',
      patientName: '王太太',
      patientId: 'P001',
      sessionDate: '2025-07-25',
      duration: 45,
      healthScore: {
        overall: 82,
        cognitive: 78,
        emotional: 88
      },
      status: 'completed',
      riskLevel: 'medium',
      keyInsights: ['记忆力下降', '情绪稳定', '社交意愿较强']
    },
    {
      id: 'session_002',
      patientName: '李爷爷',
      patientId: 'P002',
      sessionDate: '2025-07-25',
      duration: 38,
      healthScore: {
        overall: 91,
        cognitive: 89,
        emotional: 95
      },
      status: 'completed',
      riskLevel: 'low',
      keyInsights: ['认知能力保持稳定', '积极乐观', '家庭支持良好']
    },
    {
      id: 'session_003',
      patientName: '张奶奶',
      patientId: 'P003',
      sessionDate: '2025-07-24',
      duration: 52,
      healthScore: {
        overall: 65,
        cognitive: 58,
        emotional: 72
      },
      status: 'completed',
      riskLevel: 'high',
      keyInsights: ['语言能力下降明显', '焦虑情绪增加', '需要密切关注']
    },
    {
      id: 'session_004',
      patientName: '陈大爷',
      patientId: 'P004',
      sessionDate: '2025-07-24',
      duration: 0,
      healthScore: {
        overall: 0,
        cognitive: 0,
        emotional: 0
      },
      status: 'in-progress',
      riskLevel: 'medium',
      keyInsights: []
    },
    {
      id: 'session_005',
      patientName: '刘奶奶',
      patientId: 'P005',
      sessionDate: '2025-07-26',
      duration: 0,
      healthScore: {
        overall: 0,
        cognitive: 0,
        emotional: 0
      },
      status: 'scheduled',
      riskLevel: 'low',
      keyInsights: []
    }
  ];
  
  // 筛选逻辑
  const filteredSessions = patientSessions.filter(session => {
    const matchesSearch = session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || session.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });
  
  // 统计数据
  const stats = {
    total: patientSessions.length,
    completed: patientSessions.filter(s => s.status === 'completed').length,
    inProgress: patientSessions.filter(s => s.status === 'in-progress').length,
    scheduled: patientSessions.filter(s => s.status === 'scheduled').length,
    highRisk: patientSessions.filter(s => s.riskLevel === 'high').length
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in-progress': return '进行中';
      case 'scheduled': return '已预约';
      default: return '未知';
    }
  };
  
  return (
    <div className="space-y-8">
      {/* 页面标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">医生仪表板</h1>
          <p className="text-gray-600 mt-2">患者会话管理和健康状态监测</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <Calendar className="w-5 h-5" />
          <span>{new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">总会话</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">已完成</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">进行中</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              <p className="text-sm text-gray-500">已预约</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
              <p className="text-sm text-gray-500">高风险</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索患者姓名或ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 筛选器 */}
          <div className="flex space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有状态</option>
              <option value="completed">已完成</option>
              <option value="in-progress">进行中</option>
              <option value="scheduled">已预约</option>
            </select>
            
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有风险级别</option>
              <option value="high">高风险</option>
              <option value="medium">中风险</option>
              <option value="low">低风险</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 患者会话列表 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">患者会话列表</h2>
          <p className="text-gray-600 text-sm mt-1">共找到 {filteredSessions.length} 条记录</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSessions.map((session) => (
            <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {session.patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.patientName}</h3>
                    <p className="text-gray-600 text-sm">ID: {session.patientId}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  {/* 状态标签 */}
                  <div className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                    <p className="text-gray-500 text-xs mt-1">{session.sessionDate}</p>
                  </div>
                  
                  {/* 风险级别 */}
                  <div className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(session.riskLevel)}`}>
                      {getRiskText(session.riskLevel)}
                    </span>
                    {session.duration > 0 && (
                      <p className="text-gray-500 text-xs mt-1">{session.duration} 分钟</p>
                    )}
                  </div>
                  
                  {/* 健康评分 */}
                  {session.status === 'completed' && (
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Brain className="w-4 h-4 text-blue-500" />
                          <span className="text-lg font-bold text-blue-600">{session.healthScore.cognitive}</span>
                        </div>
                        <p className="text-gray-500 text-xs">认知</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-lg font-bold text-red-600">{session.healthScore.emotional}</span>
                        </div>
                        <p className="text-gray-500 text-xs">情绪</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-lg font-bold text-green-600">{session.healthScore.overall}</span>
                        </div>
                        <p className="text-gray-500 text-xs">综合</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <Link
                    to={`/doctor/report/${session.id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <span>查看详情</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              {/* 关键洞察 */}
              {session.keyInsights.length > 0 && (
                <div className="mt-4 pl-16">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">关键洞察：</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.keyInsights.map((insight, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {insight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;