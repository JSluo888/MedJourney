// 测试报告生成API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testReportsAPI() {
  console.log('🧪 开始测试报告生成API...\n');

  try {
    // 测试1: 生成家属简报
    console.log('📋 测试1: 生成家属简报');
    const familyReportResponse = await fetch(`${API_BASE}/reports/family-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        format: 'json',
        includeCharts: true
      })
    });

    if (familyReportResponse.ok) {
      const familyReport = await familyReportResponse.json();
      console.log('✅ 家属简报生成成功:', familyReport);
    } else {
      console.log('❌ 家属简报生成失败:', familyReportResponse.status, familyReportResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试2: 生成医生报告
    console.log('📋 测试2: 生成医生报告');
    const doctorReportResponse = await fetch(`${API_BASE}/reports/test-session-123/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        format: 'json',
        includeCharts: true,
        includeRecommendations: true
      })
    });

    if (doctorReportResponse.ok) {
      const doctorReport = await doctorReportResponse.json();
      console.log('✅ 医生报告生成成功:', doctorReport);
    } else {
      console.log('❌ 医生报告生成失败:', doctorReportResponse.status, doctorReportResponse.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试3: 获取报告列表
    console.log('📋 测试3: 获取报告列表');
    const reportsListResponse = await fetch(`${API_BASE}/reports/list/test-user-123`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    if (reportsListResponse.ok) {
      const reportsList = await reportsListResponse.json();
      console.log('✅ 报告列表获取成功:', reportsList);
    } else {
      console.log('❌ 报告列表获取失败:', reportsListResponse.status, reportsListResponse.statusText);
    }

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

// 运行测试
testReportsAPI().then(() => {
  console.log('\n🏁 API测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
}); 