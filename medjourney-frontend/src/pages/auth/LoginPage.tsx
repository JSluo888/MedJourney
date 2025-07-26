import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth, useMockAuth } from '../../hooks/useAuth';
import { APP_CONFIG } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';

interface LoginForm {
  email: string;
  password: string;
  role: 'patient' | 'family' | 'doctor';
}

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { mockLogin } = useMockAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    role: 'patient'
  });
  const [error, setError] = useState<string>('');
  const [showMockLogin, setShowMockLogin] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // 清除错误信息
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('请填写邮箱和密码');
      return;
    }
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    }
  };
  
  const handleMockLogin = () => {
    try {
      mockLogin(formData.role);
      window.location.reload(); // 刷新页面以触发认证状态更新
    } catch (err: any) {
      setError('模拟登录失败');
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* 左侧 - 品牌介绍 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">{APP_CONFIG.NAME}</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              AI陪伴式
              <br />
              健康管理平台
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              为 Alzheimer's 患者提供智能对话、情感陪伴和专业健康评估
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-1">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI智能对话</h3>
                <p className="text-blue-100 text-sm">基于 TEN Framework 的多模态对话，支持语音、文本和图像交互</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-1">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">实时情感分析</h3>
                <p className="text-blue-100 text-sm">实时分析情绪状态，提供个性化的陪伴和关怀</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-1">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">专业健康报告</h3>
                <p className="text-blue-100 text-sm">生成详细的健康评估报告，为医生和家属提供科学依据</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white bg-opacity-5 rounded-full translate-y-32 -translate-x-32"></div>
      </div>
      
      {/* 右侧 - 登录表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
        <div className="max-w-md w-full">
          {/* 移动端 Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{APP_CONFIG.NAME}</span>
            </div>
            <p className="text-gray-600">欢迎回来</p>
          </div>
          
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h2>
            <p className="text-gray-600">请登录您的账户继续使用</p>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户角色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户类型
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="patient">患者</option>
                <option value="family">家属</option>
                <option value="doctor">医生</option>
              </select>
            </div>
            
            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
            
            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入密码"
                />
              </div>
            </div>
            
            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white',
                'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                'transition-all duration-150',
                isLoading && 'opacity-75 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                '登录'
              )}
            </button>
          </form>
          
          {/* 开发模式 - 快速登录 */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">开发模式</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowMockLogin(!showMockLogin)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showMockLogin ? '隐藏' : '显示'}快速登录
              </button>
              
              {showMockLogin && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-3">
                    开发模式：可以使用以下按钮快速登录体验不同角色
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setFormData(prev => ({ ...prev, role: 'patient' })); handleMockLogin(); }}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                    >
                      以患者身份登录
                    </button>
                    <button
                      onClick={() => { setFormData(prev => ({ ...prev, role: 'family' })); handleMockLogin(); }}
                      className="w-full text-left px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded text-green-800 transition-colors"
                    >
                      以家属身份登录
                    </button>
                    <button
                      onClick={() => { setFormData(prev => ({ ...prev, role: 'doctor' })); handleMockLogin(); }}
                      className="w-full text-left px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded text-purple-800 transition-colors"
                    >
                      以医生身份登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 底部链接 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
              继续使用即表示同意我们的{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-700 underline">
                服务条款
              </Link>
              {' '}和{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                隐私政策
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
