import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const Header: React.FC = () => {
  const { user, healthScore } = useAppStore();
  
  // 获取当前时间问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧问候 */}
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreeting()}，{user?.name || '您好'}！
            </h2>
            <p className="text-gray-600">今天您感觉怎么样？</p>
          </div>
          
          {/* 健康评分快速显示 */}
          {healthScore && (
            <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">今日健康评分</p>
              <p className="text-2xl font-bold text-green-600">{healthScore.overall}/100</p>
            </div>
          )}
        </div>
        
        {/* 右侧操作 */}
        <div className="flex items-center space-x-4">
          {/* 通知铃铛 */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          {/* 设置 */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Settings className="w-6 h-6" />
          </button>
          
          {/* 用户头像 */}
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;