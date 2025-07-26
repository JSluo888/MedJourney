import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Brain,
  Calendar,
  MessageCircle,
  ArrowRight,
  Play,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText
} from 'lucide-react';
import { VIRTUAL_PATIENTS, ROUTES } from '../constants';
import { VirtualPatient } from '../types';
import { useAppStore } from '../stores/useAppStore';

const VirtualPatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [selectedPatient, setSelectedPatient] = useState<VirtualPatient | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'dialogue' | 'history'>('overview');

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'early': return 'bg-green-100 text-green-800';
      case 'middle': return 'bg-yellow-100 text-yellow-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'early': return '早期';
      case 'middle': return '中期';
      case 'late': return '晚期';
      default: return '未知';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'moderate': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'severe': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const selectPatient = (patient: VirtualPatient) => {
    setUser({
      id: patient.id,
      name: patient.name,
      email: `${patient.id}@medjourney.demo`,
      age: patient.age,
      medicalHistory: patient.description,
      avatar: patient.avatar
    });
    
    // 可以导航到不同的页面
    navigate(ROUTES.HOME);
  };

  const viewPatientDetails = (patient: VirtualPatient) => {
    setSelectedPatient(patient);
    setViewMode('overview');
  };

  const startAssessment = (patient: VirtualPatient) => {
    setUser({
      id: patient.id,
      name: patient.name,
      email: `${patient.id}@medjourney.demo`,
      age: patient.age,
      medicalHistory: patient.description,
      avatar: patient.avatar
    });
    
    navigate(ROUTES.ASSESSMENT);
  };

  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedPatient(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>返回虚拟病人列表</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => selectPatient(selectedPatient)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                切换到此病人
              </button>
              <button
                onClick={() => startAssessment(selectedPatient)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                开始评估
              </button>
            </div>
          </div>

          {/* 病人头部信息 */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{selectedPatient.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(selectedPatient.stage)}`}>
                    {getStageName(selectedPatient.stage)}阶段
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{selectedPatient.age}岁</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">持续{selectedPatient.basicInfo.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(selectedPatient.basicInfo.severity)}
                    <span className="text-gray-600">
                      {selectedPatient.basicInfo.severity === 'mild' ? '轻度' :
                       selectedPatient.basicInfo.severity === 'moderate' ? '中度' : '重度'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      家族史: {selectedPatient.basicInfo.familyHistory ? '有' : '无'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed">
                  {selectedPatient.description}
                </p>
              </div>
            </div>
          </div>

          {/* 选项卡 */}
          <div className="flex space-x-2 mb-6">
            {[
              { id: 'overview', name: '概览', icon: Eye },
              { id: 'dialogue', name: '对话样例', icon: MessageCircle },
              { id: 'history', name: '病史详情', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    viewMode === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* 内容区域 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {viewMode === 'overview' && (
              <div className="space-y-8">
                {/* 症状表现 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">主要症状</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedPatient.basicInfo.symptoms.map((symptom, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <span className="text-red-700 text-sm">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 用药情况 */}
                {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">当前用药</h3>
                    <div className="space-y-2">
                      {selectedPatient.currentMedications.map((medication, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <span className="text-blue-700">{medication}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {viewMode === 'dialogue' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">对话样例</h3>
                <div className="space-y-4">
                  {selectedPatient.sampleDialogues.map((dialogue, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 ${
                        dialogue.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        dialogue.role === 'user' 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {dialogue.role === 'user' ? 
                          <MessageCircle className="w-4 h-4" /> : 
                          <Brain className="w-4 h-4" />
                        }
                      </div>
                      
                      <div className={`max-w-[80%] p-4 rounded-lg ${
                        dialogue.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="leading-relaxed">{dialogue.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {viewMode === 'history' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">详细病史</h3>
                <div className="prose max-w-none">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h4 className="font-bold text-blue-900 mb-3">病情发展时间线</h4>
                    <div className="space-y-4">
                      {selectedPatient.stage === 'early' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700">初期表现：偶尔忘记近期事件</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-700">进展：在熟悉环境中偶尔迷路</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700">目前：日常生活基本独立</span>
                          </div>
                        </>
                      )}
                      {selectedPatient.stage === 'middle' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-700">语言能力逐渐下降</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-700">需要帮助完成日常活动</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-gray-700">情绪波动增加</span>
                          </div>
                        </>
                      )}
                      {selectedPatient.stage === 'late' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-gray-700">严重记忆丧失</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            <span className="text-gray-700">无法独立生活</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-red-700 rounded-full"></div>
                            <span className="text-gray-700">需要全天候照护</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-600 leading-relaxed">
                    {selectedPatient.medicalHistory || '暂无更多详细病史记录。'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            虚拟病人档案
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            选择不同阶段的虚拟病人，体验个性化的AI陪伴服务和评估功能
          </p>
        </div>

        {/* 病人卡片列表 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {VIRTUAL_PATIENTS.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {/* 头部 */}
              <div className="bg-gradient-to-br from-blue-400 to-green-400 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{patient.name}</h3>
                    <p className="text-blue-100">{patient.age}岁</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    patient.stage === 'early' ? 'bg-green-500 bg-opacity-80' :
                    patient.stage === 'middle' ? 'bg-yellow-500 bg-opacity-80' :
                    'bg-red-500 bg-opacity-80'
                  }`}>
                    {getStageName(patient.stage)}阶段
                  </span>
                </div>
              </div>
              
              {/* 内容 */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {patient.description}
                </p>
                
                {/* 关键信息 */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">持续时间</span>
                    <span className="text-sm font-medium text-gray-700">{patient.basicInfo.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">严重程度</span>
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon(patient.basicInfo.severity)}
                      <span className="text-sm font-medium text-gray-700">
                        {patient.basicInfo.severity === 'mild' ? '轻度' :
                         patient.basicInfo.severity === 'moderate' ? '中度' : '重度'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">家族史</span>
                    <span className="text-sm font-medium text-gray-700">
                      {patient.basicInfo.familyHistory ? '有' : '无'}
                    </span>
                  </div>
                </div>
                
                {/* 主要症状 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">主要症状</h4>
                  <div className="flex flex-wrap gap-2">
                    {patient.basicInfo.symptoms.slice(0, 3).map((symptom, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
                      >
                        {symptom}
                      </span>
                    ))}
                    {patient.basicInfo.symptoms.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{patient.basicInfo.symptoms.length - 3}个
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => viewPatientDetails(patient as unknown as VirtualPatient)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => selectPatient(patient as unknown as VirtualPatient)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>开始体验</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 底部说明 */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                虚拟病人体验说明
              </h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                这些虚拟病人案例基于真实的医疗数据和临床经验构建，
                旨在帮助医疗专业人员、家属和研究人员了解不同阶段阿尔茨海默病的特点。
                您可以切换不同的虚拟病人来体验个性化的AI服务。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPatientsPage;