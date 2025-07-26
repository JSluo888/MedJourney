#!/bin/sh

# 启动nginx
nginx

# 启动后端服务
cd /app/backend
npm start &

# 等待后端启动
sleep 5

# 保持容器运行
tail -f /dev/null 