// 简化的测试服务器启动脚本
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动MedJourney测试服务器...');

// 使用ts-node运行测试服务器
const child = spawn('npx', ['ts-node', 'src/test-server.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`🏁 服务器退出，代码: ${code}`);
  process.exit(code);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在关闭服务器...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  child.kill('SIGTERM');
}); 