# MedJourney 对话存储服务

这是一个基于 FastAPI 的对话存储和报告生成服务，用于存储 TEN Agent 的对话内容并生成医疗报告。

## 功能特性

- 🔄 **对话存储**: 存储 TEN Agent 的实时对话内容
- 📊 **报告生成**: 自动生成医生报告和家属报告
- 🧠 **智能分析**: 基于对话内容进行情感和认知分析
- 💾 **数据持久化**: 使用 SQLite 数据库存储数据
- 🚀 **RESTful API**: 提供完整的 REST API 接口
- 📚 **自动文档**: 自动生成 API 文档

## 快速开始

### 本地开发

1. **安装依赖**
```bash
pip install -r requirements.txt
```

2. **启动服务**
```bash
python main.py
```

3. **访问服务**
- API 地址: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### Docker 部署

1. **构建镜像**
```bash
docker build -t medjourney-conversation-storage .
```

2. **启动容器**
```bash
docker-compose up -d
```

### 服务器部署

使用提供的部署脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

## API 接口

### 对话管理

#### 创建会话
```http
POST /api/v1/conversations/sessions
Content-Type: application/json

{
  "session_id": "session_123",
  "user_id": "user_456",
  "session_type": "medical_assessment",
  "status": "active"
}
```

#### 保存消息
```http
POST /api/v1/conversations/messages
Content-Type: application/json

{
  "session_id": "session_123",
  "user_id": "user_456",
  "role": "user",
  "content": "今天感觉怎么样？",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

#### 获取消息
```http
GET /api/v1/conversations/sessions/{session_id}/messages
```

### 报告生成

#### 生成报告
```http
POST /api/v1/reports/generate
Content-Type: application/json

{
  "session_id": "session_123",
  "report_type": "doctor",  // "doctor" 或 "family"
  "format": "json",         // "json", "html", "pdf"
  "include_analysis": true
}
```

#### 获取报告
```http
GET /api/v1/reports/{session_id}?report_type=doctor
```

## 数据模型

### 对话消息
```json
{
  "session_id": "string",
  "user_id": "string",
  "role": "user|assistant",
  "content": "string",
  "timestamp": "ISO 8601",
  "emotion_analysis": {},
  "metadata": {}
}
```

### 医生报告
```json
{
  "report_id": "string",
  "session_id": "string",
  "user_id": "string",
  "generated_at": "ISO 8601",
  "report_type": "doctor",
  "summary": {
    "overall_assessment": "string",
    "key_findings": ["string"],
    "health_score": 85.5,
    "emotional_state": "positive"
  },
  "detailed_analysis": {
    "conversation_quality": 90,
    "cognitive_assessment": {
      "memory_score": 85,
      "attention_score": 88,
      "language_score": 92,
      "communication_quality": 90
    },
    "emotional_analysis": {
      "dominant_emotion": "positive",
      "emotion_distribution": {},
      "stability_score": 85.0
    },
    "behavioral_patterns": ["string"]
  },
  "recommendations": {
    "immediate_actions": ["string"],
    "long_term_care": ["string"],
    "family_guidance": ["string"],
    "medical_referrals": ["string"]
  },
  "data_insights": {
    "conversation_stats": {},
    "trend_analysis": "string",
    "comparison_baseline": "string"
  }
}
```

### 家属报告
```json
{
  "report_id": "string",
  "session_id": "string",
  "user_id": "string",
  "generated_at": "ISO 8601",
  "report_type": "family",
  "summary": {
    "simple_summary": "string",
    "highlights": ["string"],
    "health_score": 85.5
  },
  "recent_activity": {
    "total_sessions": 1,
    "total_messages": 20,
    "last_session_date": "ISO 8601",
    "activity_level": "moderate"
  },
  "health_trends": {
    "overall_trend": "stable",
    "cognitive_trend": "slight_improvement",
    "emotional_trend": "stable"
  },
  "suggestions": ["string"],
  "next_steps": ["string"],
  "metadata": {}
}
```

## 数据库结构

### conversation_sessions
- session_id (TEXT PRIMARY KEY)
- user_id (TEXT NOT NULL)
- session_type (TEXT DEFAULT 'medical_assessment')
- status (TEXT DEFAULT 'active')
- created_at (TEXT NOT NULL)
- updated_at (TEXT NOT NULL)
- metadata (TEXT)

### conversation_messages
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- session_id (TEXT NOT NULL)
- role (TEXT NOT NULL CHECK (role IN ('user', 'assistant')))
- content (TEXT NOT NULL)
- timestamp (TEXT NOT NULL)
- emotion_analysis (TEXT)
- metadata (TEXT)

### generated_reports
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- session_id (TEXT NOT NULL)
- report_type (TEXT NOT NULL)
- content (TEXT NOT NULL)
- generated_at (TEXT NOT NULL)
- metadata (TEXT)

## 集成说明

### 与 TEN Agent 集成

1. **TEN Agent 前端调用**:
```javascript
// 保存对话消息
const saveMessage = async (sessionId, userId, role, content) => {
  const response = await fetch('http://36.50.226.131:8000/api/v1/conversations/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    })
  });
  return response.json();
};

// 生成报告
const generateReport = async (sessionId, reportType = 'doctor') => {
  const response = await fetch('http://36.50.226.131:8000/api/v1/reports/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      report_type: reportType,
      format: 'json',
      include_analysis: true
    })
  });
  return response.json();
};
```

2. **实时对话存储**:
   - 在 TEN Agent 的对话界面中，每当用户发送消息或 AI 回复时，调用保存消息 API
   - 对话结束后，调用生成报告 API 获取分析结果

## 服务器信息

- **IP地址**: 36.50.226.131
- **IPv6地址**: 2408:8653:dc00:20b:500::4
- **服务端口**: 8000
- **API地址**: http://36.50.226.131:8000
- **API文档**: http://36.50.226.131:8000/docs

## 开发说明

### 项目结构
```
conversation-storage-service/
├── main.py              # 主应用文件
├── requirements.txt     # Python依赖
├── Dockerfile          # Docker配置
├── docker-compose.yml  # Docker Compose配置
├── deploy.sh           # 部署脚本
├── README.md           # 项目说明
└── data/               # 数据目录（自动创建）
    └── conversations.db # SQLite数据库
```

### 扩展功能

1. **AI 分析增强**: 集成更复杂的 NLP 模型进行情感和认知分析
2. **报告格式**: 支持 PDF 和 HTML 格式的报告生成
3. **数据导出**: 支持数据导出和备份功能
4. **用户管理**: 添加用户认证和权限管理
5. **监控告警**: 添加服务监控和异常告警

## 故障排除

### 常见问题

1. **服务无法启动**
   - 检查端口 8000 是否被占用
   - 检查 Python 依赖是否正确安装

2. **数据库错误**
   - 检查 data 目录权限
   - 删除 conversations.db 文件重新初始化

3. **API 调用失败**
   - 检查服务器防火墙设置
   - 确认服务正在运行

### 日志查看

```bash
# Docker 日志
docker-compose logs -f

# 应用日志
tail -f logs/app.log
```

## 许可证

MIT License 