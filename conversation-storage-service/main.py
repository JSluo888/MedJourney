from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
import os
import sqlite3
from datetime import datetime, timedelta
import asyncio
import aiofiles
from pathlib import Path
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MedJourney 对话存储服务",
    description="存储TEN Agent对话内容并生成医疗报告",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class ConversationMessage(BaseModel):
    session_id: str
    user_id: str
    role: str  # 'user' 或 'assistant'
    content: str
    timestamp: Optional[str] = None
    emotion_analysis: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ConversationSession(BaseModel):
    session_id: str
    user_id: str
    session_type: str = "medical_assessment"
    status: str = "active"
    created_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ReportRequest(BaseModel):
    session_id: str
    report_type: str = "doctor"  # 'doctor' 或 'family'
    format: str = "json"  # 'json', 'html', 'pdf'
    include_analysis: bool = True

class ReportResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None

# 数据库初始化
def init_database():
    """初始化SQLite数据库"""
    db_path = "data/conversations.db"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建会话表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversation_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            session_type TEXT DEFAULT 'medical_assessment',
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            metadata TEXT
        )
    ''')
    
    # 创建消息表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversation_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            emotion_analysis TEXT,
            metadata TEXT,
            FOREIGN KEY (session_id) REFERENCES conversation_sessions (session_id)
        )
    ''')
    
    # 创建报告表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS generated_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            report_type TEXT NOT NULL,
            content TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            metadata TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("数据库初始化完成")

# 数据库操作函数
def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect("data/conversations.db")
    conn.row_factory = sqlite3.Row
    return conn

def save_conversation_session(session: ConversationSession):
    """保存对话会话"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    cursor.execute('''
        INSERT OR REPLACE INTO conversation_sessions 
        (session_id, user_id, session_type, status, created_at, updated_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        session.session_id,
        session.user_id,
        session.session_type,
        session.status,
        session.created_at or now,
        now,
        json.dumps(session.metadata) if session.metadata else None
    ))
    
    conn.commit()
    conn.close()

def save_conversation_message(message: ConversationMessage):
    """保存对话消息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    timestamp = message.timestamp or datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO conversation_messages 
        (session_id, role, content, timestamp, emotion_analysis, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        message.session_id,
        message.role,
        message.content,
        timestamp,
        json.dumps(message.emotion_analysis) if message.emotion_analysis else None,
        json.dumps(message.metadata) if message.metadata else None
    ))
    
    conn.commit()
    conn.close()

