# MedJourney 数据存储架构

## 概述

本文档描述了 MedJourney 项目中病人回答问卷和输入病历信息的完整存储机制。

## 数据流程

### 1. 三阶段评估流程

```
用户登录 → 基础问卷 → 病例资料 → AI对话评估 → 生成报告
```

### 2. 数据存储架构

#### 前端数据收集
- **基础问卷** (`AssessmentBasicPage.tsx`)
  - 患者基本信息：姓名、年龄、性别
  - 症状列表：记忆力下降、迷路等
  - 持续时间、严重程度
  - 家族史、用药情况
  - 主要担忧

- **病例资料** (`AssessmentCasePage.tsx`)
  - 症状详细描述
  - 医疗图片上传（CT/MRI、日常照片、医疗文档）
  - 医疗记录文本
  - 附加说明

- **AI对话评估** (`AssessmentChatPage.tsx`)
  - 实时语音/文本对话
  - 认知能力测试
  - 情感状态分析

#### 后端数据存储

##### 数据库表结构

```sql
-- 患者基本信息
patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  medical_history TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

-- 对话会话
conversation_sessions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients (id)
)

-- 对话消息
conversation_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  emotion_analysis TEXT,
  timestamp TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
)

-- 评估数据
assessments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  assessment_data TEXT NOT NULL, -- JSON格式存储
  submitted_by TEXT,
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
)

-- 评估分析结果
assessment_analyses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  analysis_data TEXT NOT NULL, -- JSON格式存储
  analysis_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions (id)
)

-- 病历文件
medical_files (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  description TEXT,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients (id)
)

-- 健康报告
health_reports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendations TEXT,
  created_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions (id),
  FOREIGN KEY (patient_id) REFERENCES patients (id)
)
```

### 3. 数据存储流程

#### 3.1 基础问卷数据存储

```typescript
// 前端收集数据
const basicData: BasicAssessment = {
  patientName: "张老师",
  age: 72,
  gender: "female",
  symptoms: ["记忆力下降", "时常迷路"],
  duration: "6个月-1年",
  severity: "mild",
  familyHistory: false,
  medications: ["多奈哌齐"],
  concerns: "最近经常忘记事情"
};

// 提交到后端
await assessmentService.submitBasicAssessment(basicData);

// 后端存储到数据库
await localDatabaseService.createAssessment({
  session_id: sessionId,
  assessment_type: 'basic',
  assessment_data: basicData,
  submitted_by: userId
});
```

#### 3.2 病例资料数据存储

```typescript
// 前端收集数据
const caseData: CaseAssessment = {
  description: "患者最近经常忘记刚才做过的事情...",
  images: [
    {
      id: "img_001",
      url: "data:image/jpeg;base64,...",
      description: "CT扫描结果",
      type: "scan",
      uploadedAt: new Date()
    }
  ],
  medicalRecords: ["2023年诊断为轻度认知障碍"],
  additionalNotes: "患者情绪稳定，配合治疗"
};

// 处理图片上传
const uploadedFiles = await uploadImages(caseData.images);

// 提交到后端
await assessmentService.submitCaseAssessment({
  ...caseData,
  images: uploadedFiles
});

// 后端存储
await localDatabaseService.createAssessment({
  session_id: sessionId,
  assessment_type: 'case',
  assessment_data: caseDataWithFiles,
  submitted_by: userId
});

// 存储文件信息
for (const file of uploadedFiles) {
  await localDatabaseService.createMedicalFile({
    patient_id: patientId,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_url: file.url,
    description: file.description
  });
}
```

#### 3.3 AI对话数据存储

```typescript
// 实时对话消息
const message = {
  session_id: sessionId,
  role: 'user',
  content: '今天天气怎么样？',
  message_type: 'text',
  emotion_analysis: JSON.stringify({
    sentiment: 'neutral',
    confidence: 0.8
  }),
  metadata: JSON.stringify({
    timestamp: new Date(),
    source: 'voice'
  })
};

// 存储消息
await localDatabaseService.addConversationMessage(message);
```

### 4. 数据关联关系

```
患者 (patients)
├── 会话 (conversation_sessions)
│   ├── 评估数据 (assessments)
│   │   ├── 基础问卷 (assessment_type: 'basic')
│   │   ├── 病例资料 (assessment_type: 'case')
│   │   └── 对话评估 (assessment_type: 'chat')
│   ├── 评估分析 (assessment_analyses)
│   ├── 对话消息 (conversation_messages)
│   └── 健康报告 (health_reports)
└── 病历文件 (medical_files)
```

### 5. 数据安全与隐私

#### 5.1 数据加密
- 敏感医疗数据在传输时使用 HTTPS
- 数据库中的敏感字段可以考虑加密存储
- 文件上传使用安全的文件存储服务

#### 5.2 访问控制
- 基于角色的访问控制 (RBAC)
- 患者只能访问自己的数据
- 医生可以访问授权患者的数据
- 家属可以访问相关患者的数据

#### 5.3 数据备份
- 定期数据库备份
- 文件存储的多重备份
- 灾难恢复计划

### 6. 数据使用场景

#### 6.1 生成健康报告
```typescript
// 获取完整的评估数据
const assessments = await getAssessmentsBySession(sessionId);
const messages = await getConversationMessages(sessionId);
const analyses = await getAssessmentAnalysesBySession(sessionId);

// 生成综合报告
const report = await generateHealthReport({
  basicData: assessments.find(a => a.assessment_type === 'basic'),
  caseData: assessments.find(a => a.assessment_type === 'case'),
  chatData: assessments.find(a => a.assessment_type === 'chat'),
  messages,
  analyses
});
```

#### 6.2 历史数据分析
```typescript
// 获取患者历史评估
const history = await getAssessmentHistory(patientId, {
  page: 1,
  limit: 10,
  assessmentType: 'basic'
});

// 分析趋势
const trends = analyzeTrends(history);
```

#### 6.3 医生诊断支持
```typescript
// 获取患者完整档案
const patientProfile = await getPatientProfile(patientId);
const recentAssessments = await getRecentAssessments(patientId);
const medicalFiles = await getMedicalFilesByPatient(patientId);

// 生成诊断建议
const recommendations = await generateDiagnosticRecommendations(patientProfile);
```

### 7. 性能优化

#### 7.1 数据库优化
- 为常用查询字段创建索引
- 使用连接查询优化数据获取
- 考虑分页查询避免大量数据加载

#### 7.2 文件存储优化
- 图片压缩和格式优化
- 使用 CDN 加速文件访问
- 实现文件缓存策略

#### 7.3 缓存策略
- 使用 Redis 缓存热点数据
- 实现前端数据缓存
- 定期清理过期缓存

### 8. 监控与维护

#### 8.1 数据质量监控
- 数据完整性检查
- 异常数据检测
- 数据一致性验证

#### 8.2 性能监控
- 数据库查询性能
- API 响应时间
- 文件上传成功率

#### 8.3 安全监控
- 异常访问检测
- 数据泄露监控
- 权限变更审计

## 总结

MedJourney 的数据存储架构设计考虑了医疗数据的特殊性，实现了：

1. **完整性**：从问卷到对话的完整数据收集
2. **安全性**：多层次的安全保护措施
3. **可扩展性**：模块化的数据库设计
4. **可用性**：支持多种数据使用场景
5. **合规性**：符合医疗数据保护要求

这个架构为后续的功能扩展和数据分析提供了坚实的基础。 