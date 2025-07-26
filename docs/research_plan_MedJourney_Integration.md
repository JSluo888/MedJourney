# 研究计划: MedJourney MVP 深度集成

## 1. 核心目标
- 提供一个可操作的、端到端的MedJourney MVP集成方案，重点围绕TEN Framework、Agora、Stepfun和ElevenLabs进行。
- 产出一份包含架构图、代码示例和最佳实践的深度技术文档。

## 2. 研究任务分解

### 第一部分：TEN Framework 与 Agora 深度集成
- **子任务 1.1**: 梳理从用户端（Web App）的Agora SDK到后端TEN Agent的完整音频数据流和信令流。
- **子任务 1.2**: 研究TEN Agent中处理网络抖动、音频中断等异常的机制，并设计错误处理和自动重连方案。
- **子任务 1.3**: 分析VAD (语音活动检测) 与Turn Detection (对话轮次检测) 的协同工作模式，以优化打断（Barge-in）的灵敏度和准确性。
- **子任务 1.4**: 绘制一幅更新版的、详细的系统集成架构图。

### 第二部分：Stepfun API 替换 OpenAI 研究
- **子任务 2.1**: **关键搜索**: 寻找Stepfun API的官方文档。搜索 "Stepfun API documentation", "Stepfun API pricing", "Stepfun API vs OpenAI"。
- **子任务 2.2**: 分析Stepfun的`/v1/chat/completions`接口（或其他核心接口）与OpenAI的异同点，包括请求体、响应体、流式接口和错误码。
- **子任务 2.3**: 设计一个将TEN Framework中LLM扩展从OpenAI迁移到Stepfun的具体方案。
- **子任务 2.4**: 编写使用Stepfun API Key (`4kNO9...`) 进行调用的Node.js代码示例（包括流式和非流式）。
- **子任务 2.5**: 基于Stepfun的特性，研究针对中文医疗场景的Prompt优化策略。

### 第三部分：ElevenLabs 语音合成集成研究
- **子任务 3.1**: **关键搜索**: 查找ElevenLabs API的官方文档，特别是关于流式语音合成 (Streaming TTS) 和中文语音支持的部分。搜索 "ElevenLabs API documentation", "ElevenLabs streaming audio Node.js", "ElevenLabs Chinese voice ID"。
- **子任务 3.2**: 验证API Key (`sk_315...`) 的有效性，并查找高质量的中文语音模型ID。
- **子任务 3.3**: 提供在TEN Framework中配置ElevenLabs作为TTS扩展的具体步骤。
- **子任务 3.4**: 编写一个Node.js代码示例，演示如何调用ElevenLabs API生成流式语音。

### 第四部分：实时对话存储与分析
- **子任务 4.1**: 设计一个用于存储多模态对话的MongoDB Schema或JSON数据结构。
- **子任务 4.2**: 规划一个实时的、非阻塞的对话分析流程（例如，使用消息队列或异步任务进行情感分析）。
- **子任务 4.3**: 设计自动生成家属/医生简报的数据聚合逻辑。

### 第五部分：整合与输出
- **子任务 5.1**: 撰写一份全新的、名为`docs/MedJourney_Integration_Research.md`的综合技术报告。
- **子任务 5.2**: 报告中需包含更新后的架构图、所有代码示例、数据流设计和性能优化建议。
- **子任务 5.3**: 明确指出潜在的技术挑战和对应的解决方案。

## 3. 资源策略
- **主要信息来源**: 官方API文档 (Stepfun, ElevenLabs), TEN Framework官方文档和GitHub仓库, Agora开发者社区, 技术博客。
- **搜索关键词**: "Stepfun API docs", "ElevenLabs streaming TTS API", "TEN framework custom extension", "real-time conversational AI architecture", "MongoDB schema for chat applications"。

## 4. 预期交付物
1.  一份名为 `docs/MedJourney_Integration_Research.md` 的综合技术研究报告。
2.  报告中包含一个详细的、更新的系统集成架构图。
3.  报告中包含从OpenAI迁移到Stepfun的完整方案和代码示例。
4.  报告中包含ElevenLabs集成的详细方案和代码示例。

## 5. 工作流选择
- **主要焦点**: 搜索和分析。
- **理由**: 本次任务的核心是研究新的API、设计具体的集成和迁移方案，需要精确的信息检索和深度的技术分析。
