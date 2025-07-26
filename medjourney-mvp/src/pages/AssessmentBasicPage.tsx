import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Calendar, 
  Stethoscope, 
  Clock, 
  AlertTriangle, 
  Users,
  Pill,
  MessageSquare,
  Save
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { BasicAssessment } from '../types';
import { ROUTES } from '../constants';

const AssessmentBasicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [formData, setFormData] = useState<BasicAssessment>({
    patientName: user?.name || '',
    age: user?.age || 65,
    gender: 'female',
    symptoms: [],
    duration: '',
    severity: 'mild',
    familyHistory: false,
    medications: [],
    concerns: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentMedication, setCurrentMedication] = useState('');

  const commonSymptoms = [
    '记忆力下降', '时常迷路', '忘记熟悉的人名', '难以完成日常任务',
    '语言表达困难', '判断力下降', '情绪变化', '社交退缩',
    '睡眠问题', '食欲变化', '重复询问相同问题', '物品放错地方'
  ];

  const durationOptions = [
    '1-3个月', '3-6个月', '6个月-1年', '1-2年', '2年以上'
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
    
    // 清除症状相关的错误
    if (errors['symptoms']) {
      const { symptoms, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handleAddMedication = () => {
    if (currentMedication.trim() && !formData.medications.includes(currentMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, currentMedication.trim()]
      }));
      setCurrentMedication('');
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m !== medication)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = '请输入患者姓名';
    }

    if (formData.age < 18 || formData.age > 120) {
      newErrors.age = '请输入有效的年龄（18-120岁）';
    }

    if (formData.symptoms.length === 0) {
      newErrors.symptoms = '请至少选择一个症状';
    }

    if (!formData.duration) {
      newErrors.duration = '请选择症状持续时间';
    }

    if (!formData.concerns.trim()) {
      newErrors.concerns = '请描述您的主要担心或问题';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // 这里应该保存数据到状态管理或后端
      console.log('基础评估数据:', formData);
      
      // 导航到下一个阶段
      navigate(ROUTES.ASSESSMENT_CASE);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(ROUTES.ASSESSMENT)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回评估首页</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              第1步：基础问卷
            </div>
          </div>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            基础信息收集
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            请填写以下基础信息，帮助我们更好地了解患者的基本情况和症状表现
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* 患者基本信息 */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">患者基本信息</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  患者姓名 *
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['patientName'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入患者的真实姓名"
                />
                {errors['patientName'] && (
                  <p className="mt-2 text-sm text-red-600">{errors['patientName']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年龄 *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['age'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="18"
                  max="120"
                />
                {errors['age'] && (
                  <p className="mt-2 text-sm text-red-600">{errors['age']}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                性别 *
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'male', label: '男性' },
                  { value: 'female', label: '女性' },
                  { value: 'other', label: '其他' }
                ].map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 症状信息 */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <Stethoscope className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">症状表现</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                请选择患者出现的症状 * （可多选）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonSymptoms.map(symptom => (
                  <label
                    key={symptom}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      formData.symptoms.includes(symptom)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{symptom}</span>
                  </label>
                ))}
              </div>
              {errors['symptoms'] && (
                <p className="mt-2 text-sm text-red-600">{errors['symptoms']}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  症状持续时间 *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['duration'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">请选择持续时间</option>
                  {durationOptions.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
                {errors['duration'] && (
                  <p className="mt-2 text-sm text-red-600">{errors['duration']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  症状严重程度 *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mild">轻微（偶尔出现，影响不大）</option>
                  <option value="moderate">中等（经常出现，影响日常生活）</option>
                  <option value="severe">严重（持续出现，严重影响生活）</option>
                </select>
              </div>
            </div>
          </div>

          {/* 家族史和用药情况 */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">家族史和用药情况</h2>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.familyHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, familyHistory: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">
                  家族中有认知障碍或阿尔茨海默病病史
                </span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                当前用药情况
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={currentMedication}
                  onChange={(e) => setCurrentMedication(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入药物名称后点击添加"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
                />
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
              
              {formData.medications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medications.map(medication => (
                    <span
                      key={medication}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <Pill className="w-3 h-3 mr-1" />
                      {medication}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(medication)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 主要担心和问题 */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">主要担心和问题</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请详细描述您最担心的问题或希望AI帮助解决的困扰 *
              </label>
              <textarea
                value={formData.concerns}
                onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors['concerns'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如：最近经常忘记重要的事情，担心是否是认知障碍的早期征象..."
              />
              {errors['concerns'] && (
                <p className="mt-2 text-sm text-red-600">{errors['concerns']}</p>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(ROUTES.ASSESSMENT)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回上一步</span>
            </button>
            
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>保存并继续</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentBasicPage;