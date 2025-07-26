// 简化的测试服务器 - 专门用于测试报告生成API
import express from 'express';
import cors from 'cors';
import { stepfunAIService } from './services/stepfun-ai';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据
const mockPatients = {
  'test-user-123': {
    id: 'test-user-123',
    name: '张三',
    age: 75,
    gender: 'male',
    medical_history: '轻度认知障碍'
  }
};

const mockSessions = {
  'test-session-123': {
    id: 'test-session-123',
    patient_id: 'test-user-123',
    startTime: new Date(Date.now() - 3600000), // 1小时前
    endTime: new Date(),
    messages: [
      { role: 'user', content: '你好，今天感觉怎么样？', timestamp: new Date(Date.now() - 3000000) },
      { role: 'assistant', content: '您好！我很好，谢谢关心。今天天气不错，您想聊什么？', timestamp: new Date(Date.now() - 2900000) },
      { role: 'user', content: '我想聊聊我的家人', timestamp: new Date(Date.now() - 2800000) },
      { role: 'assistant', content: '好的，家人是很重要的话题。您想分享什么关于家人的事情吗？', timestamp: new Date(Date.now() - 2700000) },
      { role: 'user', content: '我的孙子很可爱，他今年上小学了', timestamp: new Date(Date.now() - 2600000) },
      { role: 'assistant', content: '听起来很棒！孙子上小学了，这一定让您很骄傲。您经常和他一起做什么呢？', timestamp: new Date(Date.now() - 2500000) }
    ]
  }
};

// 健康检查
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'MedJourney API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 生成家属简报
app.post('/api/v1/reports/family-summary', async (req, res) => {
  try {
    const { userId, format = 'json', includeCharts = true } = req.body;
    
    console.log('生成家属简报请求:', { userId, format, includeCharts });
    
    const patient = mockPatients[userId];
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: '患者不存在'
      });
    }

    // 获取最近的会话数据
    const sessions = Object.values(mockSessions).filter(s => s.patient_id === userId);
    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: '没有找到会话数据'
      });
    }

    const recentSession = sessions[0];
    
    // 使用真实的Stepfun AI生成家属简报
    const familySummary = await stepfunAIService.generateFamilySummary(patient, {
      session: recentSession,
      messages: recentSession.messages,
      analysis: {
        emotional_state: 'positive',
        cognitive_performance: 85,
        key_topics: ['家人', '孙子', '教育'],
        concerns: [],
        insights: ['患者情绪积极，对家人话题表现出浓厚兴趣']
      }
    });

    const report = {
      id: `family-summary-${Date.now()}`,
      patient_id: userId,
      generated_at: new Date().toISOString(),
      summary: familySummary.summary,
      highlights: familySummary.highlights,
      suggestions: familySummary.suggestions,
      next_steps: familySummary.next_steps,
      health_score: 85,
      emotional_state: 'positive'
    };

    if (format === 'pdf') {
      // 模拟PDF生成
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="家属简报-${new Date().toLocaleDateString('zh-CN')}.pdf"`);
      res.send(Buffer.from('PDF content would be here'));
    } else {
      res.json({
        success: true,
        data: report
      });
    }
  } catch (error) {
    console.error('生成家属简报失败:', error);
    res.status(500).json({
      success: false,
      error: '生成家属简报失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 生成医生报告
app.post('/api/v1/reports/:sessionId/generate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json', includeCharts = true, includeRecommendations = true } = req.body;
    
    console.log('生成医生报告请求:', { sessionId, format, includeCharts, includeRecommendations });
    
    const session = mockSessions[sessionId];
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在'
      });
    }

    const patient = mockPatients[session.patient_id];
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: '患者不存在'
      });
    }

    // 使用真实的Stepfun AI生成医生报告
    const doctorReport = await stepfunAIService.generateDoctorReport(patient, {
      session,
      messages: session.messages,
      analysis: {
        emotional_state: 'positive',
        cognitive_performance: 85,
        key_topics: ['家人', '孙子', '教育'],
        concerns: [],
        insights: ['患者情绪积极，对家人话题表现出浓厚兴趣']
      }
    });

    const report = {
      id: `doctor-report-${Date.now()}`,
      session_id: sessionId,
      patient_id: session.patient_id,
      generated_at: new Date().toISOString(),
      summary: doctorReport.summary,
      key_insights: doctorReport.key_insights,
      recommendations: doctorReport.recommendations,
      risk_assessment: doctorReport.risk_assessment,
      cognitive_score: 85,
      emotional_state: 'positive'
    };

    if (format === 'pdf') {
      // 模拟PDF生成
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="医生报告-${sessionId}-${new Date().toLocaleDateString('zh-CN')}.pdf"`);
      res.send(Buffer.from('PDF content would be here'));
    } else {
      res.json({
        success: true,
        data: report
      });
    }
  } catch (error) {
    console.error('生成医生报告失败:', error);
    res.status(500).json({
      success: false,
      error: '生成医生报告失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取报告列表
app.get('/api/v1/reports/list/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('获取报告列表请求:', { patientId });
    
    const patient = mockPatients[patientId];
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: '患者不存在'
      });
    }

    // 模拟报告列表
    const reports = [
      {
        id: 'report-1',
        patient_id: patientId,
        type: 'family_summary',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1天前
        title: '家属简报 - 2024年1月15日'
      },
      {
        id: 'report-2',
        patient_id: patientId,
        type: 'doctor_report',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2天前
        title: '医生报告 - 2024年1月14日'
      }
    ];

    res.json({
      success: true,
      data: {
        reports,
        total: reports.length,
        page: 1,
        limit: 10
      }
    });
  } catch (error) {
    console.error('获取报告列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取报告列表失败'
    });
  }
});

// 下载报告
app.get('/api/v1/reports/:reportId/download', (req, res) => {
  try {
    const { reportId } = req.params;
    
    console.log('下载报告请求:', { reportId });
    
    // 模拟PDF下载
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="报告-${reportId}-${new Date().toLocaleDateString('zh-CN')}.pdf"`);
    res.send(Buffer.from('PDF content would be here'));
  } catch (error) {
    console.error('下载报告失败:', error);
    res.status(500).json({
      success: false,
      error: '下载报告失败'
    });
  }
});

// 删除报告
app.delete('/api/v1/reports/:reportId', (req, res) => {
  try {
    const { reportId } = req.params;
    
    console.log('删除报告请求:', { reportId });
    
    res.json({
      success: true,
      message: '报告删除成功'
    });
  } catch (error) {
    console.error('删除报告失败:', error);
    res.status(500).json({
      success: false,
      error: '删除报告失败'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 MedJourney 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`🔑 Stepfun API Key: ${stepfunAIService['apiKey'] ? '已配置' : '未配置'}`);
});

export default app; 