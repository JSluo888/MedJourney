import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Camera, 
  FileText, 
  Image as ImageIcon, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { CaseAssessment, CaseImage } from '../types';
import { ROUTES } from '../constants';
import { assessmentService } from '../services/assessment-service';

const AssessmentCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [formData, setFormData] = useState<CaseAssessment>({
    description: '',
    images: [],
    medicalRecords: [],
    additionalNotes: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState('');

  const imageTypes = [
    { value: 'scan', label: 'CT/MRI扫描', icon: FileText },
    { value: 'photo', label: '日常照片', icon: Camera },
    { value: 'document', label: '医疗文档', icon: FileText }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isImage && isValidSize;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: CaseImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: e.target?.result as string,
          description: '',
          type: 'photo',
          uploadedAt: new Date()
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const addMedicalRecord = () => {
    if (currentRecord.trim() && !formData.medicalRecords.includes(currentRecord.trim())) {
      setFormData(prev => ({
        ...prev,
        medicalRecords: [...prev.medicalRecords, currentRecord.trim()]
      }));
      setCurrentRecord('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.description.trim()) {
      newErrors.description = '请提供症状的详细描述';
    }

    if (formData.images.length === 0 && 
        formData.medicalRecords.length === 0 && 
        !formData.additionalNotes.trim()) {
      newErrors.content = '请至少提供一张图片、一条病历记录或附加说明';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // 提交病例评估数据
        await assessmentService.submitCaseAssessment(formData);
        
        // 保存会话到本地存储
        assessmentService.saveSessionToStorage();
        
        console.log('病例资料数据已保存:', formData);
        navigate(ROUTES.ASSESSMENT_CHAT);
      } catch (error) {
        console.error('保存病例资料失败:', error);
        // 这里可以添加错误提示UI
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(ROUTES.ASSESSMENT_BASIC)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回上一步</span>
          </button>
          
          <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
            第2步：病例资料
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            病例资料上传
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            请上传相关的医疗图片或详细描述症状表现，这将帮助AI更准确地分析病情
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              症状详细描述
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请详细描述患者的症状表现和行为变化 *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如：患者最近经常忘记刚才做过的事情..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ImageIcon className="w-6 h-6 text-blue-600 mr-3" />
              医疗图片上传
            </h2>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    拖拽图片到这里或点击上传
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG, PNG, GIF 格式，单个文件不超过 10MB
                  </p>
                </div>
                <label className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                  选择文件
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  已上传的图片 ({formData.images.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.images.map(image => (
                    <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <img 
                            src={image.url} 
                            alt="预览" 
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                            onClick={() => setPreviewImage(image.url)}
                          />
                          <button
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex-1">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              图片类型
                            </label>
                            <select
                              value={image.type}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.map(img => 
                                    img.id === image.id ? { ...img, type: e.target.value as any } : img
                                  )
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {imageTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              图片说明
                            </label>
                            <input
                              type="text"
                              value={image.description}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.map(img => 
                                    img.id === image.id ? { ...img, description: e.target.value } : img
                                  )
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="请简要说明这张图片的内容"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              相关医疗记录
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                添加医疗记录或诊断结果
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentRecord}
                  onChange={(e) => setCurrentRecord(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：2024年3月CT检查显示轻度脑萎缩"
                  onKeyPress={(e) => e.key === 'Enter' && addMedicalRecord()}
                />
                <button
                  type="button"
                  onClick={addMedicalRecord}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
            
            {formData.medicalRecords.length > 0 && (
              <div className="space-y-2">
                {formData.medicalRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-700">{record}</span>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          medicalRecords: prev.medicalRecords.filter(r => r !== record)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              附加说明
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                其他需要说明的情况（可选）
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="例如：患者对某些药物过敏..."
              />
            </div>
          </div>

          {errors.content && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700">{errors.content}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(ROUTES.ASSESSMENT_BASIC)}
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
        
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
            <div className="max-w-4xl max-h-full p-4">
              <img 
                src={previewImage} 
                alt="预览" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentCasePage;