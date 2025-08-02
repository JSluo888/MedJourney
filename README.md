# MedJourney - AI驱动的阿尔茨海默病患者陪伴平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 📖 项目概述

MedJourney 是一个专为阿尔茨海默病患者设计的AI驱动陪伴平台，集成了先进的AI技术、实时通信和医疗知识检索功能。平台通过多模态交互、智能对话和认知评估，为患者、家属和医护人员提供全方位的支持。

### 🎯 核心价值
- **患者关怀**: 提供24/7的AI陪伴和认知支持
- **家属支持**: 实时监控患者状态，提供专业建议
- **医疗辅助**: 为医护人员提供详细的评估报告和分析
- **数据驱动**: 基于AI的智能分析和预测

## 🔒 安全配置

### 环境变量设置
项目已配置为使用环境变量来保护敏感信息。请确保：

1. **复制环境变量模板**:
   ```bash
   # 前端
   cp medjourney-frontend/env.example medjourney-frontend/.env
   
   # 后端
   cp medjourney-backend/env.example medjourney-backend/.env
   ```

2. **配置API密钥**:
   - MiniMax API Key
   - Agora App ID & Token
   - Supabase 配置
   - ElevenLabs API Key
   - Stepfun API Key

3. **确保.env文件不被提交**:
   - 已配置.gitignore
   - 敏感信息不会上传到GitHub

## ✨ 主要功能

### 🤖 AI智能对话
- **多模态交互**: 支持语音、文字、图像输入
- **实时对话**: 基于MiniMax API的智能对话系统
- **情感识别**: AI驱动的情绪状态分析
- **认知评估**: 嵌入MMSE式评估的自然对话

### 📋 三阶段评估流程
1. **基础评估**: 收集患者信息、症状和家族史
2. **案例上传**: 上传医疗图像和案例描述
3. **AI对话**: 智能对话与认知测试

### 👥 虚拟患者系统
- **早期阶段**: 轻度认知障碍模拟
- **中期阶段**: 中度症状模拟
- **晚期阶段**: 重度症状模拟

### 📊 报告与分析
- **家属简报**: 通俗易懂的健康状态报告
- **医生报告**: 专业的医疗分析报告
- **PDF报告**: 包含图表和详细分析的可下载报告
- **社交分享**: 支持报告分享和传播

### 🏥 病史助手（新增）
- **多模态输入**: 支持文字、图片、文档上传
- **智能整理**: AI自动整理非结构化病史信息
- **实时更新**: 自动更新家属简报和医生仪表盘
- **专业分析**: 生成结构化的病史摘要和建议

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS + Radix UI
- **状态管理**: Zustand
- **路由**: React Router DOM
- **实时通信**: Agora Web SDK
- **图表**: Recharts
- **PDF生成**: jsPDF + html2canvas

### 后端技术栈
- **运行时**: Node.js 18+ + Express + TypeScript
- **AI服务**: MiniMax API + TEN Framework
- **数据库**: Supabase (PostgreSQL)
- **向量数据库**: Pinecone
- **文件处理**: Multer + Sharp
- **认证**: JWT + bcryptjs
- **实时通信**: WebSocket

### AI/ML服务
- **大语言模型**: MiniMax API (abab6.5s-chat)
- **语音合成**: ElevenLabs
- **图像分析**: 多模态AI处理
- **知识检索**: RAG (Retrieval-Augmented Generation)

### 部署与运维
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **环境管理**: 环境变量配置
- **监控**: Winston日志系统

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm
- Docker & Docker Compose (可选)

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/MedJourney.git
cd MedJourney
```

### 2. 环境配置
```bash
# 前端配置
cd medjourney-frontend
cp env.example .env
# 编辑 .env 文件，配置必要的API密钥

# 后端配置
cd ../medjourney-backend
cp env.example .env
# 编辑 .env 文件，配置数据库和API密钥
```

### 3. 安装依赖
```bash
# 前端依赖
cd medjourney-frontend
npm install

# 后端依赖
cd ../medjourney-backend
npm install
```

### 4. 启动开发环境
```bash
# 启动后端服务
cd medjourney-backend
npm run dev

# 启动前端服务
cd ../medjourney-frontend
npm run dev
```

### 5. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

## 🔧 配置说明

### 必需的环境变量

#### 前端 (.env)
```env
# MiniMax API配置
VITE_MINIMAX_API_KEY=your_minimax_api_key
VITE_MINIMAX_GROUP_ID=your_group_id

# Agora配置
VITE_AGORA_APP_ID=your_agora_app_id
VITE_AGORA_APP_TOKEN=your_agora_token

# API基础URL
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 后端 (.env)
```env
# 数据库配置
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI服务配置
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_group_id
STEPFUN_API_KEY=your_stepfun_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Pinecone配置
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# JWT配置
JWT_SECRET=your_jwt_secret
```

