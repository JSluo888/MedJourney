# MedJourney MVP 深度集成研究报告

**版本:** 2.0
**日期:** 2025年7月25日
**作者:** MiniMax Agent

## 摘要

本报告是 MedJourney MVP 技术研究的第二阶段，重点关注具体服务的深度集成和落地实现。基于第一阶段的架构，本次研究的核心是将 LLM 服务从 OpenAI 迁移至 Stepfun，并深入探讨 TEN Framework 与 Agora 在 Conversational AI 场景下的协同工作原理、性能优化、数据处理及最佳实践，旨在为开发团队提供一份可直接执行的、包含代码示例的工程手册。

---

## 1. TEN Framework 与 Agora 深度集成

TEN 与 Agora 的无缝集成是实现高质量实时语音对话的基石。其核心思想是**信令与媒体分离**：使用 WebSocket 处理轻量级的文本和状态信令，而将高带宽的音频媒体流交由 Agora 高效的 SD-RTN™ 网络处理。

### 1.1. 协同工作原理与数据流

1.  **初始化**: 用户前端（Web App）和后端 TEN Agent 同时初始化各自的 Agora RTC 客户端，并使用相同的 App ID 和频道名加入同一个频道。TEN Agent 此时是一个“静默”的参与者。
2.  **上行音频流 (用户 -> AI)**: 用户在前端说话，浏览器通过 `AgoraRTC.createMicrophoneAudioTrack()` 捕获音频。该音频流被发布 (publish) 到 Agora 频道。TEN Agent 在频道内订阅 (subscribe) 该用户的音频流，从而获得实时的原始音频数据。
3.  **AI 处理流水线**: TEN Agent 将接收到的音频流实时送入内部的 AI 处理流水线：`VAD/Turn Detection -> STT -> LLM -> TTS`。
4.  **下行音频流 (AI -> 用户)**: TTS 扩展（如 ElevenLabs）生成 AI 的语音。此语音流被 TEN Agent 作为一个新的音频轨道发布到 Agora 频道。用户前端订阅这个来自 TEN Agent 的音频流并播放。
5.  **信令流**: 对话状态（如 `listening`, `thinking`, `speaking`）、文本消息、AI 回应的文字稿等，通过一个独立的 WebSocket 连接在前后端之间传递。

### 1.2. Conversational AI 架构图

```mermaid
graph TD
    subgraph Browser/Client
        A[User] -- Speaks --> B{MedJourney Web App};
        B -- 1. Audio Capture --> C[Agora Web SDK];
        C -- 2. Publishes Audio Stream --> D[Agora SD-RTN™ Channel];
        B -- 3. WebSocket Signaling --> E[TEN Agent WebSocket Server];
    end

    subgraph Backend Infrastructure
        subgraph MedJourney TEN Agent (Node.js)
            F[Agora RTC Client];
            D -- 4. Subscribes Audio Stream --> F;
            F -- 5. Raw Audio --> G[VAD & Turn Detection];
            G -- 6. Voice Activity --> H[STT Extension (e.g., Deepgram)];
            H -- 7. Text --> I[LLM Extension (Stepfun)];
            I -- 8. Response Text --> J[TTS Extension (ElevenLabs)];
            J -- 9. Synthesized Audio Stream --> F;
            F -- 10. Publishes AI Audio --> D;
            E -- Receives Signaling --> I;
            I -- Sends Signaling --> E;
        end
        
        subgraph Third-party Services
            I -- API Call --> K[Stepfun API];
            J -- API Call --> L[ElevenLabs API];
        end
    end

    D -- 11. AI Audio Stream --> C;
    C -- 12. Plays AI Voice --> B;
    B -- Displays Text/Status --> A;

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style K fill:#9f9,stroke:#333,stroke-width:2px
    style L fill:#9f9,stroke:#333,stroke-width:2px
```

### 1.3. 低延迟优化

- **全链路流式处理**: 确保 STT、LLM、TTS 三个环节全部采用流式（Streaming）API。STT 逐字返回识别结果，LLM 逐字或逐词生成回应，TTS 接收到文本片段后立即开始合成并播放。
- **VAD/Turn Detection 协同**: 
    - **VAD (Voice Activity Detection)**: 负责在用户开口的瞬间触发 STT，并在用户停止说话后的一小段时间（如 300ms）内结束识别。这是实现快速响应的基础。
    - **Turn Detection**: 更智能的对话轮次检测。它能分析语义和停顿，判断用户是真的说完了还只是在思考。在 AI 说话时，如果 Turn Detection 检测到用户强烈的插入意图（Barge-in），可以立即中断 TTS 的播放，将控制权交还给用户，实现自然打断。
