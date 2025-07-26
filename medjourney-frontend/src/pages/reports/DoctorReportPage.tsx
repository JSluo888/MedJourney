import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share,
  Calendar,
  Clock,
  User,
  Brain,
  Heart,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  BarChart3,
  PieChart,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { ROUTES } from '../../utils/constants';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface PatientReport {
  sessionId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  sessionDate: string;
  duration: string;
  overallScore: number;
  mentalHealthScore: number;
  cognitiveScore: number;
  physicalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  aiInsights: string[];
  keyFindings: string[];
  recommendations: string[];
  conversationSummary: string;
  emotionAnalysis: {
    dominant: string;
    distribution: { emotion: string; percentage: number }[];
  };
  cognitiveMetrics: {
    memoryScore: number;
    attentionScore: number;
    languageScore: number;
    executiveFunctionScore: number;
  };
  symptomsFrequency: {
    symptom: string;
    frequency: number;
    severity: 'mild' | 'moderate' | 'severe';
  }[];
  historicalTrend: {
    date: string;
    score: number;
  }[];
}

const DoctorReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<PatientReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      loadPatientReport(sessionId);
    }
  }, [sessionId]);

  const loadPatientReport = async (id: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟详细报告数据
      const mockReport: PatientReport = {
        sessionId: id,
        patientId: 'patient-1',
        patientName: '李奶奶',
        patientAge: 78,
        sessionDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: '25分钟',
        overallScore: 65,
        mentalHealthScore: 68,
        cognitiveScore: 62,
        physicalScore: 67,
        riskLevel: 'medium',
        conversationSummary: '患者在本次对话中表现出中度的记忆障碍，特别是在短期记忆和时间定向方面。情绪状态相对稳定，但偶有焦虑表现。语言表达流畅，但存在词汇提取困难。与家人的关系和睦，社会支持良好。',
        aiInsights: [
          '患者的短期记忆能力较上次评估有所下降，建议加强认知训练',
          '情绪状态基本稳定，焦虑水平在可控范围内',
          '语言功能保持较好，但词汇提取速度有所减慢',
          '社会功能维持良好，与家人互动积极'
        ],
        keyFindings: [
          '时间定向能力下降，对当前日期和星期的认知模糊',
          '短期记忆明显受损，无法准确回忆3-5分钟前的信息',
          '注意力集中时间缩短，容易被外界干扰',
          '执行功能轻度受损，计划和组织能力有所下降'
        ],
        recommendations: [
          '建议每日进行30分钟的认知训练，重点训练记忆和注意力',
          '保持规律的生活作息，充足的睡眠有助于认知功能',
          '增加社交活动，多与家人朋友交流互动',
          '定期复查，建议3个月后进行下一次详细评估',
          '考虑调整药物治疗方案，咨询神经内科医生'
        ],
        emotionAnalysis: {
          dominant: '平静',
          distribution: [
            { emotion: '平静', percentage: 45 },
            { emotion: '焦虑', percentage: 25 },
            { emotion: '高兴', percentage: 20 },
            { emotion: '悲伤', percentage: 10 }
          ]
        },
        cognitiveMetrics: {
          memoryScore: 55,
          attentionScore: 62,
          languageScore: 75,
          executiveFunctionScore: 58
        },
        symptomsFrequency: [
          { symptom: '记忆力下降', frequency: 8, severity: 'moderate' },
          { symptom: '定向障碍', frequency: 6, severity: 'moderate' },
          { symptom: '注意力不集中', frequency: 7, severity: 'mild' },
          { symptom: '语言困难', frequency: 4, severity: 'mild' },
          { symptom: '情绪波动', frequency: 3, severity: 'mild' },
          { symptom: '睡眠问题', frequency: 5, severity: 'moderate' }
        ],
        historicalTrend: [
          { date: '2024-01-01', score: 75 },
          { date: '2024-02-01', score: 72 },
          { date: '2024-03-01', score: 70 },
          { date: '2024-04-01', score: 68 },
          { date: '2024-05-01', score: 66 },
          { date: '2024-06-01', score: 65 },
          { date: '2024-07-01', score: 65 }
        ]
      };
      
      setReport(mockReport);
      
    } catch (err: any) {
      setError('加载患者报告失败');
      console.error('加载患者报告失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      // 模拟下载报告
      const blob = new Blob(['模拟PDF报告内容'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.patientName}_医疗报告_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('下载报告失败');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">正在加载患者报告...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Link 
          to={ROUTES.DOCTOR}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          返回医生仪表板
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">报告不存在</p>
        <Link 
          to={ROUTES.DOCTOR}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          返回医生仪表板
        </Link>
      </div>
    );
  }

  const healthScoreLevel = getHealthScoreLevel(report.overallScore);

  // 图表配置
  const cognitiveChartData = {
    labels: ['记忆力', '注意力', '语言能力', '执行功能'],
    datasets: [
      {
        label: '认知评分',
        data: [
          report.cognitiveMetrics.memoryScore,
          report.cognitiveMetrics.attentionScore,
          report.cognitiveMetrics.languageScore,
          report.cognitiveMetrics.executiveFunctionScore
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
        borderWidth: 0
      }
    ]
  };

  const emotionChartData = {
    labels: report.emotionAnalysis.distribution.map(d => d.emotion),
    datasets: [
      {
        data: report.emotionAnalysis.distribution.map(d => d.percentage),
        backgroundColor: report.emotionAnalysis.distribution.map(d => getEmotionColor(d.emotion)),
        borderWidth: 0
      }
    ]
  };

  const trendChartData = {
    labels: report.historicalTrend.map(d => formatDate(d.date).split(' ')[0]),
    datasets: [
      {
        label: '健康评分趋势',
        data: report.historicalTrend.map(d => d.score),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const symptomsChartData = {
    labels: report.symptomsFrequency.map(s => s.symptom),
    datasets: [
      {
        label: '症状频次',
        data: report.symptomsFrequency.map(s => s.frequency),
        backgroundColor: '#6366F1',
        borderRadius: 4
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
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={ROUTES.DOCTOR}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.patientName} - 详细报告</h1>
            <p className="text-gray-600">会话时间：{formatDate(report.sessionDate)}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>下载报告</span>
          </button>
        </div>
      </div>

      {/* 患者基本信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">患者信息</p>
              <p className="font-medium">{report.patientName}, {report.patientAge}岁</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">会话时长</p>
              <p className="font-medium">{report.duration}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">整体健康评分</p>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{report.overallScore}</span>
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
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">风险等级</p>
              <p className="font-medium">
                {report.riskLevel === 'high' ? '高风险' : 
                 report.riskLevel === 'medium' ? '中风险' : '低风险'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 详细评分 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">认知能力</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">评分</span>
              <span className="font-medium text-2xl">{report.cognitiveScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${report.cognitiveScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">心理健康</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">评分</span>
              <span className="font-medium text-2xl">{report.mentalHealthScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${report.mentalHealthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">身体状况</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">评分</span>
              <span className="font-medium text-2xl">{report.physicalScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${report.physicalScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 图表分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 认知功能详细分析 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">认知功能分析</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={cognitiveChartData} options={chartOptions} />
          </div>
        </div>

        {/* 情绪分布 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">情绪状态分析</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut data={emotionChartData} options={chartOptions} />
          </div>
        </div>

        {/* 健康趋势 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">健康评分趋势</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        {/* 症状频次 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">症状频次统计</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={symptomsChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* 对话摘要 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">对话摘要</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-800 leading-relaxed">{report.conversationSummary}</p>
        </div>
      </div>

      {/* 主要发现和建议 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 主要发现 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">主要发现</h3>
          <div className="space-y-3">
            {report.keyFindings.map((finding, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{finding}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 治疗建议 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">治疗建议</h3>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI智能洞察 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI智能分析</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.aiInsights.map((insight, index) => (
            <div 
              key={index}
              className="p-4 bg-white border border-blue-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-blue-800 leading-relaxed">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 症状严重程度 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">症状严重程度评估</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.symptomsFrequency.map((symptom, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{symptom.symptom}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded border ${
                  getSeverityColor(symptom.severity)
                }`}>
                  {symptom.severity === 'severe' ? '严重' : 
                   symptom.severity === 'moderate' ? '中度' : '轻度'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">频次</span>
                  <span className="font-medium">{symptom.frequency}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(symptom.frequency / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorReportPage;