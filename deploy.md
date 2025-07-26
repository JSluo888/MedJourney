# MedJourney 部署指南

## 🚀 快速部署方案

### 方案1: Vercel 部署 (推荐)

#### 前端部署
1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署前端**
   ```bash
   cd medjourney-frontend
   vercel --prod
   ```

4. **配置环境变量**
   - 在 Vercel 控制台设置环境变量
   - `VITE_API_URL`: 后端API地址

#### 后端部署
1. **部署后端**
   ```bash
   cd medjourney-backend
   vercel --prod
   ```

2. **配置环境变量**
   - `STEPFUN_API_KEY`: Stepfun AI API密钥
   - `ELEVENLABS_API_KEY`: ElevenLabs API密钥
   - `AGORA_APP_ID`: Agora App ID

### 方案2: Netlify 部署

#### 前端部署
1. **连接 GitHub 仓库**
   - 登录 Netlify
   - 选择 "New site from Git"
   - 连接你的 GitHub 仓库

2. **配置构建设置**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **设置环境变量**
   - 在 Site settings > Environment variables 中设置

### 方案3: Railway 部署

1. **连接 GitHub 仓库**
   - 登录 Railway
   - 选择 "Deploy from GitHub repo"

2. **配置服务**
   - 前端: 设置构建命令 `npm run build`
   - 后端: 设置启动命令 `npm start`

3. **设置环境变量**
   - 在 Variables 标签页设置所有必要的环境变量

### 方案4: Docker 部署

#### 本地 Docker 部署
```bash
# 构建并启动
docker-compose up --build

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
# 全栈: http://localhost:80
```

#### 云服务器部署
1. **准备服务器**
   ```bash
   # 安装 Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **部署应用**
   ```bash
   # 克隆项目
   git clone <your-repo-url>
   cd medjourney
   
   # 构建并启动
   docker-compose up -d --build
   ```

3. **配置域名**
   - 将域名解析到服务器IP
   - 配置 SSL 证书 (Let's Encrypt)

## 🔧 环境变量配置

### 前端环境变量
```env
VITE_API_URL=https://your-backend-url.com
VITE_AGORA_APP_ID=your-agora-app-id
```

### 后端环境变量
```env
NODE_ENV=production
PORT=3001
STEPFUN_API_KEY=your-stepfun-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
AGORA_APP_ID=your-agora-app-id
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## 📝 部署检查清单

### 部署前检查
- [ ] 代码已提交到 Git 仓库
- [ ] 环境变量已配置
- [ ] API 密钥已获取
- [ ] 域名已准备 (可选)

### 部署后检查
- [ ] 前端页面正常加载
- [ ] 后端 API 正常响应
- [ ] WebSocket 连接正常
- [ ] 文件上传功能正常
- [ ] AI 对话功能正常

## 🐛 常见问题

### 1. 构建失败
- 检查 Node.js 版本 (需要 18+)
- 检查依赖包是否正确安装
- 查看构建日志

### 2. API 连接失败
- 检查环境变量配置
- 确认后端服务正常运行
- 检查 CORS 配置

### 3. WebSocket 连接失败
- 确认 WebSocket 代理配置
- 检查防火墙设置
- 验证 SSL 证书 (如果使用 HTTPS)

## 🔒 安全配置

### 生产环境安全
1. **启用 HTTPS**
2. **配置 CORS**
3. **设置 API 限流**
4. **启用安全头**
5. **配置环境变量**

### 监控和日志
1. **设置错误监控**
2. **配置访问日志**
3. **设置性能监控**
4. **配置告警**

## 📊 性能优化

### 前端优化
- 启用 Gzip 压缩
- 配置静态资源缓存
- 使用 CDN
- 代码分割

### 后端优化
- 启用数据库连接池
- 配置缓存
- 优化查询
- 设置负载均衡

## 🚀 自动化部署

### GitHub Actions
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 技术支持

如果遇到部署问题，请：
1. 检查部署日志
2. 查看环境变量配置
3. 确认服务状态
4. 联系技术支持 