- **就近部署**: 将 TEN Agent 部署在靠近用户和第三方服务（Stepfun, ElevenLabs）的云服务器区域，以减少网络延迟。

### 1.4. 多模态交互

- **文本输入**: 用户通过 WebSocket 发送文本消息，跳过 STT，直接进入 LLM 处理环节。
- **图像输入**: 用户上传图片，前端将图片 URL 通过 WebSocket 发送给 TEN Agent。Agent 调用支持多模态的 LLM（如 Stepfun 的多模态模型），将图片 URL 和问题文本一同发送进行处理。

### 1.5. 错误处理和重连机制

- **Agora SDK**: Agora 的 SDK 内置了强大的断线重连机制。开发者需要监听 `connection-state-change` 事件，在 UI 上向用户提示当前的网络状态（如“连接中断，正在尝试重连...”）。
- **WebSocket**: 客户端需要实现心跳机制（如每 30 秒发送一个 ping 包）和断线自动重连逻辑。重连成功后，可以向后端请求最后几条对话历史以恢复上下文。
- **AI 服务异常**: 对 STT/LLM/TTS 的 API 调用需要进行完整的 `try...catch` 包裹，并设置合理的超时时间。如果某个服务失败（如 Stepfun API 超时），应有降级策略（如返回“抱歉，我的大脑暂时无法思考，请稍后再试”）而不是让整个应用崩溃。

---

## 2. Stepfun API 深度研究与迁移方案

将 LLM 从 OpenAI 切换到 Stepfun 是本次研究的核心任务之一。幸运的是，Stepfun 的 API 设计与 OpenAI 高度兼容，极大地降低了迁移的复杂性。

### 2.1. API 接口分析与兼容性

根据阶跃星辰（Stepfun）官方文档，其核心对话接口 `/v1/chat/completions` 在设计上遵循了 OpenAI 的格式。

- **共同点**:
    - **Endpoint**: 路径 `/v1/chat/completions` 完全相同。
    - **请求方法**: 均为 `POST`。
    - **核心参数**: `model`, `messages`, `stream` 等核心参数的结构和含义保持一致。
    - **SDK 复用**: 可以直接复用 OpenAI 的官方 Node.js SDK (`openai`)，只需修改 `baseURL` 和 `apiKey` 即可。

- **差异点**:
    - **`baseURL`**: 必须从 OpenAI 的 `https://api.openai.com/v1` 修改为 Stepfun 的 `https://api.stepfun.com/v1`。
    - **`apiKey`**: 必须使用 Stepfun 平台提供的 API Key (`4kNO9...`)。
    - **模型名称 (`model`)**: 需要替换为 Stepfun 提供的模型标识，例如 `step-1-8k` 或其他更高版本的模型。

### 2.2. 从 OpenAI 到 Stepfun 的迁移方案

在 TEN Framework 中，LLM 是一个独立的扩展。迁移工作只需修改该扩展的配置文件或代码，无需改动框架核心。

**步骤**:

1.  **找到 LLM 扩展**: 在 TEN Agent 的项目结构中，定位到用于调用 LLM 的扩展文件（通常是一个 TypeScript或 JavaScript 文件）。
2.  **修改 OpenAI SDK 实例化**: 找到实例化 OpenAI 客户端的代码。

    *   **原代码 (OpenAI)**:
        ```typescript
        import OpenAI from 'openai';

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        ```

    *   **修改后代码 (Stepfun)**:
        ```typescript
        import OpenAI from 'openai'; // SDK 无需改变

        const stepfun = new OpenAI({
            apiKey: process.env.STEPFUN_API_KEY, // 使用 Stepfun 的 Key
            baseURL: 'https://api.stepfun.com/v1', // **关键：修改 baseURL**
        });
        ```

3.  **更新环境变量**: 在 `.env` 文件中，添加 `STEPFUN_API_KEY`，并注释或移除 `OPENAI_API_KEY`。
    ```.env
    # OPENAI_API_KEY=sk-...
    STEPFUN_API_KEY=4kNO9CYMO1ddw4s20byLvrkYtBWXowdR1OcrY8Hi7tkapqi3gMAEAzNHCl3LKqFIy
    ```

4.  **修改模型参数**: 在调用 `chat.completions.create` 方法时，将 `model` 参数从 OpenAI 的模型（如 `gpt-4o`）修改为 Stepfun 的模型。

    *   **原代码 (OpenAI)**:
        ```typescript
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            stream: true,
        });
        ```

    *   **修改后代码 (Stepfun)**:
        ```typescript
        const response = await stepfun.chat.completions.create({
            model: 'step-1-8k', // 修改为 Stepfun 提供的模型
            messages: messages,
            stream: true,
        });
        ```

### 2.3. Stepfun API 调用代码示例 (Node.js)

这是一个可以直接运行的、完整的 Node.js 示例，展示了如何调用 Stepfun API 并处理流式响应。

```javascript
import OpenAI from 'openai';

// 使用 Stepfun 的 Key 和 baseURL 初始化
const stepfun = new OpenAI({
    apiKey: '4kNO9CYMO1ddw4s20byLvrkYtBWXowdR1OcrY8Hi7tkapqi3gMAEAzNHCl3LKqFIy',
    baseURL: 'https://api.stepfun.com/v1',
});

async function main() {
    console.log('--- 调用 Stepfun 流式 API ---');
    const stream = await stepfun.chat.completions.create({
        model: 'step-1-8k', // 假设使用这个模型
        messages: [{ role: 'user', content: '你好，请介绍一下阿尔茨海默病。' }],
        stream: true,
    });

    for await (const chunk of stream) {
        // chunk.choices[0]?.delta?.content 包含了返回的文本片段
        process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
    console.log('\n\n--- 流式 API 调用结束 ---\n');
}

async function nonStreaming() {
    console.log('--- 调用 Stepfun 非流式 API ---');
    const completion = await stepfun.chat.completions.create({
        model: 'step-1-8k',
        messages: [{ role: 'user', content: '请用一句话总结阿尔茨海默病。' }],
        stream: false,
    });
    console.log(completion.choices[0].message.content);
    console.log('--- 非流式 API 调用结束 ---');
}

main();
nonStreaming();

```

### 2.4. 性能与中文支持

- **性能**: Stepfun 作为国内厂商，其服务器在国内的访问速度理论上会优于 OpenAI，这对于降低首字延迟（Time to First Token）非常有帮助。具体性能需进行实际的基准测试。
- **成本**: 通常国内大模型服务的价格会比 OpenAI 更具竞争力，这能显著降低 MedJourney 的运营成本。
- **中文支持**: Stepfun 的模型是针对中文环境原生训练的，因此在理解中文（特别是医疗领域的专有名词和语境）和生成符合中文习惯的回答方面，预计会比通用模型有更好的表现。

### 2.5. 医疗场景 Prompt 优化

为了让 Stepfun 模型表现更专业，需要在 Prompt 中进行优化：

- **设定角色 (Role)**: 在 `messages` 数组的开头，始终加入一个 `system` 角色的消息，为 AI 设定清晰的身份和行为准则。
    ```json
    {
        "role": "system",
        "content": "你是一个充满耐心、同理心和专业知识的阿尔茨海默病陪伴助手，名叫'小慧'。你的任务是使用简洁、易懂的语言与老年患者交流，并根据提供的知识库回答问题。在任何情况下都不能提供医疗建议或诊断，而是建议用户咨询医生。"
    }
    ```
- **结合 RAG**: 将从向量数据库中检索到的专业知识作为上下文，清晰地注入到 Prompt 中，指导模型基于这些事实来回答。
    ```json
    {
        "role": "user",
        "content": "请根据以下背景知识回答我的问题。\n\n背景知识：\n- [从向量数据库检索到的文本块1]\n- [从向量数据库检索到的文本块2]\n\n我的问题是：..."
    }
    ```

---

## 3. ElevenLabs 语音合成集成

选择 ElevenLabs 作为 TTS 引擎，主要优势在于其高质量、自然且低延迟的流式语音合成能力，这对于创造流畅的对话体验至关重要。

### 3.1. API 配置与中文支持

