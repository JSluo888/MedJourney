# 🚀 MedJourney 快速部署指南

## 方案1: Vercel 一键部署 (最简单)

### 步骤1: 准备代码
```bash
# 确保代码已提交到GitHub
git add .
git commit -m "准备部署"
git push origin main
```

### 步骤2: 部署前端
1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入你的GitHub仓库
4. 选择 `medjourney-frontend` 目录
5. 设置构建命令: `npm run build`
6. 设置输出目录: `dist`
7. 点击 "Deploy"

### 步骤3: 部署后端
1. 在Vercel中创建新项目
2. 选择 `medjourney-backend` 目录
3. 设置构建命令: `npm run build`
4. 设置启动命令: `npm start`
5. 配置环境变量

### 步骤4: 配置环境变量
在Vercel项目设置中添加:
```
STEPFUN_API_KEY=your-stepfun-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
AGORA_APP_ID=your-agora-app-id
```

## 方案2: Netlify 部署

### 前端部署
1. 访问 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 连接GitHub仓库
4. 设置:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

## 方案3: GitHub Pages 部署

### 创建部署脚本
```bash
# 在项目根目录创建 .github/workflows/deploy.yml
mkdir -p .github/workflows
```

```yaml
name: Deploy to GitHub Pages
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
      - run: cd medjourney-frontend && npm install
      - run: cd medjourney-frontend && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./medjourney-frontend/dist
```

## 方案4: 本地构建 + 静态托管

### 步骤1: 本地构建
```bash
cd medjourney-frontend
npm install
npm run build
```

### 步骤2: 上传到静态托管
将 `dist` 文件夹上传到:
- Vercel
- Netlify
- GitHub Pages
- 任何静态文件托管服务

## 方案5: Docker 部署

### 创建简化Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY medjourney-frontend/package*.json ./
RUN npm install
COPY medjourney-frontend/ ./
RUN npm run build
EXPOSE 80
CMD ["npx", "serve", "-s", "dist", "-l", "80"]
```

### 构建和运行
```bash
docker build -t medjourney .
docker run -p 80:80 medjourney
```

## 🔧 环境变量配置

### 必需的环境变量
```env
# AI服务
STEPFUN_API_KEY=your-stepfun-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# 实时通信
AGORA_APP_ID=your-agora-app-id

# 数据库 (可选)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## 📝 部署检查清单

### 部署前
- [ ] 代码已提交到Git
- [ ] 环境变量已配置
- [ ] API密钥已获取
- [ ] 构建测试通过

### 部署后
- [ ] 页面正常加载
- [ ] 静态资源正常
- [ ] API调用正常
- [ ] 功能测试通过

## 🚨 常见问题

### 1. 构建失败
```bash
# 检查Node版本
node --version  # 需要18+

# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. 环境变量问题
- 确保所有API密钥正确
- 检查环境变量名称大小写
- 重启部署服务

### 3. CORS错误
- 配置正确的API域名
- 检查后端CORS设置
- 使用代理或CDN

## 🎯 推荐部署流程

1. **选择Vercel** (最简单)
2. **部署前端** (5分钟)
3. **部署后端** (5分钟)
4. **配置域名** (可选)
5. **测试功能** (10分钟)

## 📞 快速支持

如果遇到问题:
1. 检查构建日志
2. 验证环境变量
3. 测试本地运行
4. 查看错误信息

---

**预计部署时间: 15-30分钟**
**难度: ⭐⭐☆☆☆ (简单)** 