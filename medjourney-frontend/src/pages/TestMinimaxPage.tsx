import React, { useState, useRef } from 'react';
import minimaxService from '../services/minimax';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

const TestMinimaxPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      return file.type.startsWith('image/');
    });
    
    validFiles.forEach(file => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFile.preview = e.target?.result as string;
        setUploadedFiles(prev => [...prev, uploadedFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  // 删除文件
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const testAPI = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      setError('请输入文本或上传图片');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await minimaxService.sendMultimodalMessage(
        inputText, 
        uploadedFiles.map(f => f.file)
      );
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'API调用失败');
    } finally {
      setIsLoading(false);
    }
  };

  const testTextOnly = async () => {
    if (!inputText.trim()) {
      setError('请输入测试文本');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await minimaxService.sendMultimodalMessage(inputText, []);
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'API调用失败');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setInputText('');
    setUploadedFiles([]);
    setResponse('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MiniMax API 多模态测试</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">文本输入：</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg"
              placeholder="请输入测试文本，例如：'请分析这张医疗图像'..."
            />
          </div>

          {/* 图片上传区域 */}
          <div>
            <label className="block text-sm font-medium mb-2">图片上传：</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 w-full py-4 text-gray-600 hover:text-gray-800"
              >
                <Upload className="w-6 h-6" />
                <span>点击上传图片</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">
                支持 JPG、PNG、GIF 等格式
              </p>
            </div>
          </div>

          {/* 已上传图片预览 */}
          {uploadedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">已上传图片：</h3>
              <div className="grid grid-cols-2 gap-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {file.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={testAPI}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
            >
              {isLoading ? '测试中...' : '测试多模态API'}
            </button>
            <button
              onClick={testTextOnly}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 hover:bg-green-600"
            >
              仅文本测试
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              清空
            </button>
          </div>
        </div>

        {/* 输出区域 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">API响应：</h3>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">错误：</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {response && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">成功响应：</p>
              <div className="bg-white p-3 rounded border">
                <p className="whitespace-pre-wrap text-sm">{response}</p>
              </div>
            </div>
          )}

          {/* API信息 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">API配置信息：</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 模型：abab6.5s-chat</p>
              <p>• 支持：文本 + 图像多模态输入</p>
              <p>• 图像格式：Base64编码</p>
              <p>• 最大Token：2048</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMinimaxPage; 