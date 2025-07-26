#!/usr/bin/env python3
"""
TEN Agent 对话记录查找脚本

查找TEN framework的对话记录、日志文件和存储位置
"""

import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

def find_ten_agent_logs():
    """查找TEN Agent的日志和对话记录"""
    
    print("🔍 查找TEN Agent对话记录和日志文件")
    print("=" * 60)
    
    # 1. 查找TEN framework日志目录
    print("\n📁 1. TEN Framework日志目录:")
    ten_framework_path = "ten-framework"
    
    # 查找可能的日志目录
    possible_log_dirs = [
        "ten-framework/ai_agents/logs",
        "ten-framework/ai_agents/agents/logs", 
        "ten-framework/ai_agents/server/logs",
        "ten-framework/logs",
        "logs",
        "ten-framework/ai_agents/agents/examples/demo/logs"
    ]
    
    for log_dir in possible_log_dirs:
        if os.path.exists(log_dir):
            print(f"✅ 找到日志目录: {log_dir}")
            # 列出日志文件
            try:
                log_files = [f for f in os.listdir(log_dir) if f.endswith('.log')]
                if log_files:
                    print(f"   📄 日志文件: {', '.join(log_files[:5])}")
                    if len(log_files) > 5:
                        print(f"   ... 还有 {len(log_files) - 5} 个文件")
                else:
                    print("   📄 暂无日志文件")
            except Exception as e:
                print(f"   ❌ 无法读取目录: {e}")
        else:
            print(f"❌ 目录不存在: {log_dir}")
    
    # 2. 查找数据库文件
    print("\n💾 2. 数据库文件:")
    possible_db_files = [
        "conversation-storage-service/data/conversations.db",
        "medjourney-backend/data/medjourney.db",
        "ten-framework/ai_agents/data/conversations.db",
        "ten-framework/ai_agents/agents/data/conversations.db"
    ]
    
    for db_file in possible_db_files:
        if os.path.exists(db_file):
            print(f"✅ 找到数据库: {db_file}")
            # 检查数据库内容
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                print(f"   📊 数据表: {', '.join([t[0] for t in tables])}")
                conn.close()
            except Exception as e:
                print(f"   ❌ 无法读取数据库: {e}")
        else:
            print(f"❌ 数据库不存在: {db_file}")
    
    # 3. 查找TEN framework运行时文件
    print("\n🔄 3. TEN Framework运行时文件:")
    
    # 查找property-*.json文件（运行时生成的配置）
    property_files = []
    for root, dirs, files in os.walk(ten_framework_path):
        for file in files:
            if file.startswith('property-') and file.endswith('.json'):
                property_files.append(os.path.join(root, file))
    
    if property_files:
        print(f"✅ 找到 {len(property_files)} 个运行时配置文件:")
        for prop_file in property_files[:5]:
            print(f"   📄 {prop_file}")
        if len(property_files) > 5:
            print(f"   ... 还有 {len(property_files) - 5} 个文件")
    else:
        print("❌ 未找到运行时配置文件")
    
    # 4. 查找app-*.log文件（运行时生成的日志）
    app_log_files = []
    for root, dirs, files in os.walk(ten_framework_path):
        for file in files:
            if file.startswith('app-') and file.endswith('.log'):
                app_log_files.append(os.path.join(root, file))
    
    if app_log_files:
        print(f"\n✅ 找到 {len(app_log_files)} 个运行时日志文件:")
        for log_file in app_log_files[:5]:
            print(f"   📄 {log_file}")
            # 显示文件大小和修改时间
            try:
                stat = os.stat(log_file)
                size_mb = stat.st_size / (1024 * 1024)
                mtime = datetime.fromtimestamp(stat.st_mtime)
                print(f"      📏 大小: {size_mb:.2f}MB, 修改时间: {mtime}")
            except Exception as e:
                print(f"      ❌ 无法获取文件信息: {e}")
        if len(app_log_files) > 5:
            print(f"   ... 还有 {len(app_log_files) - 5} 个文件")
    else:
        print("\n❌ 未找到运行时日志文件")
    
    # 5. 检查环境变量配置
    print("\n⚙️ 4. 环境变量配置:")
    env_vars = ['LOG_PATH', 'TEN_LOG_PATH', 'TEN_DATA_PATH']
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: 未设置")
    
    # 6. 查找对话存储服务
    print("\n🗄️ 5. 对话存储服务:")
    storage_service_path = "conversation-storage-service"
    if os.path.exists(storage_service_path):
        print(f"✅ 对话存储服务目录: {storage_service_path}")
        
        # 检查数据目录
        data_dir = os.path.join(storage_service_path, "data")
        if os.path.exists(data_dir):
            print(f"   📁 数据目录: {data_dir}")
            try:
                files = os.listdir(data_dir)
                for file in files:
                    file_path = os.path.join(data_dir, file)
                    if os.path.isfile(file_path):
                        size_mb = os.path.getsize(file_path) / (1024 * 1024)
                        mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                        print(f"      📄 {file} ({size_mb:.2f}MB, {mtime})")
            except Exception as e:
                print(f"   ❌ 无法读取数据目录: {e}")
    else:
        print(f"❌ 对话存储服务目录不存在: {storage_service_path}")

def analyze_conversation_data():
    """分析对话数据"""
    print("\n📊 6. 对话数据分析:")
    
    # 检查conversation-storage-service数据库
    db_path = "conversation-storage-service/data/conversations.db"
    if os.path.exists(db_path):
        print(f"✅ 分析数据库: {db_path}")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 统计会话数量
            cursor.execute("SELECT COUNT(*) FROM conversation_sessions")
            session_count = cursor.fetchone()[0]
            print(f"   📊 总会话数: {session_count}")
            
            # 统计消息数量
            cursor.execute("SELECT COUNT(*) FROM conversation_messages")
            message_count = cursor.fetchone()[0]
            print(f"   💬 总消息数: {message_count}")
            
            # 获取最近的会话
            cursor.execute("""
                SELECT session_id, user_id, created_at, updated_at 
                FROM conversation_sessions 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            recent_sessions = cursor.fetchall()
            
            if recent_sessions:
                print("   📅 最近会话:")
                for session in recent_sessions:
                    session_id, user_id, created_at, updated_at = session
                    print(f"      🆔 {session_id[:20]}... (用户: {user_id})")
                    print(f"         创建: {created_at}")
                    print(f"         更新: {updated_at}")
                    
                    # 获取该会话的消息数量
                    cursor.execute("SELECT COUNT(*) FROM conversation_messages WHERE session_id = ?", (session_id,))
                    msg_count = cursor.fetchone()[0]
                    print(f"         消息数: {msg_count}")
            
            conn.close()
        except Exception as e:
            print(f"   ❌ 分析数据库失败: {e}")
    else:
        print(f"❌ 数据库不存在: {db_path}")

if __name__ == "__main__":
    find_ten_agent_logs()
    analyze_conversation_data()
    
    print("\n" + "=" * 60)
    print("🎯 总结:")
    print("TEN Agent的对话内容主要存储在以下位置:")
    print("1. conversation-storage-service/data/conversations.db - 主要对话数据库")
    print("2. ten-framework/ai_agents/ 下的 app-*.log 文件 - 运行时日志")
    print("3. ten-framework/ai_agents/ 下的 property-*.json 文件 - 运行时配置")
    print("4. medjourney-backend/data/medjourney.db - 后端数据库") 