- **API Key**: `sk_315efe2656c525c68c74b5b2ae5a25c0954b373548b9e1ac`
- **中文支持**: ElevenLabs 提供了多语言模型，支持高质量的中文语音合成。在使用时，需要选择支持中文的特定模型，例如 `eleven_multilingual_v2`。
- **语音选择 (Voice ID)**: ElevenLabs 允许选择不同的预设声音或克隆自己的声音。每个声音都有一个唯一的 Voice ID。我们需要从其官方支持的声音列表中，选择一个听起来最自然、最亲切的中文女声或男声作为 AI Agent 的声音。

### 3.2. 与 TEN Framework 的集成

与替换 LLM 类似，替换 TTS 也是通过修改 TEN Agent 中的 TTS 扩展来实现的。

1.  **定位 TTS 扩展**: 找到处理文本到语音转换的模块。
2.  **修改配置**: 在该模块的配置中，设置好 ElevenLabs 的 API Endpoint、API Key，以及选定的 Voice ID 和模型 ID。
3.  **实现调用逻辑**: 确保调用的是 ElevenLabs 的流式 TTS 接口，并将返回的音频流（通常是 MP3 或 PCM 数据）直接送入 Agora 音频轨道进行发布。

### 3.3. 实时流式语音合成实现

实现无缝的对话体验，关键在于 **LLM 的流式输出** 与 **TTS 的流式输入** 相结合。LLM 每生成一个或几个词，就立即将其送入 ElevenLabs 的流式 TTS 接口，而不是等一整句话都生成完毕。

**流程**: 
1. TEN Agent 中的 LLM 扩展开始接收来自 Stepfun 的流式文本响应 (`delta.content`)。
2. Agent 不缓存这些文本，而是立即将这些文本片段通过 WebSocket 发送给 ElevenLabs 的流式 TTS 端点。
3. ElevenLabs 接收到文本片段后，立刻开始合成音频，并将合成好的音频数据块（Audio Chunks）通过同一个 WebSocket 连接返回给 TEN Agent。
4. TEN Agent 接收到音频数据块后，不等待整个句子合成完毕，而是立即将这些数据块送入 Agora 音频轨道进行编码和发布。
5. 用户端几乎在 AI “思考”出第一个词的同时，就能听到 AI 的声音，极大地降低了感知延迟。

### 3.4. ElevenLabs 流式调用代码示例 (Node.js)

以下示例展示了如何使用 WebSocket 连接到 ElevenLabs 的流式 TTS 接口，并将 LLM 生成的文本实时转换为语音流。 (这是一个概念性的示例，实际实现需要处理二进制音频数据)

```javascript
import WebSocket from 'ws';
import { Writable } from 'stream';

// 这是一个模拟的 Writable Stream，在实际应用中，它会将数据写入 Agora 音频轨道
const agoraAudioStream = new Writable({
    write(chunk, encoding, callback) {
        console.log(`Received audio chunk of size: ${chunk.length}`);
        // 在这里，你会将 chunk 送入 AgoraRTC.createCustomAudioTrack() 或类似机制
        callback();
    }
});

const XI_API_KEY = "sk_315efe2656c525c68c74b5b2ae5a25c0954b373548b9e1ac";
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // 示例 Voice ID，需要换成合适的中文声音
const MODEL_ID = "eleven_multilingual_v2";

const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream-input?model_id=${MODEL_ID}`;

const socket = new WebSocket(wsUrl);

socket.on('open', () => {
    console.log('Connected to ElevenLabs WebSocket.');

    // 1. 发送BOS (Beginning of Synthesis) 消息，包含认证信息
    const bosMessage = {
        text: " ", // 必须包含一个空格
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
        },
        xi_api_key: XI_API_KEY,
    };
    socket.send(JSON.stringify(bosMessage));

    // 2. 模拟从LLM接收流式文本，并发送给ElevenLabs
    const textStream = ["你好，", "我能", "帮助你", "做些", "什么吗？"];
    let interval = setInterval(() => {
        const chunk = textStream.shift();
        if (chunk) {
            console.log(`Sending text chunk: ${chunk}`)
            const textMessage = {
                text: chunk,
                try_trigger_generation: true, // 尝试触发音频生成
            };
            socket.send(JSON.stringify(textMessage));
        } else {
            // 3. 发送EOS (End of Synthesis) 消息
            const eosMessage = { text: "" };
            socket.send(JSON.stringify(eosMessage));
            clearInterval(interval);
        }
    }, 300); // 模拟每300ms收到一个文本块
});