## 📱 核心页面

### 主要功能页面
- **仪表盘** (`/dashboard`): 系统概览和快速操作
- **病史助手** (`/history`): AI驱动的病史整理和对话
- **基础评估** (`/assessment/basic`): 患者基础信息收集
- **案例上传** (`/assessment/case`): 医疗文档和图像上传
- **AI对话** (`/assessment/chat`): 智能对话和认知评估
- **虚拟患者** (`/virtual-patients`): 不同阶段的患者模拟

### 报告页面
- **家属简报** (`/reports/family`): 面向家属的健康报告
- **医生报告** (`/reports/doctor`): 专业的医疗分析报告
- **分享报告** (`/reports/share`): 报告分享和传播

## 🔌 API接口

### 核心服务接口
```http
# 对话管理
POST /api/conversation/start          # 开始对话会话
POST /api/conversation/:id/message    # 发送消息
GET  /api/conversation/:id/analysis   # 获取对话分析

# 评估管理
POST /api/assessment/basic            # 提交基础评估
POST /api/assessment/case             # 上传案例文件
POST /api/assessment/chat             # 提交聊天评估

# 报告生成
GET  /api/reports/family/:id          # 生成家属简报
GET  /api/reports/doctor/:id          # 生成医生报告
POST /api/reports/share               # 分享报告

# 病史助手
POST /api/history/update-family       # 更新家属简报
POST /api/history/update-doctor       # 更新医生仪表盘
GET  /api/history/realtime            # 获取实时数据
```

### 健康检查接口
```http
GET  /api/health                      # 系统健康检查
POST /api/test/stepfun               # Stepfun AI服务测试
GET  /api/test/status                # 服务状态检查
```

## 🚀 部署

### Docker部署
```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build
```

### 生产环境部署
```bash
# 构建生产版本
cd medjourney-frontend
npm run build

cd ../medjourney-backend
npm run build

# 启动生产服务
npm start
```

## 📊 项目结构

```
MedJourney/
├── medjourney-frontend/          # 前端应用
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 通用组件
│   │   ├── services/            # API服务
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── stores/              # 状态管理
│   │   └── utils/               # 工具函数
│   └── package.json
├── medjourney-backend/           # 后端API
│   ├── src/
│   │   ├── controllers/         # 控制器
│   │   ├── services/            # 业务逻辑
│   │   ├── middleware/          # 中间件
│   │   ├── routes/              # 路由定义
│   │   └── utils/               # 工具函数
│   └── package.json
├── docs/                        # 项目文档
├── docker-compose.yml           # Docker配置
├── nginx.conf                   # Nginx配置
└── README.md                    # 项目说明
```

## 🔒 安全特性

- **JWT认证**: 安全的用户认证机制
- **API限流**: 防止API滥用
- **数据加密**: 敏感数据加密传输
- **CORS配置**: 跨域请求安全控制
- **输入验证**: 严格的数据验证和清理
- **环境变量**: 敏感信息通过环境变量管理

## 🧹 项目清理

已完成以下清理工作：
- ✅ 删除测试和调试文件
- ✅ 移除重复的前端项目
- ✅ 清理构建产物
- ✅ 移除硬编码的API密钥
- ✅ 配置环境变量
- ✅ 更新.gitignore文件
- ✅ 减少console.log语句

## 🤝 贡献指南

### 开发环境设置
1. Fork项目仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add some amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 编写单元测试
- 添加JSDoc注释
- 避免硬编码敏感信息

## 📝 更新日志

### v2.1.0 (2025-01-27)
- 🔒 安全改进：移除硬编码API密钥
- 🧹 代码清理：删除不必要的文件和代码
- 📝 文档更新：添加安全配置说明
- 🔧 环境配置：完善环境变量管理

### v2.0.0 (2025-07-27)
- ✨ 新增病史助手功能
- 🔧 集成MiniMax API
- 📊 实时数据更新机制
- 🧪 完善测试功能
- 🎨 UI/UX优化

### v1.0.0 (2025-07-20)
- 🚀 初始版本发布
- 🤖 AI对话功能
- 📋 三阶段评估流程
- 👥 虚拟患者系统
- 📊 报告生成功能

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [MiniMax](https://www.minimax.chat/) - AI对话服务
- [Agora](https://www.agora.io/) - 实时通信服务
- [Supabase](https://supabase.com/) - 数据库服务
- [Pinecone](https://www.pinecone.io/) - 向量数据库
- [ElevenLabs](https://elevenlabs.io/) - 语音合成服务

## 📞 联系我们

- **项目主页**: https://github.com/yourusername/MedJourney
- **在线演示**: https://06jy00o1s5lb.space.minimax.io
- **问题反馈**: [GitHub Issues](https://github.com/yourusername/MedJourney/issues)

---

**MedJourney** - 让AI陪伴每一位阿尔茨海默病患者 🏥💙
