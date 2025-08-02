Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // 获取请求数据
        const requestData = await req.json();
        const { message, conversationHistory = [], userId = 'anonymous' } = requestData;

        if (!message) {
            throw new Error('消息内容不能为空');
        }

        // 获取环境变量中的API密钥
        const stepfunApiKey = Deno.env.get('STEPFUN_API_KEY');
        const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

        if (!stepfunApiKey) {
            throw new Error('Stepfun API密钥未配置');
        }

        // 构建对话上下文
        const systemPrompt = `你是一个专业、温暖的AI医疗陪伴助手，专门为阿尔茨海默病患者提供陪伴和支持。

请遵循以下原则：
1. 使用温和、亲切、易懂的语言
2. 保持积极乐观的态度
3. 提供情感支持和陪伴
4. 避免复杂的医学术语
5. 鼓励患者分享感受和回忆
6. 如涉及具体医疗问题，建议咨询专业医生
7. 回复应该简洁明了，便于理解

请用中文回复，语气要亲切自然。`;

        // 构建消息历史
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(msg => ({
                role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
                content: msg.content || msg.text
            })),
            { role: 'user', content: message }
        ];

        // 调用Stepfun AI API
        const stepfunResponse = await fetch('https://api.stepfun.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stepfunApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'step-1-8k',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!stepfunResponse.ok) {
            const errorText = await stepfunResponse.text();
            console.error('Stepfun API错误:', errorText);
            throw new Error(`AI服务响应错误: ${stepfunResponse.status}`);
        }

        const stepfunData = await stepfunResponse.json();
        const aiResponse = stepfunData.choices?.[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('AI服务返回空响应');
        }

        // 语音合成（如果提供了ElevenLabs API密钥）
        let audioUrl = null;
        if (elevenLabsApiKey && aiResponse.length <= 1000) {
            try {
                const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
                    method: 'POST',
                    headers: {
                        'xi-api-key': elevenLabsApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: aiResponse,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.5
                        }
                    })
                });

                if (ttsResponse.ok) {
                    const audioBlob = await ttsResponse.arrayBuffer();
                    // 这里我们返回base64编码的音频数据
                    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
                    audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
                }
            } catch (ttsError) {
                // 语音合成失败不影响文本响应
            }
        }

        // 返回成功响应
        const responseData = {
            data: {
                message: aiResponse,
                audioUrl: audioUrl,
                timestamp: new Date().toISOString(),
                userId: userId,
                conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
        };

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI对话服务错误:', error);

        const errorResponse = {
            error: {
                code: 'AI_CONVERSATION_ERROR',
                message: error.message || '服务暂时不可用，请稍后重试'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});