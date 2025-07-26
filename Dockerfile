# 多阶段构建 - 前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY medjourney-frontend/package*.json ./
RUN npm ci --only=production

COPY medjourney-frontend/ ./
RUN npm run build

# 多阶段构建 - 后端
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY medjourney-backend/package*.json ./
RUN npm ci --only=production

COPY medjourney-backend/ ./
RUN npm run build

# 生产镜像
FROM node:18-alpine AS production

# 安装nginx
RUN apk add --no-cache nginx

# 复制前端构建结果
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 复制后端构建结果
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package*.json /app/backend/

WORKDIR /app/backend
RUN npm ci --only=production

# 配置nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80 3001

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"] 