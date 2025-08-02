import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Brain, 
  Heart, 
  Clock, 
  CheckCircle,
  Volume2,
  VolumeX,
  MessageCircle,
  User,
  Bot,
  Loader
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Message, CognitiveTest, EmotionalAnalysis } from '../types';
import { ROUTES } from '../constants';

const AssessmentChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<'greeting' | 'cognitive' | 'emotional' | 'summary'>('greeting');
  const [cognitiveTests, setCognitiveTests] = useState<CognitiveTest[]>([]);
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<EmotionalAnalysis | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  const cognitiveQuestions = [
    { type: 'orientation' as const, question: '您能告诉我今天是几月几号，星期几吗？', maxScore: 3 },
    { type: 'memory' as const, question: '我现在说三个词，请您记住：苹果、桌子、硬币。能重复一遍吗？', maxScore: 3 },
    { type: 'attention' as const, question: '请您从100开始，每次减去7，说出前5个数字。', maxScore: 5 },
    { type: 'language' as const, question: '请您用“苹果”、“医生”、“快乐”这三个词造一个句子。', maxScore: 2 },
    { type: 'memory' as const, question: '您还记得我刚才让您记住的三个词是什么吗？', maxScore: 3 }
  ];

  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome_1',
      content: `您好${user?.name ? '，' + user.name : ''}！我是您的AI健康助手小慧。接下来我们将进行一个轻松的对话，通过几个简单的问题来了解您的认知和情感状态。这个过程大约需要10-15分钟，请您放松心情，如实回答就好。准备好了吗？`,
      type: 'text',
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addMessage = (content: string, sender: 'user' | 'assistant', type: 'text' | 'audio' = 'text') => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      sender,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const simulateAIResponse = async (userInput: string) => {
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    let response = '';
    
    switch (currentStage) {
      case 'greeting':
        if (userInput.includes('准备') || userInput.includes('好') || userInput.includes('是')) {
          response = '很好！那我们开始吧。首先，我想了解一下您的记忆情况。' + cognitiveQuestions[0].question;
          setCurrentStage('cognitive');
        } else {
          response = '没关系，您可以慢慢来。什么时候准备好了告诉我就行。';
        }
        break;
        
      case 'cognitive':
        const currentTestIndex = cognitiveTests.length;
        if (currentTestIndex < cognitiveQuestions.length) {
          const currentTest = cognitiveQuestions[currentTestIndex];
          const score = Math.floor(Math.random() * currentTest.maxScore) + 1;
          
          const newTest: CognitiveTest = {
            id: `test_${currentTestIndex}`,
            type: currentTest.type,
            question: currentTest.question,
            answer: userInput,
            score,
            maxScore: currentTest.maxScore,
            completedAt: new Date()
          };
          
          setCognitiveTests(prev => [...prev, newTest]);
          
          if (currentTestIndex < cognitiveQuestions.length - 1) {
            response = `很好！现在我们来试试下一个问题。${cognitiveQuestions[currentTestIndex + 1].question}`;
          } else {
            response = '谢谢您的配合！认知测试部分已经完成。现在我想了解一下您最近的心情和感受。请告诉我，您最近一周的心情怎么样？';
            setCurrentStage('emotional');
          }
        }
        break;
        
      case 'emotional':
        const mockEmotionalAnalysis: EmotionalAnalysis = {
          positiveScore: 0.6 + Math.random() * 0.3,
          negativeScore: 0.1 + Math.random() * 0.2,
          neutralScore: 0.2 + Math.random() * 0.2,
          dominantEmotion: Math.random() > 0.5 ? '积极' : '平静',
          confidenceLevel: 0.8 + Math.random() * 0.2
        };
        
        setEmotionalAnalysis(mockEmotionalAnalysis);
        
        response = '感谢您与我分享这些。根据我们刚才的对话，您的认知能力整体表现良好，情绪状态也比较稳定。我会为您生成一份详细的评估报告。';
        setCurrentStage('summary');
        break;
        
      case 'summary':
        response = '我们的对话就到这里。感谢您的耐心配合！点击下方的“完成评估”按钮查看详细报告。';
        break;
    }
    
    setIsProcessing(false);
    addMessage(response, 'assistant');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    addMessage(inputText, 'user');
    const userInput = inputText;
    setInputText('');
    
    await simulateAIResponse(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const calculateOverallScore = () => {
    if (cognitiveTests.length === 0) return 0;
    
    const totalScore = cognitiveTests.reduce((sum, test) => sum + test.score, 0);
    const maxTotalScore = cognitiveTests.reduce((sum, test) => sum + test.maxScore, 0);
    
    return Math.round((totalScore / maxTotalScore) * 100);
  };

  const handleCompleteAssessment = () => {
    const assessmentData = {
      sessionDuration,
      cognitiveTests,
      emotionalAnalysis,
      overallScore: calculateOverallScore(),
      messages
    };
    
    navigate(ROUTES.FAMILY_SUMMARY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(ROUTES.ASSESSMENT_CASE)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回上一步</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              第3步：智能对话
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatTime(sessionDuration)}</span>
            </div>
            
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 rounded-t-xl">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI智能对话评估</h2>
                    <p className="text-blue-100">通过自然对话进行认知和情感状态评估</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        message.sender === 'user' 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {message.sender === 'user' ? 
                          <User className="w-4 h-4" /> : 
                          <Bot className="w-4 h-4" />
                        }
                      </div>
                      
                      <div className={`max-w-[80%] p-4 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader className="w-4 h-4 animate-spin text-gray-600" />
                          <span className="text-gray-600">AI正在思考中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleRecording}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isProcessing}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={isProcessing ? 'AI正在回复中...' : '输入您的回答...'}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isProcessing}
                    className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {isRecording && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-red-600 animate-pulse">
                      正在录音中，点击麦克风按钮停止
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">当前阶段</h3>
              <div className="space-y-3">
                {[
                  { id: 'greeting', name: '问候介绍', icon: MessageCircle },
                  { id: 'cognitive', name: '认知测试', icon: Brain },
                  { id: 'emotional', name: '情感评估', icon: Heart },
                  { id: 'summary', name: '总结评估', icon: CheckCircle }
                ].map(stage => {
                  const Icon = stage.icon;
                  const isCurrent = currentStage === stage.id;
                  const isCompleted = (
                    (stage.id === 'greeting' && currentStage !== 'greeting') ||
                    (stage.id === 'cognitive' && cognitiveTests.length > 0 && currentStage !== 'cognitive') ||
                    (stage.id === 'emotional' && emotionalAnalysis && currentStage !== 'emotional') ||
                    (stage.id === 'summary' && currentStage === 'summary')
                  );
                  
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        isCurrent 
                          ? 'bg-blue-50 border border-blue-200'
                          : isCompleted
                            ? 'bg-green-50'
                            : 'bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        isCurrent 
                          ? 'text-blue-600'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        isCurrent 
                          ? 'text-blue-900'
                          : isCompleted
                            ? 'text-green-900'
                            : 'text-gray-500'
                      }`}>
                        {stage.name}
                      </span>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {cognitiveTests.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">认知测试进度</h3>
                <div className="space-y-3">
                  {cognitiveTests.map((test, index) => (
                    <div key={test.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">测试 {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {test.score}/{test.maxScore}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${
                          test.score >= test.maxScore * 0.7 ? 'bg-green-500' : 
                          test.score >= test.maxScore * 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                  
                  {cognitiveTests.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">总分</span>
                        <span className="text-lg font-bold text-blue-600">
                          {calculateOverallScore()}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {emotionalAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">情感状态</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">积极情绪</span>
                    <span className="text-sm font-medium text-green-600">
                      {Math.round(emotionalAnalysis.positiveScore * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">中性情绪</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {Math.round(emotionalAnalysis.neutralScore * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">消极情绪</span>
                    <span className="text-sm font-medium text-red-600">
                      {Math.round(emotionalAnalysis.negativeScore * 100)}%
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <span className="text-lg font-bold text-blue-600">
                        {emotionalAnalysis.dominantEmotion}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        主导情绪状态
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentStage === 'summary' && (
              <button
                onClick={handleCompleteAssessment}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg"
              >
                完成评估
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentChatPage;