import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  FileText,
  Heart,
  TrendingUp,
  Clock,
  Users,
  Brain,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { ROUTES } from '../../utils/constants';
import { formatDate, getHealthScoreLevel } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalSessions: number;
  todaySessions: number;
  averageHealthScore: number;
  lastSessionDate: string;
}

interface RecentSession {
  id: string;
  date: string;
  duration: string;
  healthScore: number;
  keyTopics: string[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // 模拟数据（在实际应用中应该调用真实的API）
      const mockStats: DashboardStats = {
        totalSessions: 28,
        todaySessions: 2,
        averageHealthScore: 78,
        lastSessionDate: new Date().toISOString()
      };
      
      const mockSessions: RecentSession[] = [
        {
          id: 'session-1',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: '15分钟',
          healthScore: 82,
          keyTopics: ['日常生活', '情绪状态']
        },
        {
          id: 'session-2',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          duration: '22分钟',
          healthScore: 75,
          keyTopics: ['记忆训练', '家庭回忆']
        },
        {
          id: 'session-3',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: '18分钟',
          healthScore: 71,
          keyTopics: ['身体状态', '药物管理']
        }
      ];
      
      setStats(mockStats);
      setRecentSessions(mockSessions);
    } catch (err: any) {
      setError('加载仪表板数据失败');
      console.error('加载仪表板数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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

  const healthScoreLevel = getHealthScoreLevel(stats?.averageHealthScore || 0);

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              欢迎回来，{user?.name || '用户'}!
            </h1>
            <p className="text-blue-100">
              今天是 {formatDate(new Date(), 'relative')}，让我们开始一次新的对话吧
            </p>
          </div>
          <div className="hidden md:block">
            <Brain className="w-16 h-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总会话数</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日会话</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todaySessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均健康评分</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-gray-900">{stats?.averageHealthScore}</p>
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">最近活动</p>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(stats?.lastSessionDate || new Date(), 'relative')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 主要操作区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快速操作 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Link
                to={ROUTES.CHAT}
                className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-150 group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">开始AI对话</p>
                  <p className="text-sm text-gray-600">与AI助手进行新的对话</p>
                </div>
              </Link>

              <Link
                to={ROUTES.HISTORY}
                className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-150 group"
              >
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">导入病史</p>
                  <p className="text-sm text-gray-600">上传医疗文档和图片</p>
                </div>
              </Link>

              {user?.role === 'family' && (
                <Link
                  to={ROUTES.FAMILY_SUMMARY}
                  className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-150 group"
                >
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">查看家属简报</p>
                    <p className="text-sm text-gray-600">了解最新的健康状态</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 最近的会话 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">最近的会话</h3>
              <Link 
                to={ROUTES.CHAT}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentSessions.map((session) => {
                const scoreLevel = getHealthScoreLevel(session.healthScore);
                
                return (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(session.date)}
                        </span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-500">{session.duration}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">健康评分:</span>
                        <span className="font-medium" style={{ color: scoreLevel.color }}>
                          {session.healthScore}
                        </span>
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: scoreLevel.color + '20',
                            color: scoreLevel.color 
                          }}
                        >
                          {scoreLevel.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {session.keyTopics.map((topic, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      查看详情
                    </button>
                  </div>
                );
              })}
              
              {recentSessions.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">还没有会话记录</p>
                  <Link 
                    to={ROUTES.CHAT}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    开始第一次对话
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
