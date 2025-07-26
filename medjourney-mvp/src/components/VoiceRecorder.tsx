import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTenFramework, UseTenFrameworkOptions } from '../hooks/useTenFramework';

export interface VoiceRecorderProps {
  userId: string;
  onMessage?: (message: any) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  userId,
  onMessage,
  onStatusChange,
  className = ''
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const tenOptions: UseTenFrameworkOptions = {
    userId,
    autoConnect: true,
    onMessage,
    onStatusChange
  };
  
  const {
    isConnected,
    isRecording,
    status,
    error,
    connect,
    disconnect,
    startVoiceRecording,
    stopVoiceRecording
  } = useTenFramework(tenOptions);
  
  // 模拟音频电平
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader className="w-5 h-5 animate-spin" />;
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'listening':
        return <Mic className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 animate-spin text-yellow-500" />;
      case 'speaking':
        return <Volume2 className="w-5 h-5 text-purple-500" />;
      case 'disconnected':
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'connecting': return '连接中...';
      case 'connected': return '已连接';
      case 'listening': return '正在聆听';
      case 'processing': return '处理中...';
      case 'speaking': return 'AI正在说话';
      case 'disconnected': return '未连接';
      default: return '未知状态';
    }
  };
  
  const handleRecordToggle = async () => {
    try {
      if (isRecording) {
        await stopVoiceRecording();
      } else {
        await startVoiceRecording();
      }
    } catch (error) {
      console.error('Recording toggle failed:', error);
    }
  };
  
  const handleReconnect = async () => {
    try {
      await disconnect();
      await connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* 状态指示器 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
        
        {!isConnected && (
          <button
            onClick={handleReconnect}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            重新连接
          </button>
        )}
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error.message}</p>
        </div>
      )}
      
      {/* 音频电平指示器 */}
      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">音频电平</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* 录音控制 */}
      <div className="flex justify-center">
        <button
          onClick={handleRecordToggle}
          disabled={!isConnected || status === 'processing'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {status === 'processing' ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>
      
      {/* 操作提示 */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {isConnected
            ? isRecording
              ? '点击停止录音'
              : '点击开始录音'
            : '请等待连接...'}
        </p>
      </div>
      
      {/* 语音质量提示 */}
      {isConnected && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 语音质量提示
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 请在安静的环境中使用</li>
            <li>• 说话时保持正常语速</li>
            <li>• 距离麦克风约15-30厘米</li>
            <li>• 可以随时打断AI回复</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;