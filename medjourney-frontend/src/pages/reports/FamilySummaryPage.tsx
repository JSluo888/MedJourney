import React, { useState, useEffect } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Clock,
  Brain,
  Smile,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { formatDate, getHealthScoreLevel, getEmotionColor } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface HealthSummary {
  patientName: string;
  overallScore: number;
  mentalHealthScore: number;
  cognitiveScore: number;
  physicalScore: number;
  lastUpdated: string;
  weeklyTrend: 'up' | 'down' | 'stable';
  insights: string[];
}

interface EmotionData {
  emotion: string;
  percentage: number;
  color: string;
}

interface TrendData {
  date: string;
  healthScore: number;
  mentalHealth: number;
  cognitive: number;
}

const FamilySummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  useEffect(() => {
    loadFamilySummary();
  }, [selectedPeriod]);

  const loadFamilySummary = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 模拟API调用 - 在实际应用中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockSummary: HealthSummary = {
        patientName: '李奶奶',
        overallScore: 78,
        mentalHealthScore: 82,
        cognitiveScore: 75,
        physicalScore: 76,
        lastUpdated: new Date().toISOString(),
        weeklyTrend: 'up',
        insights: [
          '本周情绪状态较为稳定，积极情绪占主导',
          '认知能力测评显示记忆力有所改善',
          '建议继续保持规律的作息和适量运动',
          '与家人的互动对情绪健康很有帮助'
        ]
      };
      
      const mockEmotionData: EmotionData[] = [
        { emotion: '高兴', percentage: 45, color: '#10B981' },
        { emotion: '平静', percentage: 30, color: '#6366F1' },
        { emotion: '焦虑', percentage: 15, color: '#F59E0B' },
        { emotion: '悲伤', percentage: 10, color: '#EF4444' }
      ];
      
      const mockTrendData: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockTrendData.push({
          date: date.toISOString().split('T')[0],
          healthScore: 70 + Math.random() * 20,
          mentalHealth: 75 + Math.random() * 15,
          cognitive: 70 + Math.random() * 20
        });
      }
      
      setSummary(mockSummary);
      setEmotionData(mockEmotionData);
      setTrendData(mockTrendData);
      
    } catch (err: any) {
      setError('加载家属简报失败');
      console.error('加载家属简报失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      // 在实际应用中，这里应该调用API生成PDF报告
      const response = await ApiService.downloadFamilyReport(selectedPeriod);
      
      // 模拟下载
      const blob = new Blob(['模拟PDF内容'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `家属简报_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError('下载报告失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">正在加载健康简报...</p>
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
          onClick={loadFamilySummary}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          重试
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">暂无数据</p>
      </div>
    );
  }

  const healthScoreLevel = getHealthScoreLevel(summary.overallScore);

  // 图表配置
  const trendChartData = {
    labels: trendData.map(d => formatDate(d.date).split(' ')[0]),
    datasets: [
      {
        label: '整体健康评分',
        data: trendData.map(d => d.healthScore),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '心理健康',
        data: trendData.map(d => d.mentalHealth),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '认知能力',
        data: trendData.map(d => d.cognitive),
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const emotionChartData = {
    labels: emotionData.map(d => d.emotion),
    datasets: [
      {
        data: emotionData.map(d => d.percentage),
        backgroundColor: emotionData.map(d => d.color),
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{summary.patientName}的健康简报</h1>
            <p className="text-purple-100">
              最后更新：{formatDate(summary.lastUpdated)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* 时间段选择 */}
            <div className="flex space-x-2">
              {[{ key: 'week', label: '本周' }, { key: 'month', label: '本月' }, { key: 'quarter', label: '本季度' }].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as 'week' | 'month' | 'quarter')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period.key
                      ? 'bg-white text-purple-600'
                      : 'bg-purple-500 hover:bg-purple-400 text-white'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>下载报告</span>
            </button>
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 整体健康评分 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            {summary.weeklyTrend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : summary.weeklyTrend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Activity className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">整体健康评分</p>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-gray-900">{summary.overallScore}</p>
              <span 
                className="text-sm font-medium px-2 py-1 rounded"
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

        {/* 心理健康 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Smile className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">心理健康</p>
            <p className="text-3xl font-bold text-gray-900">{summary.mentalHealthScore}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${summary.mentalHealthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 认知能力 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">认知能力</p>
            <p className="text-3xl font-bold text-gray-900">{summary.cognitiveScore}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${summary.cognitiveScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 身体状况 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">身体状况</p>
            <p className="text-3xl font-bold text-gray-900">{summary.physicalScore}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${summary.physicalScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 健康趋势图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">健康趋势分析</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        {/* 情绪分布图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">情绪状态分布</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Pie data={emotionChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* AI洞察 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI智能洞察</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.insights.map((insight, index) => (
            <div 
              key={index}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 建议和提醒 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">护理建议</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">日常护理</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 保持规律的作息时间</li>
              <li>• 鼓励适量的体育锻炼</li>
              <li>• 维持社交活动和家庭互动</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">注意事项</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 如出现明显情绪波动请及时关注</li>
              <li>• 定期进行认知功能评估</li>
              <li>• 遵医嘱按时服药</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilySummaryPage;