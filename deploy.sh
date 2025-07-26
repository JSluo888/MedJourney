#!/bin/bash

# MedJourney 一键部署脚本
echo "🚀 开始部署 MedJourney..."

# 检查Node.js版本
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查是否在正确的目录
if [ ! -f "medjourney-frontend/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 构建前端
echo "🔨 构建前端..."
cd medjourney-frontend

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 构建项目
echo "🏗️ 构建前端项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功！"
else
    echo "❌ 前端构建失败"
    exit 1
fi

cd ..

# 构建后端
echo "🔨 构建后端..."
cd medjourney-backend

# 安装依赖
echo "📦 安装后端依赖..."
npm install

# 构建项目
echo "🏗️ 构建后端项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 后端构建成功！"
else
    echo "❌ 后端构建失败"
    exit 1
fi

cd ..

echo ""
echo "🎉 构建完成！"
echo ""
echo "📁 构建产物位置："
echo "   前端: medjourney-frontend/dist/"
echo "   后端: medjourney-backend/dist/"
echo ""
echo "🚀 部署选项："
echo "1. Vercel (推荐): https://vercel.com"
echo "2. Netlify: https://netlify.com"
echo "3. GitHub Pages: 已配置自动部署"
echo "4. Docker: docker-compose up --build"
echo ""
echo "📝 部署步骤："
echo "1. 将代码推送到 GitHub"
echo "2. 在 Vercel/Netlify 中导入项目"
echo "3. 配置环境变量"
echo "4. 部署完成！"
echo ""
echo "🔧 环境变量配置："
echo "STEPFUN_API_KEY=your-stepfun-api-key"
echo "ELEVENLABS_API_KEY=your-elevenlabs-api-key"
echo "AGORA_APP_ID=your-agora-app-id"
echo ""
echo "📖 详细部署指南请查看: QUICK_DEPLOY.md" 