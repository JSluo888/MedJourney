import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Heart, User, Lock, ArrowRight } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const { user, setUser, setIsLoading, isLoading } = useAppStore();
  
  // 如果已登录，重定向到主页
  if (user) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('请输入您的姓名');
      return;
    }
    
    setIsLoading(true);
    
    // 模拟登录延迟
    setTimeout(() => {
      const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: `${name.trim().toLowerCase()}@medjourney.com`,
        age: age ? parseInt(age) : undefined,
      };
      
      setUser(newUser);
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MedJourney</h1>
          <p className="text-lg text-gray-600">智能医疗伴侣系统</p>
          <p className="text-gray-500 mt-2">为 Alzheimer's 患者提供温暖的 AI 陪伴</p>
        </div>
        
        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">欢迎使用</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 姓名输入 */}
            <div>
              <label htmlFor="name" className="flex items-center text-lg font-medium text-gray-700 mb-3">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                您的姓名
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入您的姓名"
                required
              />
            </div>
            
            {/* 年龄输入 */}
            <div>
              <label htmlFor="age" className="flex items-center text-lg font-medium text-gray-700 mb-3">
                <Lock className="w-5 h-5 mr-2 text-green-500" />
                您的年龄（可选）
              </label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="请输入您的年龄"
                min="1"
                max="120"
              />
            </div>
            
            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white text-xl font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  开始体验
                  <ArrowRight className="w-6 h-6 ml-2" />
                </>
              )}
            </button>
          </form>
          
          {/* 功能介绍 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">主要功能：</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                AI 语音陪伴对话
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                健康状态监测
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                家属简报生成
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                医学数据分析
              </li>
            </ul>
          </div>
        </div>
        
        {/* 底部信息 */}
        <div className="text-center mt-8 text-gray-500">
          <p>本系统专为 Alzheimer's 患者设计</p>
          <p>使用前请咨询医生意见</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;