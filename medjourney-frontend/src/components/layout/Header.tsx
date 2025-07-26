import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

// 页面标题映射
const pageTitles: Record<string, string> = {
  [ROUTES.HOME]: '主仪表板',
  [ROUTES.CHAT]: 'AI陪伴对话',
  [ROUTES.HISTORY]: '病史导入',
  [ROUTES.FAMILY_SUMMARY]: '家属简报',
  [ROUTES.DOCTOR]: '医生仪表板',
};

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // 获取当前页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    
    // 医生报告页面的特殊处理
    if (path.startsWith(ROUTES.DOCTOR_REPORT)) {
      return '医生详细报告';
    }
    
    return pageTitles[path] || '未知页面';
  };
  
  // 获取当前时间的问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧 - 页面信息 */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {getGreeting()}，{user?.name || '用户'}！今天的心情怎么样？
            </p>
          </div>
        </div>
        
        {/* 右侧 - 操作区域 */}
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索..."
              className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* 日期显示 */}
          <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</span>
          </div>
          
          {/* 通知按钮 */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150">
            <Bell className="h-5 w-5" />
            {/* 通知数量小红点 */}
            <span className="absolute top-1 right-1 block h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* 用户头像 */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
