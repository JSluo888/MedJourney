import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  History, 
  MessageCircle, 
  Users, 
  Stethoscope,
  Heart,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants';

const Sidebar: React.FC = () => {
  const { user, setUser } = useAppStore();
  
  const navigationItems = [
    {
      name: '主页',
      href: ROUTES.HOME,
      icon: Home,
      color: 'text-blue-600'
    },
    {
      name: '病史助手',
      href: ROUTES.HISTORY,
      icon: History,
      color: 'text-green-600'
    },
    {
      name: 'AI陪伴对话',
      href: ROUTES.CHAT,
      icon: MessageCircle,
      color: 'text-purple-600'
    },
    {
      name: '家属简报',
      href: ROUTES.FAMILY_SUMMARY,
      icon: Users,
      color: 'text-orange-600'
    },
    {
      name: '医生仪表板',
      href: ROUTES.DOCTOR,
      icon: Stethoscope,
      color: 'text-red-600'
    },
  ];
  
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="bg-white shadow-xl w-64 min-h-screen flex flex-col">
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MedJourney</h1>
            <p className="text-sm text-gray-500">智能伴侣</p>
          </div>
        </div>
      </div>
      
      {/* 用户信息 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name || '未知用户'}</p>
            <p className="text-sm text-gray-500">患者</p>
          </div>
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${item.color}`} />
              <span className="font-medium text-lg">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      {/* 退出按钮 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-lg">退出</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;