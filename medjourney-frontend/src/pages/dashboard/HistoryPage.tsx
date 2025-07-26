import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Check,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../utils/api';
import { formatFileSize } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // 处理文件上传
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 文件类型验证
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`不支持的文件类型: ${file.type}`);
        }
        
        // 文件大小验证 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`文件太大: ${file.name}`);
        }
        
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 模拟上传成功，创建文件记录
        const uploadedFile: UploadedFile = {
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // 在实际应用中应该是服务器返回的URL
          uploadedAt: new Date().toISOString()
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
      
      setSuccess('文件上传成功!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '文件上传失败');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  // 拖拽事件处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };
  
  // 保存病史信息
  const handleSave = async () => {
    if (!medicalHistory.trim() && uploadedFiles.length === 0) {
      setError('请至少填写病史信息或上传文件');
      return;
    }
    
    setError('');
    setIsSaving(true);
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 在实际应用中，这里应该调用API保存数据
      // await ApiService.savePatientHistory({
      //   medicalHistory,
      //   files: uploadedFiles
      // });
      
      setSuccess('病史信息保存成功!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">病史导入</h1>
            <p className="text-gray-600">上传你的医疗文档和相关资料，帮助AI更好地了解你的健康状态</p>
          </div>
        </div>
        
        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">隐私保护承诺</p>
              <p>您的所有医疗信息都将被加密存储，仅用于为您提供更好的AI服务。我们严格遵守医疗数据保护法规。</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 错误和成功提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800">{success}</span>
        </div>
      )}
      
      {/* 病史信息输入 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">病史信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请详细描述您的病史、症状、用药情况等
            </label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="例如：&#10;- 诊断时间：2023年3月&#10;- 主要症状：记忆力下降、定向障碍&#10;- 当前用药：多奈哌齐 5mg 每日一次&#10;- 家族史：父亲有痴呆病史&#10;- 其他相关信息..."
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>建议包含以下信息：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>诊断时间和诊断结果</li>
              <li>主要症状和表现</li>
              <li>目前正在使用的药物</li>
              <li>家族病史</li>
              <li>生活习惯和日常护理</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">相关文档上传</h2>
        
        {/* 上传区域 */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-150 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <div>
                <p className="text-sm font-medium text-gray-900">正在上传...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  拖拽文件到此处，或
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 mx-1"
                  >
                    点击选择
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  支持 PDF、图片 (JPG, PNG, GIF) 和文本文件，单个文件最大 10MB
                </p>
              </div>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.txt"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
        
        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">已上传文件 ({uploadedFiles.length})</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 保存按钮 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">保存病史信息</h3>
            <p className="text-sm text-gray-600">保存后，AI将能够更好地了解您的健康状态并提供个性化建议</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || (!medicalHistory.trim() && uploadedFiles.length === 0)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-150 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>保存信息</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
