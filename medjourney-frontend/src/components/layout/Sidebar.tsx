import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  FileText, 
  Heart, 
  Stethoscope,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, APP_CONFIG } from '../../utils/constants';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    name: '主页',
    href: ROUTES.HOME,
    icon: Home,
    roles: ['patient', 'family', 'doctor']
  },
  {
    name: 'AI陪伴对话',
    href: ROUTES.CHAT,
    icon: MessageCircle,
    roles: ['patient', 'family']
  },
  {
    name: '病史助手',
    href: ROUTES.HISTORY,
    icon: FileText,
    roles: ['patient', 'family']
  },
  {
    name: '家属简报',
    href: ROUTES.FAMILY_SUMMARY,
    icon: Heart,
    roles: ['family']
  },
  {
    name: '医生仪表板',
    href: ROUTES.DOCTOR,
    icon: Stethoscope,
    roles: ['doctor']
  }
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || '')
  );
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };
  
  return (
    <div className="bg-white w-64 shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo 区域 */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">{APP_CONFIG.NAME}</span>
        </div>
      </div>
      
      {/* 用户信息 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || '用户'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'patient' && '患者'}
              {user?.role === 'family' && '家属'}
              {user?.role === 'doctor' && '医生'}
            </p>
          </div>
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn(
                'mr-3 h-5 w-5 flex-shrink-0',
                isActive ? 'text-blue-700' : 'text-gray-400'
              )} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
          <Settings className="mr-3 h-5 w-5 text-gray-400" />
          设置
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut className="mr-3 h-5 w-5 text-red-500" />
          登出
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