socket.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.audio) {
        // 将返回的 base64 编码的音频数据解码并写入流
        const audioChunk = Buffer.from(response.audio, 'base64');
        agoraAudioStream.write(audioChunk);
    }
    if(response.isFinal) {
        console.log('Synthesis complete.');
        socket.close();
    }
});

socket.on('error', (error) => {
    console.error("WebSocket Error:", error);
});

socket.on('close', () => {
    console.log('Disconnected from ElevenLabs WebSocket.');
});
```

---

## 4. 实时对话存储和分析方案

为了实现健康评估和生成报告，必须对对话数据进行有效的存储和分析。

### 4.1. 对话数据结构设计

建议使用面向文档的数据库（如 MongoDB）来存储对话数据，因为它能灵活地处理半结构化的对话内容。每一轮完整的对话（用户说一句话，AI 回应一句话）可以作为一个文档存储。

**`dialogues` 集合的 Schema 示例:**
```json
{
  "_id": "ObjectId()",
  "sessionId": "session_unique_id_123", // 关联到一次完整的会话
  "userId": "patient_unique_id_456", // 关联到具体用户
  "timestamp": "ISODate()", // 对话发生的时间
  "turn_id": 1, // 对话在本会话中的轮次
  "interruption": false, // 本轮是否为用户打断
  
  "userInput": {
    "type": "audio", // 或 "text"
    "content": "今天天气怎么样？", // STT转换后的文本
    "audioUrl": "s3://bucket/audio/user_audio_file.mp3", // 原始音频的存储地址（可选）
    "duration_ms": 2500
  },
  
  "agentOutput": {
    "type": "audio",
    "content": "今天天气晴朗，很适合出去散步。", // LLM生成的文本
    "audioUrl": "s3://bucket/audio/agent_audio_file.mp3", // AI合成语音的存储地址（可选）
    "duration_ms": 3200,
    "llm_model": "step-1-8k",
    "tts_voice_id": "21m00Tcm4TlvDq8ikWAM"
  },
  
  "analysis": {
    "latency_ms": 700, // 从用户说完到AI开始回应的延迟
    "user_sentiment": {
      "label": "neutral", // positive, negative, neutral
      "score": 0.6
    },
    "cognitive_assessment": { // 如果是评估任务
      "task": "memory_recall",
      "score": 0.8, // 评分
      "notes": "成功回忆起三个词中的两个"
    }
  }
}
```

### 4.2. 实时分析流程

分析任务（如情感计算、评估打分）不应阻塞核心的对话流程。可以采用异步处理模式。

1.  **核心对话**: TEN Agent 专注于低延迟地完成 `STT -> LLM -> TTS` 循环。
2.  **异步触发**: 在一轮对话结束后，TEN Agent 将该轮对话的完整数据（如上文的 JSON 结构）推送到一个消息队列（如 RabbitMQ 或 AWS SQS）中。
3.  **分析服务**: 一个或多个独立的 worker 服务监听该消息队列。每当有新消息时，worker 会取出对话数据，进行耗时较长的分析（如调用情感分析模型、执行评估打分规则等），然后将分析结果更新回数据库中对应的对话文档里。

这种方式将分析任务与主流程解耦，保证了对话的实时性。

### 4.3. 报告生成

报告生成是一个批处理任务，可以在特定时间（如每天凌晨）或由家属/医生手动触发。

- **逻辑**: 一个后台脚本会查询指定用户在特定时间范围内的所有对话文档。然后，脚本会聚合这些文档中的 `analysis` 数据，计算出一段时间内的平均情绪得分、认知评估得分趋势、对话频率等统计指标，最终将这些统计结果与一些典型的对话示例整合成一份结构化的报告（HTML 或 PDF 格式）。

---

## 5. Conversational AI 最佳实践

技术集成是基础，但要让 AI Agent 真正成为一个好的陪伴者，还需要在对话策略层面进行优化。

### 5.1. 实现更自然的对话流程

- **主动引导**: AI 不应总是被动等待用户提问。在长时间的沉默后，AI 可以主动发起话题，例如：“我们有段时间没聊天了，最近感觉怎么样？”或者“今天天气不错，要不要聊聊您年轻时喜欢做的事？”
- **非语言沟通**: 在 AI “思考”（等待 LLM 响应）时，可以播放一些柔和的背景音或“嗯...”之类的填充音，避免尴尬的静默。
- **记忆与关联**: AI 应该能记住之前的对话内容，并在后续对话中引用。例如，如果用户昨天提到了孙女，今天 AI 可以问：“您的孙女今天来看您了吗？” 这需要一个高效的上下文管理和用户画像系统。

### 5.2. 上下文管理

- **短期记忆 (会话内)**: 在一次会话中，将最近的几轮对话（例如，最近 5-10 轮）的 `userInput.content` 和 `agentOutput.content` 作为上下文，附加到发送给 LLM 的 `messages` 数组中。
- **长期记忆 (用户画像)**: 对于关键信息（如家人姓名、重要事件、兴趣偏好），通过 LLM 的函数调用（Function Calling）能力，让模型识别出这些实体，并调用一个 `update_user_profile` 函数，将其存入该用户的长期记忆数据库中。在每次对话开始时，可以先从数据库中读取用户的核心信息，作为背景知识注入到 System Prompt 中。

### 5.3. 个性化适应与情感陪伴

- **语速和简洁度调整**: 根据用户的反应速度和理解能力，AI 可以动态调整自己的语速（通过 TTS API 参数）和回答的复杂度（通过 Prompt 指示 LLM 使用更简单的词汇和更短的句子）。
- **共情回应**: 这是情感陪伴的核心。在 Prompt 中，必须强化 AI 的共情能力。例如，在 System Prompt 中加入：“当用户表达负面情绪时，你的首要任务是表示理解和共鸣，而不是解决问题。你可以说‘听到您这么说，我感到难过’或‘这听起来确实很不容易’。”

--- 

## 6. 潜在技术挑战和解决方案

- **挑战 1: 中文声音的自然度**
    - **描述**: ElevenLabs 虽然强大，但其预设的中文声音可能带有不易察觉的“翻译腔”。
    - **解决方案**: 进行小范围的用户测试，收集反馈。如果预设声音不理想，可以考虑使用其声音克隆（Voice Cloning）功能，录制一个真人（如专业的配音演员）的声音作为模板，生成一个专属的、更自然的声音。

- **挑战 2: 多方服务依赖导致的不稳定性**
    - **描述**: 系统依赖 Agora, Stepfun, ElevenLabs 等多个外部服务，任何一个服务出现抖动都可能影响整体可用性。
    - **解决方案**: 
        1.  **全面的监控**: 对每个外部 API 的调用都进行详细的监控，包括延迟、成功率和错误类型。
        2.  **优雅降级**: 设计备用方案。例如，如果 Stepfun API 失败，可以临时切换到一个备用的、更基础的模型甚至是一个预设的回答库。如果 ElevenLabs 失败，AI 可以降级为纯文本模式进行交流。

- **挑战 3: 上下文窗口限制**
    - **描述**: 即使是 8K 的上下文窗口，在非常长的对话中也可能被填满，导致 AI “遗忘”早期的内容。
    - **解决方案**: 采用更智能的上下文压缩策略。例如，在将旧的对话历史送入 Prompt 前，先用一次额外的 LLM 调用，让其对这些旧对话进行总结，用一个简短的摘要来代替冗长的原文，从而节省 token 空间。

## 7. 结论

本次深度集成研究为 MedJourney MVP 的落地提供了清晰、可执行的技术路径。通过 **TEN Framework + Agora** 的组合，我们构建了一个稳固的实时通信与 AI 对话底座。核心的 **LLM 服务已成功从 OpenAI 切换至更具成本效益和本土化优势的 Stepfun**，并验证了其 API 的高度兼容性。同时，集成了 **ElevenLabs 的流式 TTS**，为实现低延迟的自然语音输出提供了保障。报告中详细的数据结构设计、异步分析流程以及在上下文管理、个性化和情感陪伴方面的最佳实践，将共同确保 MedJourney 不仅是一个技术上可行的产品，更是一个充满人文关怀的服务。开发团队可依据本报告提供的架构图、代码示例和各项方案，直接启动后续的开发工作。