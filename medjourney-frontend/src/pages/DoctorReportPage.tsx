import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Calendar,
  Clock,
  Brain,
  Heart,
  TrendingUp,
  AlertTriangle,
  User,
  Activity,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface SessionDetail {
  id: string;
  patientName: string;
  patientId: string;
  sessionDate: string;
  duration: number;
  healthScore: {
    overall: number;
    cognitive: number;
    emotional: number;
    social: number;
  };
  symptoms: {
    memory: number;
    attention: number;
    language: number;
    orientation: number;
    mood: number;
  };
  conversationMetrics: {
    totalMessages: number;
    avgResponseTime: number;
    emotionalTone: string;
    topicCoherence: number;
  };
  aiInsights: string[];
  recommendations: string[];
}

const DoctorReportPage: React.FC = () => {
  const { sid } = useParams<{ sid: string }>();
  
  // 模拟患者详细数据 - 在实际应用中会从后端获取
  const sessionDetail: SessionDetail = {
    id: sid || 'session_001',
    patientName: '王太太',
    patientId: 'P001',
    sessionDate: '2025-07-25',
    duration: 45,
    healthScore: {
      overall: 82,
      cognitive: 78,
      emotional: 88,
      social: 85
    },
    symptoms: {
      memory: 75,
      attention: 80,
      language: 85,
      orientation: 90,
      mood: 88
    },
    conversationMetrics: {
      totalMessages: 24,
      avgResponseTime: 3.2,
      emotionalTone: '积极',
      topicCoherence: 85
    },
    aiInsights: [
      '患者对近期事件的记忆显示出轻度困难，但对远期记忆保持较好',
      '在交流中表现出较强的社交意愿和情绪稳定性',
      '对新技术表现出一定的适应能力，能够跟随AI对话流程',
      '建议增加认知训练活动，特别是记忆力相关的练习'
    ],
    recommendations: [
      '每日进行 15-20 分钟的记忆力训练游戏',
      '增加与家人的交流频率，保持社交活跃度',
      '定期使用 AI 陪伴系统进行对话练习',
      '关注睡眠质量，保证充足的休息时间',
      '考虑增加辅助药物治疗，具体请咨询主治医生'
    ]
  };
  
  // 认知能力雷达图数据
  const radarData = [
    { subject: '记忆力', A: sessionDetail.symptoms.memory, fullMark: 100 },
    { subject: '注意力', A: sessionDetail.symptoms.attention, fullMark: 100 },
    { subject: '语言能力', A: sessionDetail.symptoms.language, fullMark: 100 },
    { subject: '定向力', A: sessionDetail.symptoms.orientation, fullMark: 100 },
    { subject: '情绪状态', A: sessionDetail.symptoms.mood, fullMark: 100 }
  ];
  
  // 时间趋势数据（模拟7天的数据）
  const trendData = [
    { day: 'Day 1', cognitive: 75, emotional: 82, overall: 78 },
    { day: 'Day 2', cognitive: 76, emotional: 85, overall: 80 },
    { day: 'Day 3', cognitive: 74, emotional: 83, overall: 78 },
    { day: 'Day 4', cognitive: 77, emotional: 86, overall: 81 },
    { day: 'Day 5', cognitive: 78, emotional: 87, overall: 82 },
    { day: 'Day 6', cognitive: 79, emotional: 89, overall: 83 },
    { day: 'Day 7', cognitive: 78, emotional: 88, overall: 82 }
  ];
  
  // 症状频次统计
  const symptomFrequency = [
    { symptom: '记忆困难', frequency: 8 },
    { symptom: '注意力不集中', frequency: 5 },
    { symptom: '焦虑情绪', frequency: 3 },
    { symptom: '睡眠问题', frequency: 4 },
    { symptom: '沟通障碍', frequency: 2 }
  ];
  
  const downloadReport = () => {
    console.log('下载详细报告...');
    alert('报告正在生成，请稍后...');
  };
  
  return (
    <div className="space-y-8">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/doctor"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回列表</span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">详细报告</h1>
            <p className="text-gray-600">{sessionDetail.patientName} - {sessionDetail.sessionDate}</p>
          </div>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>下载 PDF</span>
        </button>
      </div>
      
      {/* 患者基本信息 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">患者信息及会话概况</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <User className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">患者姓名</h3>
            <p className="text-gray-600">{sessionDetail.patientName}</p>
            <p className="text-sm text-gray-500">ID: {sessionDetail.patientId}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">会话日期</h3>
            <p className="text-gray-600">{sessionDetail.sessionDate}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">会话时长</h3>
            <p className="text-gray-600">{sessionDetail.duration} 分钟</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MessageSquare className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">对话次数</h3>
            <p className="text-gray-600">{sessionDetail.conversationMetrics.totalMessages} 次</p>
          </div>
        </div>
      </div>
      
      {/* 健康评分与认知能力 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 健康评分 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">健康评分细分</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="font-medium text-gray-900">综合评分</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">{sessionDetail.healthScore.overall}</span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-blue-500" />
                <span className="font-medium text-gray-900">认知能力</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{sessionDetail.healthScore.cognitive}</span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-red-500" />
                <span className="font-medium text-gray-900">情绪状态</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-600">{sessionDetail.healthScore.emotional}</span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-purple-500" />
                <span className="font-medium text-gray-900">社交能力</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-purple-600">{sessionDetail.healthScore.social}</span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 认知能力雷达图 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">认知能力分析</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="评分"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 趋势分析和症状统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 健康趋势 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">七日健康趋势</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
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
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="情绪状态"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="综合评分"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 症状频率 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">症状频率统计</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomFrequency} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="symptom" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="frequency" fill="#f59e0b" name="频率" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* AI 洞察和建议 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI 洞察 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI 洞察分析</h2>
          <div className="space-y-4">
            {sessionDetail.aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* 治疗建议 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">治疗建议</h2>
          <div className="space-y-4">
            {sessionDetail.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 对话指标 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">对话质量指标</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">对话次数</h3>
            <p className="text-2xl font-bold text-blue-600">{sessionDetail.conversationMetrics.totalMessages}</p>
            <p className="text-sm text-gray-600">在 {sessionDetail.duration} 分钟内</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">平均响应时间</h3>
            <p className="text-2xl font-bold text-green-600">{sessionDetail.conversationMetrics.avgResponseTime}</p>
            <p className="text-sm text-gray-600">秒</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">情绪色彩</h3>
            <p className="text-2xl font-bold text-purple-600">{sessionDetail.conversationMetrics.emotionalTone}</p>
            <p className="text-sm text-gray-600">主导情绪</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">话题连贯性</h3>
            <p className="text-2xl font-bold text-orange-600">{sessionDetail.conversationMetrics.topicCoherence}</p>
            <p className="text-sm text-gray-600">%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReportPage;