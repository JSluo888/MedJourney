import React from 'react';
import { 
  TrendingUp, 
  Brain, 
  Heart, 
  Users, 
  Download, 
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const FamilySummaryPage: React.FC = () => {
  const { user, healthScore } = useAppStore();
  
  // 模拟数据 - 在实际应用中会从后端获取
  const weeklyData = [
    { day: '周一', cognitive: 85, emotional: 90, social: 75 },
    { day: '周二', cognitive: 82, emotional: 88, social: 78 },
    { day: '周三', cognitive: 78, emotional: 85, social: 80 },
    { day: '周四', cognitive: 80, emotional: 92, social: 82 },
    { day: '周五', cognitive: 83, emotional: 89, social: 85 },
    { day: '周六', cognitive: 87, emotional: 95, social: 88 },
    { day: '周日', cognitive: 89, emotional: 93, social: 90 }
  ];
  
  const emotionData = [
    { name: '积极', value: 65, color: '#22c55e' },
    { name: '中性', value: 25, color: '#eab308' },
    { name: '消极', value: 10, color: '#ef4444' }
  ];
  
  const activityData = [
    { activity: 'AI对话', count: 24, target: 30 },
    { activity: '认知训练', count: 18, target: 20 },
    { activity: '社交互动', count: 12, target: 15 },
    { activity: '音乐疗法', count: 8, target: 10 }
  ];
  
  const insights = [
    {
      type: 'positive',
      icon: CheckCircle,
      title: '认知能力稳定',
      description: '近一周认知评分保持在 80-89 分范围，表现稳定。',
      color: 'text-green-600 bg-green-100'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: '社交活动需加强',
      description: '社交互动频率低于目标，建议增加家庭活动时间。',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      type: 'positive',
      icon: Heart,
      title: '情绪状态良好',
      description: '情绪评分进步明显，周末达到 95 分的高水平。',
      color: 'text-blue-600 bg-blue-100'
    }
  ];
  
  const generateReport = () => {
    // 生成PDF报告的逻辑
    alert('报告正在生成，请稍后...');
  };
  
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">家属简报</h1>
          <p className="text-gray-600 mt-2">{user?.name} 的健康状态报告 - 近七天数据</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <button
            onClick={generateReport}
            className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>下载报告</span>
          </button>
        </div>
      </div>
      
      {/* 健康评分概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{healthScore?.overall || 85}</p>
              <p className="text-sm text-gray-500">/100</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">综合健康评分</h3>
          <p className="text-gray-600 text-sm mt-1">本周平均分数，较上周上升 3 分</p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.overall || 85}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{healthScore?.cognitive || 84}</p>
              <p className="text-sm text-gray-500">/100</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">认知能力</h3>
          <p className="text-gray-600 text-sm mt-1">记忆、注意力和理解能力评估</p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.cognitive || 84}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{healthScore?.emotional || 91}</p>
              <p className="text-sm text-gray-500">/100</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">情绪状态</h3>
          <p className="text-gray-600 text-sm mt-1">心理健康和情绪稳定性评估</p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore?.emotional || 91}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 趋势分析和情绪分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 健康趋势图 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">健康趋势分析</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cognitive" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="认知能力"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="emotional" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="情绪状态"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="social" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="社交能力"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 情绪分布饼状图 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">情绪状态分布</h2>
          <div className="h-80 flex items-center">
            <div className="w-2/3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '比例']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/3 space-y-4">
              {emotionData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 活动统计 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">每周活动统计</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="activity" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" name="实际次数" />
              <Bar dataKey="target" fill="#e5e7eb" name="目标次数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 智能洞察 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">智能洞察与建议</h2>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${insight.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-gray-600">{insight.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FamilySummaryPage;