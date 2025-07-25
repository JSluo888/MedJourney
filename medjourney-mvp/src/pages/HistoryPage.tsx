import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Save, 
  Plus,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

const HistoryPage: React.FC = () => {
  const { user, setIsLoading, isLoading } = useAppStore();
  const [medicalHistory, setMedicalHistory] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // 处理文件上传
  const handleFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type === 'application/pdf' || file.type.includes('document');
      return isImage || isDocument;
    });
    
    validFiles.forEach(file => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document'
      };
      
      if (uploadedFile.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev, uploadedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
    });
  }, []);
  
  // 拖放事件处理
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);
  
  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };
  
  // 删除文件
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };
  
  // 保存病史
  const handleSave = async () => {
    if (!medicalHistory.trim() && uploadedFiles.length === 0) {
      alert('请输入病史信息或上传相关文件');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里可以加入实际的保存逻辑
      console.log('保存病史:', { medicalHistory, files: uploadedFiles });
      
      alert('病史信息保存成功！');
      
      // 清空表单
      setMedicalHistory('');
      setUploadedFiles([]);
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">病史导入</h1>
          <p className="text-gray-600 mt-2">请上传您的医疗记录和相关文件，帮助 AI 更好地了解您的健康状况。</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <Calendar className="w-5 h-5" />
          <span>{new Date().toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
      
      {/* 用户信息卡片 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">ID: {user?.id}</p>
            {user?.age && <p className="text-gray-600">年龄: {user.age} 岁</p>}
          </div>
        </div>
      </div>
      
      {/* 病史信息输入 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-500" />
          病史信息
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="medical-history" className="block text-sm font-medium text-gray-700 mb-2">
              请详细描述您的病史、症状和目前的治疗情况：
            </label>
            <textarea
              id="medical-history"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
              placeholder="例如：
• 诊断时间和医院
• 目前的症状表现
• 正在服用的药物
• 既往病史和家族病史
• 生活习惯和日常护理情况"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>支持 Markdown 格式，您可以使用 **粗体** 和 *斜体* 等格式化文本。</span>
          </div>
        </div>
      </div>
      
      {/* 文件上传区域 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-green-500" />
          文件上传
        </h2>
        
        {/* 拖放上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-lg font-medium text-gray-900 mb-2">
            拖放文件到此处，或点击上传
          </p>
          <p className="text-gray-500 mb-4">
            支持 JPG、PNG、PDF 等格式，单个文件不超过 10MB
          </p>
          <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            选择文件
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">已上传的文件 ({uploadedFiles.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {file.type === 'image' && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-2">
                    {file.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.file.name}>
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 保存按钮 */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => {
            setMedicalHistory('');
            setUploadedFiles([]);
          }}
          className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          清空
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {isLoading ? '保存中...' : '保存病史'}
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;