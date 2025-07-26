// 简单的测试脚本来验证功能
console.log('开始测试病史助手功能...');

// 模拟测试数据
const testData = {
  messages: [
    { id: '1', role: 'user', content: '我最近经常头痛，特别是下午的时候，有高血压病史，正在服用硝苯地平', timestamp: new Date().toISOString() },
    { id: '2', role: 'assistant', content: '我理解您的症状。头痛可能是高血压控制不佳的表现。', timestamp: new Date().toISOString() },
    { id: '3', role: 'user', content: '我父亲也有高血压，我每天按时吃药，但血压还是有点高', timestamp: new Date().toISOString() }
  ],
  apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJNZWRqb3VybmV5IiwiVXNlck5hbWUiOiJNZWRqb3VybmV5IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5NDg1NjM1MTExMjI2MDAyOTUiLCJQaG9uZSI6IjEzOTAxNzYxMjk2IiwiR3JvdXBJRCI6IjE5NDg1NjM1MTExMTg0MDU5OTEiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0wNy0yNyAwNDozMDozMSIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.XCWZU3wWNp0DE_uuE53sS27RJ33hNKtvTmL4Dv31ArQ2YUpO6Cn_hUj65_JrOcw-NXkX1M6G1otGY3znzA1ken8YpUUZlIWX5t2ClWBN29472FGNSZxTTihrTUtb6QWsysITblmExacjF1UNEkN8mc1K0tR0dlo_n7E5ZhnziROmyAh9iFYwiDf9ix029-ggNTJbQW-3fqnvxtBttnTDqQ3o-0CQv3LAo3Ufy5xgLP9dgNN0XwvIVe8SDCUTiJ11GzOWtAtmsjE2C2IGw74uBfW-W2ONAb6KqVjJvQuyvya_zQ8TiDqygBXztJljnxjerHh_oMMHPDiCqxZTtEh_3Q',
  groupId: '1948563511118405991'
};

// 测试MiniMax API连接
async function testMiniMaxAPI() {
  console.log('测试MiniMax API连接...');
  
  try {
    const response = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${testData.groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'user', content: '你好，请简单回复一下' }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
        tools: [{"type": "web_search"}],
        tool_choice: "none"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('MiniMax API连接成功:', data.choices[0]?.message?.content?.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('MiniMax API连接失败:', error);
    return false;
  }
}

// 测试文件处理
function testFileProcessing() {
  console.log('测试文件处理功能...');
  
  // 创建一个模拟的File对象
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  
  // 测试文件转base64
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(mockFile);
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      console.log('文件转base64成功:', base64.substring(0, 20) + '...');
      resolve(true);
    };
    reader.onerror = () => {
      console.error('文件转base64失败');
      resolve(false);
    };
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('=== 开始运行所有测试 ===');
  
  const results = {
    minimaxAPI: false,
    fileProcessing: false
  };
  
  // 测试MiniMax API
  results.minimaxAPI = await testMiniMaxAPI();
  
  // 测试文件处理
  results.fileProcessing = await testFileProcessing();
  
  console.log('=== 测试结果 ===');
  console.log('MiniMax API:', results.minimaxAPI ? '✅ 成功' : '❌ 失败');
  console.log('文件处理:', results.fileProcessing ? '✅ 成功' : '❌ 失败');
  
  if (results.minimaxAPI && results.fileProcessing) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️ 部分测试失败，请检查相关功能');
  }
}

// 执行测试
runAllTests().catch(console.error); 