import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PDFService } from '../services/PDFService';
import {
  Share2,
  Download,
  Eye,
  Calendar,
  User,
  Heart,
  Brain,
  TrendingUp,
  MessageCircle,
  Clock,
  QrCode,
  Link as LinkIcon,
  Twitter,
  Facebook,
  MessageSquare
} from 'lucide-react';
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
  Cell
} from 'recharts';

const ShareReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // 模拟报告数据
  const mockReportData = {
    id: reportId,
    title: '王奶奶的健康评估报告',
    patientName: '王奶奶',
    generatedAt: new Date(),
    type: 'family',
    summary: {
      overallScore: 82,
      cognitiveScore: 78,
      emotionalScore: 88,
      socialScore: 85
    },
    trends: [
      { date: '7月24日', cognitive: 85, emotional: 90, social: 75 },
      { date: '7月25日', cognitive: 82, emotional: 88, social: 78 },
      { date: '7月26日', cognitive: 78, emotional: 85, social: 80 },
      { date: '7月27日', cognitive: 80, emotional: 92, social: 82 },
      { date: '7月28日', cognitive: 83, emotional: 89, social: 85 },
      { date: '7月29日', cognitive: 87, emotional: 95, social: 88 },
      { date: '7月30日', cognitive: 89, emotional: 93, social: 90 }
    ],
    emotionDistribution: [
      { name: '积极', value: 65, color: '#22c55e' },
      { name: '中性', value: 25, color: '#eab308' },
      { name: '消极', value: 10, color: '#ef4444' }
    ],
    insights: [
      '认知能力表现稳定，记忆力没有显著下降',
      '情绪状态保持积极，与家人交流良好',
      '建议继续保持规律作息和适度运动'
    ],
    activities: [
      { name: 'AI对话', count: 24, target: 30 },
      { name: '认知训练', count: 18, target: 20 },
      { name: '社交互动', count: 12, target: 15 }
    ]
  };

  useEffect(() => {
    // 模拟从服务器获取报告数据
    setTimeout(() => {
      setReport(mockReportData);
      setLoading(false);
      setShareUrl(window.location.href);
    }, 1000);
  }, [reportId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const generatePDF = async () => {
    try {
      if (!report) return;
      
      await PDFService.generateReportPDF(report, chartContainerRef.current || undefined);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('生成PDF失败，请重试');
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `查看 ${report?.patientName} 的健康评估报告`;
    const url = shareUrl;
    
    switch (platform) {
      case 'wechat':
        // 微信分享需要特殊处理，这里显示二维码
        alert('请扫描二维码分享到微信');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载报告...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">报告不存在或已过期</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 顶部区域 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{report.generatedAt.toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{report.patientName}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={generatePDF}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>下载 PDF</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{copied ? '已复制' : '复制链接'}</span>
              </button>
            </div>
          </div>
          
          {/* 分享按钮 */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">分享到：</span>
            <button
              onClick={() => shareToSocial('wechat')}
              className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>微信</span>
            </button>
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </button>
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">综合评分</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{report.summary.overallScore}</p>
            <p className="text-sm text-gray-500">整体表现良好</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Brain className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">认知能力</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{report.summary.cognitiveScore}</p>
            <p className="text-sm text-gray-500">记忆力稳定</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900">情绪状态</h3>
            </div>
            <p className="text-3xl font-bold text-pink-600">{report.summary.emotionalScore}</p>
            <p className="text-sm text-gray-500">情绪积极</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">社交能力</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{report.summary.socialScore}</p>
            <p className="text-sm text-gray-500">交流正常</p>
          </div>
        </div>

        {/* 趋势图表 */}
        <div ref={chartContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">近七天趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cognitive" stroke="#22c55e" strokeWidth={2} name="认知" />
                <Line type="monotone" dataKey="emotional" stroke="#ec4899" strokeWidth={2} name="情绪" />
                <Line type="monotone" dataKey="social" stroke="#8b5cf6" strokeWidth={2} name="社交" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">情绪分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={report.emotionDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {report.emotionDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 洞察和建议 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">关键洞察</h3>
            <div className="space-y-4">
              {report.insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-1 rounded-full mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">活动统计</h3>
            <div className="space-y-4">
              {report.activities.map((activity: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">{activity.name}</span>
                    <span className="text-sm text-gray-500">{activity.count}/{activity.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(activity.count / activity.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 底部信息 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>本报告由 MedJourney AI 智能系统生成 | 生成时间：{report.generatedAt.toLocaleString('zh-CN')}</p>
        </div>
      </div>
    </div>
  );
};

export default ShareReportPage;