import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  History, 
  Users, 
  Stethoscope,
  TrendingUp,
  Heart,
  Brain,
  Calendar,
  Clock
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants';

const DashboardPage: React.FC = () => {
  const { user, healthScore } = useAppStore();
  
  // 模拟数据
  const recentActivities = [
    {
      id: 1,
      type: '对话会话',
      time: '10 分钟前',
      description: '与 AI 助手进行了 15 分钟的语音对话',
      icon: MessageCircle,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 2,
      type: '健康评估',
      time: '2 小时前',
      description: '完成了认知功能评估测试',
      icon: Brain,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 3,
      type: '病史更新',
      time: '今天早上',
      description: '上传了新的检查报告',
      icon: History,
      color: 'text-purple-600 bg-purple-100'
    }
  ];
  
  const quickActions = [
    {
      title: '开始 AI 对话',
      description: '与智能助手进行语音交流',
      href: ROUTES.CHAT,
      icon: MessageCircle,
      gradient: 'from-blue-500 to-purple-600',
      textColor: 'text-blue-600'
    },
    {
      title: '更新病史',
      description: '上传新的医疗记录',
      href: ROUTES.HISTORY,
      icon: History,
      gradient: 'from-green-500 to-teal-600',
      textColor: 'text-green-600'
    },
    {
      title: '查看简报',
      description: '查看家属健康简报',
      href: ROUTES.FAMILY_SUMMARY,
      icon: Users,
      gradient: 'from-orange-500 to-red-600',
      textColor: 'text-orange-600'
    },
    {
      title: '医生视图',
      description: '医疗专业数据分析',
      href: ROUTES.DOCTOR,
      icon: Stethoscope,
      gradient: 'from-pink-500 to-purple-600',
      textColor: 'text-pink-600'
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">主仪表板</h1>
          <p className="text-gray-600 mt-2">欢迎回来，{user?.name}! 这里是您的健康中心。</p>
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
      
      {/* 健康状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">综合健康评分</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {healthScore?.overall || 85}/100
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>进度</span>
              <span>{healthScore?.overall || 85}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.overall || 85}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">认知能力</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {healthScore?.cognitive || 78}/100
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>进度</span>
              <span>{healthScore?.cognitive || 78}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.cognitive || 78}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">情绪状态</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {healthScore?.emotional || 92}/100
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>进度</span>
              <span>{healthScore?.emotional || 92}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.emotional || 92}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 快速操作 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-lg font-semibold ${action.textColor} mb-2`}>
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* 最近活动 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">最近活动</h2>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className={`p-6 ${index !== recentActivities.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{activity.type}</h3>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;