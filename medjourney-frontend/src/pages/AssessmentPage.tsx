import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  MessageCircle,
  Clock,
  User,
  Brain
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { AssessmentData } from '../types';
import { ROUTES, ASSESSMENT_STAGES } from '../constants';

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [currentStage, setCurrentStage] = useState<'basic' | 'case' | 'chat'>('basic');
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    stage: 'basic',
    completed: false
  });

  const stages = [
    {
      id: 'basic',
      name: '基础问卷',
      description: '收集患者基本信息和症状描述',
      icon: FileText,
      estimatedTime: '5-8分钟',
      route: ROUTES.ASSESSMENT_BASIC
    },
    {
      id: 'case', 
      name: '病例资料',
      description: '上传相关医疗图片或详细症状描述',
      icon: ImageIcon,
      estimatedTime: '3-5分钟',
      route: ROUTES.ASSESSMENT_CASE
    },
    {
      id: 'chat',
      name: '智能对话',
      description: '基于前面信息进行AI辅助问诊对话',
      icon: MessageCircle,
      estimatedTime: '10-15分钟', 
      route: ROUTES.ASSESSMENT_CHAT
    }
  ];

  const handleStageClick = (stageId: string, route: string) => {
    setCurrentStage(stageId as 'basic' | 'case' | 'chat');
    navigate(route);
  };

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === currentStage);
  };

  const isStageCompleted = (stageId: string) => {
    switch (stageId) {
      case 'basic':
        return !!assessmentData.basicInfo;
      case 'case':
        return !!assessmentData.caseInfo;
      case 'chat':
        return !!assessmentData.chatData;
      default:
        return false;
    }
  };

  const isStageAccessible = (stageIndex: number) => {
    // 第一个阶段总是可访问的
    if (stageIndex === 0) return true;
    // 只有前一个阶段完成了才能访问下一个阶段
    return isStageCompleted(stages[stageIndex - 1].id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI智能问诊评估
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            我们将通过三个阶段来全面了解患者情况，为您提供个性化的AI陪伴服务
          </p>
        </div>

        {/* 进度指示器 */}
        <div className="flex items-center justify-center mb-12">
          {stages.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.id);
            const isCurrent = stage.id === currentStage;
            const isAccessible = isStageAccessible(index);
            
            return (
              <React.Fragment key={stage.id}>
                <div className={`flex flex-col items-center ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                     onClick={() => isAccessible && handleStageClick(stage.id, stage.route)}>
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : isAccessible
                          ? 'bg-white border-gray-300 text-gray-400 hover:border-blue-400'
                          : 'bg-gray-100 border-gray-200 text-gray-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <stage.icon className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <h3 className={`font-semibold ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {stage.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {stage.estimatedTime}
                    </p>
                  </div>
                </div>
                
                {/* 连接线 */}
                {index < stages.length - 1 && (
                  <div className={`flex-1 h-1 mx-8 rounded ${
                    isStageCompleted(stage.id) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 阶段卡片 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {stages.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.id);
            const isCurrent = stage.id === currentStage;
            const isAccessible = isStageAccessible(index);
            
            return (
              <div
                key={stage.id}
                className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl ${
                  isCurrent ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                } ${
                  isAccessible ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => isAccessible && handleStageClick(stage.id, stage.route)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-lg ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600'
                      : isCurrent 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    <stage.icon className="w-6 h-6" />
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {stage.name}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {stage.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  预计用时：{stage.estimatedTime}
                </div>
                
                {isAccessible && (
                  <div className="mt-6">
                    <button className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : isCurrent
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                      {isCompleted ? '重新完成' : isCurrent ? '继续完成' : '开始'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部说明 */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                隐私保护声明
              </h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                您提供的所有信息都将严格保密，仅用于AI系统分析和提供个性化服务。
                我们承诺不会将您的个人医疗信息用于任何其他用途。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;