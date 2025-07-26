// 简单的JavaScript测试服务器
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// Stepfun AI配置
const STEPFUN_API_KEY = '4kNO9CYMO1ddw4s20byLvrkYtBWXowdR1OcrY8Hi7tkapqi3gMAEAzNHCl3LKqFIy';
const STEPFUN_BASE_URL = 'https://api.stepfun.com/v1';
const STEPFUN_MODEL = 'step-1-8k';

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

// Stepfun AI调用函数
async function callStepfunAI(messages, options = {}) {
  try {
    const requestBody = {
      model: STEPFUN_MODEL,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1500,
      stream: false
    };

    console.log('发送Stepfun请求:', {
      model: requestBody.model,
      messageCount: messages.length,
      temperature: requestBody.temperature
    });

    const response = await fetch(`${STEPFUN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STEPFUN_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stepfun API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Stepfun响应成功:', {
      model: result.model,
      usage: result.usage,
      finishReason: result.choices[0]?.finish_reason
    });

    return result;
  } catch (error) {
    console.error('Stepfun AI调用失败:', error.message);
    throw error;
  }
}

// 生成家属简报
async function generateFamilySummary(patient, sessionData) {
  try {
    const prompt = `请基于以下患者数据和会话信息，生成一份面向家属的简明报告：

患者信息：
- 姓名：${patient.name}
- 年龄：${patient.age}岁
- 病史：${patient.medical_history || '无'}

会话数据：
${JSON.stringify(sessionData, null, 2)}

请生成一份家属友好的简报，包含：
1. 简单易懂的总结
2. 积极的表现亮点
3. 日常护理建议
4. 下一步行动计划

请以JSON格式返回，包含以下字段：
- summary: 简单总结
- highlights: 表现亮点数组
- suggestions: 护理建议数组
- next_steps: 下一步行动数组`;

    const response = await callStepfunAI([
      { role: 'system', content: '你是一个贴心的医疗助手，擅长用简单易懂的语言向家属解释患者状况。' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.5,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI响应为空');
    }

    try {
      const summary = JSON.parse(content);
      return {
        summary: summary.summary || '患者今日表现良好，情绪稳定。',
        highlights: summary.highlights || ['沟通顺畅', '情绪积极'],
        suggestions: summary.suggestions || ['多陪伴交流', '保持规律作息'],
        next_steps: summary.next_steps || ['继续观察', '定期复查']
      };
    } catch (parseError) {
      console.warn('家属简报JSON解析失败，使用默认值');
      return {
        summary: '患者今日表现良好，情绪稳定。',
        highlights: ['沟通顺畅', '情绪积极'],
        suggestions: ['多陪伴交流', '保持规律作息'],
        next_steps: ['继续观察', '定期复查']
      };
    }
  } catch (error) {
    console.error('生成家属简报失败:', error.message);
    throw error;
  }
}

// 生成医生报告
async function generateDoctorReport(patient, sessionData) {
  try {
    const prompt = `请基于以下患者数据和会话信息，生成一份专业的医生报告：

患者信息：
- 姓名：${patient.name}
- 年龄：${patient.age}岁
- 病史：${patient.medical_history || '无'}

会话数据：
${JSON.stringify(sessionData, null, 2)}

请生成包含以下内容的专业医生报告：
1. 临床分析总结
2. 关键发现和洞察
3. 治疗建议和干预措施
4. 风险评估

请以JSON格式返回，包含以下字段：
- summary: 临床分析总结
- key_insights: 关键发现数组
- recommendations: 治疗建议数组
- risk_assessment: 风险评估描述`;

    const response = await callStepfunAI([
      { role: 'system', content: '你是一个资深的医疗专家，擅长生成专业的医疗报告和临床分析。' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.4,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI响应为空');
    }

    try {
      const report = JSON.parse(content);
      return {
        summary: report.summary || '患者表现正常，建议继续观察。',
        key_insights: report.key_insights || ['认知功能正常', '情绪状态稳定'],
        recommendations: report.recommendations || ['继续规律用药', '保持良好作息'],
        risk_assessment: report.risk_assessment || '低风险'
      };
    } catch (parseError) {
      console.warn('医生报告JSON解析失败，使用默认值');
      return {
        summary: '患者表现正常，建议继续观察。',
        key_insights: ['认知功能正常', '情绪状态稳定'],
        recommendations: ['继续规律用药', '保持良好作息'],
        risk_assessment: '低风险'
      };
    }
  } catch (error) {
    console.error('生成医生报告失败:', error.message);
    throw error;
  }
}

// 健康检查
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'MedJourney API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    stepfun_configured: !!STEPFUN_API_KEY
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
    const familySummary = await generateFamilySummary(patient, {
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
      details: error.message
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
    const doctorReport = await generateDoctorReport(patient, {
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
      details: error.message
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
  console.log(`🔑 Stepfun API Key: ${STEPFUN_API_KEY ? '已配置' : '未配置'}`);
  console.log(`🤖 使用模型: ${STEPFUN_MODEL}`);
}); 