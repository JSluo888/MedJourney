# MiniMax API 配置说明

## 🔑 必需参数

### 1. API Key
- **用途**：身份验证
- **格式**：JWT Token
- **获取方式**：从MiniMax平台获取

### 2. Group ID
- **用途**：组织管理
- **格式**：数字字符串
- **获取方式**：从MiniMax平台获取

## 🔧 当前配置

### API配置信息
```typescript
// 当前使用的配置
const config = {
  apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJNZWRqb3VybmV5IiwiVXNlck5hbWUiOiJNZWRqb3VybmV5IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5NDg1NjM1MTExMjI2MDAyOTUiLCJQaG9uZSI6IjEzOTAxNzYxMjk2IiwiR3JvdXBJRCI6IjE5NDg1NjM1MTExMTg0MDU5OTEiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0wNy0yNyAwNDozMDozMSIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.XCWZU3wWNp0DE_uuE53sS27RJ33hNKtvTmL4Dv31ArQ2YUpO6Cn_hUj65_JrOcw-NXkX1M6G1otGY3znzA1ken8YpUUZlIWX5t2ClWBN29472FGNSZxTTihrTUtb6QWsysITblmExacjF1UNEkN8mc1K0tR0dlo_n7E5ZhnziROmyAh9iFYwiDf9ix029-ggNTJbQW-3fqnvxtBttnTDqQ3o-0CQv3LAo3Ufy5xgLP9dgNN0XwvIVe8SDCUTiJ11GzOWtAtmsjE2C2IGw74uBfW-W2ONAb6KqVjJvQuyvya_zQ8TiDqygBXztJljnxjerHh_oMMHPDiCqxZTtEh_3Q',
  groupId: '1948563511118405991',
  baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2'
};
```

### JWT Token解析信息
```json
{
  "GroupName": "Medjourney",
  "UserName": "Medjourney",
  "Account": "",
  "SubjectID": "19485635111122600295",
  "Phone": "13901761296",
  "GroupID": "1948563511118405991",
  "PageName": "",
  "Mail": "",
  "CreateTime": "2025-07-27 04:30:31",
  "TokenType": 1,
  "iss": "minimax"
}
```

## 📡 API调用格式

### 基础URL
```
https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId={groupId}
```

### 请求头
```typescript
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}
```

### 请求体示例
```typescript
{
  "model": "abab6.5s-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的医疗AI助手..."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请分析这张医疗图像"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
          }
        }
      ]
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false,
  "tools": [{"type": "web_search"}],
  "tool_choice": "none"
}
```

## 🖼️ 图像输入支持

### 支持的图像格式
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ BMP
- ✅ TIFF

### 图像处理流程
1. **文件上传**：用户选择图像文件
2. **格式验证**：检查文件类型
3. **Base64编码**：转换为Base64字符串
4. **消息构建**：创建多模态消息
5. **API调用**：发送到MiniMax API

### 图像输入示例
```typescript
// 多模态消息格式
const message = {
  role: 'user',
  content: [
    {
      type: 'text',
      text: '请分析这张X光片'
    },
    {
      type: 'image_url',
      image_url: {
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
      }
    }
  ]
};
```

## 🧪 测试功能

### 测试页面
访问 `TestMinimaxPage.tsx` 进行功能测试：

1. **文本测试**：仅发送文本消息
2. **图像测试**：仅上传图像
3. **多模态测试**：文本+图像组合

### 测试用例
```typescript
// 测试文本
"请帮我分析一下这个症状"

// 测试图像
上传医疗图像文件

// 测试多模态
"请分析这张CT扫描图像" + 上传CT图像
```

## ⚙️ 配置参数

### 模型参数
- **model**: `abab6.5s-chat` (推荐)
- **temperature**: `0.7` (创造性)
- **max_tokens**: `2048` (最大输出长度)
- **stream**: `false` (非流式响应)

### 工具配置
- **tools**: `[{"type": "web_search"}]` (网络搜索)
- **tool_choice**: `"none"` (不使用工具)

## 🔒 安全注意事项

### API Key 安全
1. **不要硬编码**：使用环境变量
2. **定期轮换**：定期更新API Key
3. **权限控制**：设置最小必要权限
4. **监控使用**：监控API调用频率

### 数据隐私
1. **图像处理**：本地Base64编码
2. **传输加密**：HTTPS传输
3. **数据清理**：及时清理临时数据

## 📊 使用限制

### 速率限制
- 每分钟请求数限制
- 并发请求数限制
- Token使用量限制

### 文件大小限制
- 单个图像文件大小限制
- 总请求大小限制
- Base64编码长度限制

## 🚀 最佳实践

### 1. 错误处理
```typescript
try {
  const response = await minimaxService.sendMultimodalMessage(text, images);
  return response;
} catch (error) {
  console.error('MiniMax API错误:', error);
  throw new Error('AI服务暂时不可用，请稍后重试');
}
```

### 2. 图像优化
```typescript
// 压缩图像
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 0.8; // 压缩到80%
      canvas.height = img.height * 0.8;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: file.type }));
        }
      }, file.type, 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

### 3. 缓存策略
```typescript
// 缓存API响应
const cache = new Map();

const getCachedResponse = (key: string) => {
  return cache.get(key);
};

const setCachedResponse = (key: string, response: string) => {
  cache.set(key, response);
  // 设置过期时间
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5分钟
};
```

## 📞 技术支持

### 常见问题
1. **API Key无效**：检查密钥是否正确
2. **Group ID错误**：确认组织ID
3. **图像上传失败**：检查文件格式和大小
4. **响应超时**：检查网络连接

### 联系支持
- MiniMax官方文档
- API状态监控
- 技术支持邮箱 