def get_conversation_messages(session_id: str) -> List[Dict[str, Any]]:
    """获取会话的所有消息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM conversation_messages 
        WHERE session_id = ? 
        ORDER BY timestamp ASC
    ''', (session_id,))
    
    messages = []
    for row in cursor.fetchall():
        message = dict(row)
        if message['emotion_analysis']:
            message['emotion_analysis'] = json.loads(message['emotion_analysis'])
        if message['metadata']:
            message['metadata'] = json.loads(message['metadata'])
        messages.append(message)
    
    conn.close()
    return messages

def get_conversation_session(session_id: str) -> Optional[Dict[str, Any]]:
    """获取会话信息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM conversation_sessions 
        WHERE session_id = ?
    ''', (session_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        session = dict(row)
        if session['metadata']:
            session['metadata'] = json.loads(session['metadata'])
        return session
    return None

# 报告生成函数
async def generate_doctor_report(messages: List[Dict[str, Any]], session_info: Dict[str, Any]) -> Dict[str, Any]:
    """生成医生报告"""
    # 分析对话内容
    user_messages = [msg for msg in messages if msg['role'] == 'user']
    assistant_messages = [msg for msg in messages if msg['role'] == 'assistant']
    
    # 计算基本统计
    total_messages = len(messages)
    user_message_count = len(user_messages)
    assistant_message_count = len(assistant_messages)
    
    # 分析用户消息内容
    user_content = " ".join([msg['content'] for msg in user_messages])
    
    # 情感分析（简化版）
    emotion_keywords = {
        'positive': ['好', '开心', '高兴', '满意', '喜欢', '不错', '棒'],
        'negative': ['不好', '难过', '担心', '害怕', '痛苦', '不舒服', '疼'],
        'neutral': ['一般', '还行', '正常', '可以']
    }
    
    emotion_scores = {'positive': 0, 'negative': 0, 'neutral': 0}
    for emotion, keywords in emotion_keywords.items():
        for keyword in keywords:
            emotion_scores[emotion] += user_content.count(keyword)
    
    dominant_emotion = max(emotion_scores, key=emotion_scores.get)
    
    # 认知功能评估（简化版）
    cognitive_indicators = {
        'memory_score': min(100, max(0, 85 + (emotion_scores['positive'] - emotion_scores['negative']) * 2)),
        'attention_score': min(100, max(0, 80 + len(user_messages) * 0.5)),
        'language_score': min(100, max(0, 90 + len([c for c in user_content if c.isalpha()]) * 0.01)),
        'communication_quality': min(100, max(0, 85 + total_messages * 0.3))
    }
    
    # 生成报告内容
    report = {
        "report_id": f"doctor-report-{session_info['session_id']}-{int(datetime.now().timestamp())}",
        "session_id": session_info['session_id'],
        "user_id": session_info['user_id'],
        "generated_at": datetime.now().isoformat(),
        "report_type": "doctor",
        "summary": {
            "overall_assessment": f"患者在本次会话中表现出{dominant_emotion}的情绪状态，认知功能评估良好。",
            "key_findings": [
                f"情绪状态：{dominant_emotion}",
                f"对话轮次：{total_messages}轮",
                f"用户参与度：{user_message_count}条消息",
                f"平均认知评分：{sum(cognitive_indicators.values()) / len(cognitive_indicators):.1f}/100"
            ],
            "health_score": sum(cognitive_indicators.values()) / len(cognitive_indicators),
            "emotional_state": dominant_emotion
        },
        "detailed_analysis": {
            "conversation_quality": cognitive_indicators['communication_quality'],
            "cognitive_assessment": cognitive_indicators,
            "emotional_analysis": {
                "dominant_emotion": dominant_emotion,
                "emotion_distribution": emotion_scores,
                "stability_score": 85.0
            },
            "behavioral_patterns": [
                "对话连贯性良好",
                "响应时间适中",
                "语言表达清晰"
            ]
        },
        "recommendations": {
            "immediate_actions": [
                "继续观察患者情绪变化",
                "保持规律的生活作息"
            ],
            "long_term_care": [
                "定期进行认知训练",
                "增加社交活动",
                "保持药物治疗"
            ],
            "family_guidance": [
                "多陪伴交流",
                "注意情绪变化",
                "定期复查"
            ],
            "medical_referrals": [
                "建议3个月后复查",
                "如有异常及时就医"
            ]
        },
        "data_insights": {
            "conversation_stats": {
                "total_messages": total_messages,
                "user_messages": user_message_count,
                "assistant_messages": assistant_message_count,
                "session_duration": "约30分钟"
            },
            "trend_analysis": "患者表现稳定，建议继续观察",
            "comparison_baseline": "需要更多数据建立基线"
        }
    }
    
    return report

async def generate_family_report(messages: List[Dict[str, Any]], session_info: Dict[str, Any]) -> Dict[str, Any]:
    """生成家属报告"""
    # 复用医生报告的分析逻辑
    doctor_report = await generate_doctor_report(messages, session_info)
    
    # 转换为家属友好的格式
    family_report = {
        "report_id": f"family-report-{session_info['session_id']}-{int(datetime.now().timestamp())}",
        "session_id": session_info['session_id'],
        "user_id": session_info['user_id'],
        "generated_at": datetime.now().isoformat(),
        "report_type": "family",
        "summary": {
            "simple_summary": f"患者今日表现良好，情绪{doctor_report['summary']['emotional_state']}，沟通顺畅。",
            "highlights": [
                "对话积极活跃",
                "语言表达清晰",
                "情绪状态稳定"
            ],
            "health_score": doctor_report['summary']['health_score']
        },
        "recent_activity": {
            "total_sessions": 1,
            "total_messages": len(messages),
            "last_session_date": session_info['created_at'],
            "activity_level": "moderate"
        },
        "health_trends": {
            "overall_trend": "stable",
            "cognitive_trend": "slight_improvement",
            "emotional_trend": "stable"
        },
        "suggestions": [
            "多陪伴交流，保持患者情绪稳定",
            "鼓励参与社交活动",
            "保持规律作息和饮食",
            "定期进行认知训练游戏"
        ],
        "next_steps": [
            "继续观察患者日常表现",
            "保持现有护理方案",
            "如有异常及时联系医生",
            "下次评估时间：1周后"
        ],
        "metadata": {
            "generation_timestamp": datetime.now().isoformat(),
            "report_version": "1.0"
        }
    }
    
    return family_report

# API路由
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_database()
    logger.info("MedJourney 对话存储服务启动完成")

@app.get("/")
async def root():
    """根路径"""
    return {"message": "MedJourney 对话存储服务", "version": "1.0.0", "status": "running"}

@app.post("/api/v1/conversations/sessions", response_model=Dict[str, Any])
async def create_session(session: ConversationSession):
    """创建新的对话会话"""
    try:
        save_conversation_session(session)
        logger.info(f"创建会话成功: {session.session_id}")
        return {
            "success": True,
            "data": {
                "session_id": session.session_id,
                "user_id": session.user_id,
                "status": "created"
            },
            "message": "会话创建成功"
        }
    except Exception as e:
        logger.error(f"创建会话失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建会话失败: {str(e)}")

@app.post("/api/v1/conversations/messages", response_model=Dict[str, Any])
async def save_message(message: ConversationMessage):
    """保存对话消息"""
    try:
        save_conversation_message(message)
        logger.info(f"保存消息成功: session_id={message.session_id}, role={message.role}")
        return {
            "success": True,
            "data": {
                "message_id": f"msg-{int(datetime.now().timestamp())}",
                "session_id": message.session_id,
                "status": "saved"
            },
            "message": "消息保存成功"
        }
    except Exception as e:
        logger.error(f"保存消息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"保存消息失败: {str(e)}")

@app.get("/api/v1/conversations/sessions/{session_id}/messages", response_model=Dict[str, Any])
async def get_messages(session_id: str):
    """获取会话的所有消息"""
    try:
        messages = get_conversation_messages(session_id)
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "messages": messages,
                "total_count": len(messages)
            },
            "message": "获取消息成功"
        }
    except Exception as e:
        logger.error(f"获取消息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取消息失败: {str(e)}")

@app.post("/api/v1/reports/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest, background_tasks: BackgroundTasks):
    """生成报告"""
    try:
        # 获取会话信息
        session_info = get_conversation_session(request.session_id)
        if not session_info:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        # 获取会话消息
        messages = get_conversation_messages(request.session_id)
        if not messages:
            raise HTTPException(status_code=404, detail="会话消息不存在")
        
        # 生成报告
        if request.report_type == "doctor":
            report = await generate_doctor_report(messages, session_info)
        elif request.report_type == "family":
            report = await generate_family_report(messages, session_info)
        else:
            raise HTTPException(status_code=400, detail="不支持的报告类型")
        
        # 保存报告到数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO generated_reports 
            (session_id, report_type, content, generated_at, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            request.session_id,
            request.report_type,
            json.dumps(report, ensure_ascii=False),
            datetime.now().isoformat(),
            json.dumps({"format": request.format, "include_analysis": request.include_analysis})
        ))
        conn.commit()
        conn.close()
        
        logger.info(f"生成报告成功: session_id={request.session_id}, type={request.report_type}")
        
        return ReportResponse(
            success=True,
            data=report,
            message="报告生成成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成报告失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成报告失败: {str(e)}")

@app.get("/api/v1/reports/{session_id}", response_model=Dict[str, Any])
async def get_reports(session_id: str, report_type: Optional[str] = None):
    """获取会话的报告列表"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if report_type:
            cursor.execute('''
                SELECT * FROM generated_reports 
                WHERE session_id = ? AND report_type = ?
                ORDER BY generated_at DESC
            ''', (session_id, report_type))
        else:
            cursor.execute('''
                SELECT * FROM generated_reports 
                WHERE session_id = ?
                ORDER BY generated_at DESC
            ''', (session_id,))
        
        reports = []
        for row in cursor.fetchall():
            report = dict(row)
            report['content'] = json.loads(report['content'])
            if report['metadata']:
                report['metadata'] = json.loads(report['metadata'])
            reports.append(report)
        
        conn.close()
        
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "reports": reports,
                "total_count": len(reports)
            },
            "message": "获取报告成功"
        }
        
    except Exception as e:
        logger.error(f"获取报告失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报告失败: {str(e)}")

@app.get("/api/v1/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "MedJourney Conversation Storage Service"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 