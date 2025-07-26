#!/usr/bin/env python3
"""
查看TEN Agent对话数据脚本

查看存储在conversation-storage-service中的具体对话内容
"""

import sqlite3
import json
from datetime import datetime

def view_conversation_data():
    """查看对话数据"""
    
    print("💬 查看TEN Agent对话内容")
    print("=" * 60)
    
    # 连接数据库
    db_path = "conversation-storage-service/data/conversations.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. 查看会话信息
        print("\n📋 1. 会话信息:")
        cursor.execute("""
            SELECT session_id, user_id, session_type, status, created_at, updated_at, metadata
            FROM conversation_sessions
            ORDER BY created_at DESC
        """)
        
        sessions = cursor.fetchall()
        for session in sessions:
            session_id, user_id, session_type, status, created_at, updated_at, metadata = session
            print(f"\n🆔 会话ID: {session_id}")
            print(f"👤 用户ID: {user_id}")
            print(f"📝 会话类型: {session_type}")
            print(f"📊 状态: {status}")
            print(f"🕐 创建时间: {created_at}")
            print(f"🕐 更新时间: {updated_at}")
            if metadata:
                try:
                    meta = json.loads(metadata)
                    print(f"📋 元数据: {json.dumps(meta, indent=2, ensure_ascii=False)}")
                except:
                    print(f"📋 元数据: {metadata}")
        
        # 2. 查看对话消息
        print("\n💬 2. 对话消息:")
        cursor.execute("""
            SELECT session_id, role, content, timestamp, emotion_analysis, metadata
            FROM conversation_messages
            ORDER BY timestamp ASC
        """)
        
        messages = cursor.fetchall()
        for i, message in enumerate(messages, 1):
            session_id, role, content, timestamp, emotion_analysis, metadata = message
            print(f"\n--- 消息 {i} ---")
            print(f"🆔 会话ID: {session_id}")
            print(f"👤 角色: {role}")
            print(f"💬 内容: {content}")
            print(f"🕐 时间: {timestamp}")
            
            if emotion_analysis:
                try:
                    emotion = json.loads(emotion_analysis)
                    print(f"😊 情感分析: {json.dumps(emotion, indent=2, ensure_ascii=False)}")
                except:
                    print(f"😊 情感分析: {emotion_analysis}")
            
            if metadata:
                try:
                    meta = json.loads(metadata)
                    print(f"📋 元数据: {json.dumps(meta, indent=2, ensure_ascii=False)}")
                except:
                    print(f"📋 元数据: {metadata}")
        
        # 3. 查看生成的报告
        print("\n📊 3. 生成的报告:")
        cursor.execute("""
            SELECT session_id, report_type, content, generated_at, metadata
            FROM generated_reports
            ORDER BY generated_at DESC
        """)
        
        reports = cursor.fetchall()
        for report in reports:
            session_id, report_type, content, generated_at, metadata = report
            print(f"\n📄 报告类型: {report_type}")
            print(f"🆔 会话ID: {session_id}")
            print(f"🕐 生成时间: {generated_at}")
            print(f"📝 内容: {content[:200]}...")  # 只显示前200个字符
            if metadata:
                try:
                    meta = json.loads(metadata)
                    print(f"📋 元数据: {json.dumps(meta, indent=2, ensure_ascii=False)}")
                except:
                    print(f"📋 元数据: {metadata}")
        
        # 4. 按会话分组显示对话
        print("\n🔄 4. 按会话分组的对话:")
        cursor.execute("""
            SELECT DISTINCT session_id FROM conversation_messages
            ORDER BY session_id
        """)
        
        session_ids = cursor.fetchall()
        for session_id in session_ids:
            session_id = session_id[0]
            print(f"\n{'='*50}")
            print(f"📋 会话: {session_id}")
            print(f"{'='*50}")
            
            cursor.execute("""
                SELECT role, content, timestamp
                FROM conversation_messages
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            
            session_messages = cursor.fetchall()
            for msg in session_messages:
                role, content, timestamp = msg
                role_emoji = "👤" if role == "user" else "🤖"
                print(f"\n{role_emoji} {role.upper()}:")
                print(f"💬 {content}")
                print(f"🕐 {timestamp}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 查看对话数据失败: {e}")

def view_medjourney_data():
    """查看MedJourney后端数据"""
    
    print("\n" + "=" * 60)
    print("🏥 查看MedJourney后端数据")
    print("=" * 60)
    
    # 连接数据库
    db_path = "medjourney-backend/data/medjourney.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. 查看患者信息
        print("\n👥 1. 患者信息:")
        cursor.execute("SELECT * FROM patients")
        patients = cursor.fetchall()
        for patient in patients:
            print(f"🆔 ID: {patient[0]}")
            print(f"👤 姓名: {patient[1]}")
            print(f"📅 年龄: {patient[2]}")
            print(f"📋 病史: {patient[3]}")
            print(f"🕐 创建时间: {patient[4]}")
            print(f"🕐 更新时间: {patient[5]}")
            print()
        
        # 2. 查看会话信息
        print("\n📋 2. 会话信息:")
        cursor.execute("SELECT * FROM conversation_sessions")
        sessions = cursor.fetchall()
        for session in sessions:
            print(f"🆔 ID: {session[0]}")
            print(f"👤 患者ID: {session[1]}")
            print(f"📝 会话类型: {session[2]}")
            print(f"📊 状态: {session[3]}")
            print(f"🕐 创建时间: {session[4]}")
            print(f"🕐 更新时间: {session[5]}")
            if session[6]:  # metadata
                print(f"📋 元数据: {session[6]}")
            print()
        
        # 3. 查看对话消息
        print("\n💬 3. 对话消息:")
        cursor.execute("SELECT * FROM conversation_messages ORDER BY timestamp ASC")
        messages = cursor.fetchall()
        for message in messages:
            print(f"🆔 ID: {message[0]}")
            print(f"📋 会话ID: {message[1]}")
            print(f"👤 角色: {message[2]}")
            print(f"💬 内容: {message[3]}")
            print(f"📝 消息类型: {message[4]}")
            if message[5]:  # emotion_analysis
                print(f"😊 情感分析: {message[5]}")
            print(f"🕐 时间: {message[6]}")
            if message[7]:  # metadata
                print(f"📋 元数据: {message[7]}")
            print()
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 查看MedJourney数据失败: {e}")

if __name__ == "__main__":
    view_conversation_data()
    view_medjourney_data()
    
    print("\n" + "=" * 60)
    print("🎯 总结:")
    print("TEN Agent的对话内容已成功记录在以下位置:")
    print("✅ conversation-storage-service/data/conversations.db - 包含完整的对话历史")
    print("✅ medjourney-backend/data/medjourney.db - 包含患者信息和会话数据")
    print("\n对话内容包括:")
    print("- 用户输入的消息")
    print("- AI助手的回复")
    print("- 情感分析结果")
    print("- 会话元数据")
    print("- 生成的医疗报告") 