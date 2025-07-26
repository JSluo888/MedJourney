#!/bin/bash

# MedJourney 对话存储服务部署脚本
# 服务器信息：
# IP: 36.50.226.131
# 密码: 10mZSt1mpYBDKt5
# IPv6: 2408:8653:dc00:20b:500::4

set -e

echo "开始部署 MedJourney 对话存储服务..."

# 服务器配置
SERVER_IP="36.50.226.131"
SERVER_USER="root"
SERVER_PASSWORD="10mZSt1mpYBDKt5"
SERVICE_PORT="8000"
SERVICE_NAME="medjourney-conversation-storage"

# 本地项目路径
LOCAL_PROJECT_PATH="$(pwd)/conversation-storage-service"

# 远程项目路径
REMOTE_PROJECT_PATH="/opt/medjourney/conversation-storage-service"

echo "正在连接到服务器 $SERVER_IP..."

# 使用sshpass进行自动化部署
if ! command -v sshpass &> /dev/null; then
    echo "请先安装 sshpass: brew install sshpass (macOS) 或 apt-get install sshpass (Ubuntu)"
    exit 1
fi

# 创建远程目录
echo "创建远程目录..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_PROJECT_PATH"

# 复制项目文件
echo "复制项目文件到服务器..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$LOCAL_PROJECT_PATH"/* "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/"

# 在服务器上安装Docker（如果未安装）
echo "检查并安装Docker..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh; fi"

# 在服务器上安装Docker Compose（如果未安装）
echo "检查并安装Docker Compose..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "if ! command -v docker-compose &> /dev/null; then curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose; fi"

# 启动服务
echo "启动对话存储服务..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PROJECT_PATH && docker-compose down && docker-compose up -d --build"

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PROJECT_PATH && docker-compose ps"

# 测试API
echo "测试API连接..."
if curl -s "http://$SERVER_IP:$SERVICE_PORT/health" > /dev/null; then
    echo "✅ 服务部署成功！"
    echo "📊 API地址: http://$SERVER_IP:$SERVICE_PORT"
    echo "📖 API文档: http://$SERVER_IP:$SERVICE_PORT/docs"
    echo "🔍 健康检查: http://$SERVER_IP:$SERVICE_PORT/health"
else
    echo "❌ 服务部署可能有问题，请检查日志"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PROJECT_PATH && docker-compose logs"
fi

echo "部署完成！" 