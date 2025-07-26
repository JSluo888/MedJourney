#!/usr/bin/env python3
"""
MedJourney 对话存储服务 API 测试脚本
"""

import requests
import json
import time
from datetime import datetime

# 服务器配置
# BASE_URL = "http://36.50.226.131:8000"
# 本地测试时使用:
BASE_URL = "http://localhost:8000"

def test_health_check():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ 健康检查通过")
            print(f"   响应: {response.json()}")
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 健康检查异常: {str(e)}")

def test_create_session():
    """测试创建会话"""
    print("\n📝 测试创建会话...")
    session_data = {
        "session_id": f"test_session_{int(time.time())}",
        "user_id": "test_user_123",
        "session_type": "medical_assessment",
        "status": "active",
        "metadata": {
            "test": True,
            "created_by": "test_script"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/conversations/sessions",
            json=session_data
        )
        if response.status_code == 200:
            print("✅ 会话创建成功")
            print(f"   响应: {response.json()}")
            return session_data["session_id"]
        else:
            print(f"❌ 会话创建失败: {response.status_code}")
            print(f"   错误: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 会话创建异常: {str(e)}")
        return None

def test_save_messages(session_id):
    """测试保存消息"""
    print(f"\n💬 测试保存消息 (会话: {session_id})...")
    
    # 模拟医患对话
    messages = [
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "user",
            "content": "医生，我今天感觉有点头晕",
            "timestamp": datetime.now().isoformat(),
            "emotion_analysis": {
                "emotion": "concerned",
                "confidence": 0.8
            }
        },
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "assistant",
            "content": "您好，我理解您的担心。头晕是什么时候开始的？持续多长时间了？",
            "timestamp": datetime.now().isoformat()
        },
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "user",
            "content": "从早上开始，大概有2个小时了，感觉有点恶心",
            "timestamp": datetime.now().isoformat(),
            "emotion_analysis": {
                "emotion": "anxious",
                "confidence": 0.9
            }
        },
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "assistant",
            "content": "我明白了。头晕伴有恶心，这可能是多种原因引起的。您最近有没有感冒、发烧或者休息不好？",
            "timestamp": datetime.now().isoformat()
        },
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "user",
            "content": "最近确实睡得不太好，经常失眠，而且工作压力比较大",
            "timestamp": datetime.now().isoformat(),
            "emotion_analysis": {
                "emotion": "stressed",
                "confidence": 0.85
            }
        },
        {
            "session_id": session_id,
            "user_id": "test_user_123",
            "role": "assistant",
            "content": "压力大和睡眠不足确实可能导致头晕。建议您先休息一下，保持充足睡眠，如果症状持续或加重，建议及时就医检查。",
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    success_count = 0
    for i, message in enumerate(messages, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/conversations/messages",
                json=message
            )
            if response.status_code == 200:
                print(f"✅ 消息 {i} 保存成功")
                success_count += 1
            else:
                print(f"❌ 消息 {i} 保存失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 消息 {i} 保存异常: {str(e)}")
    
    print(f"📊 消息保存统计: {success_count}/{len(messages)} 成功")
    return success_count == len(messages)

def test_get_messages(session_id):
    """测试获取消息"""
    print(f"\n📖 测试获取消息 (会话: {session_id})...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/conversations/sessions/{session_id}/messages")
        if response.status_code == 200:
            data = response.json()
            print("✅ 获取消息成功")
            print(f"   消息数量: {data['data']['total_count']}")
            print("   消息预览:")
            for i, msg in enumerate(data['data']['messages'][:3], 1):
                print(f"     {i}. [{msg['role']}] {msg['content'][:50]}...")
            return True
        else:
            print(f"❌ 获取消息失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取消息异常: {str(e)}")
        return False

def test_generate_doctor_report(session_id):
    """测试生成医生报告"""
    print(f"\n👨‍⚕️ 测试生成医生报告 (会话: {session_id})...")
    report_data = {
        "session_id": session_id,
        "report_type": "doctor",
        "format": "json",
        "include_analysis": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/reports/generate",
            json=report_data
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ 医生报告生成成功")
            print(f"   报告ID: {data['data']['report_id']}")
            print(f"   健康评分: {data['data']['summary']['health_score']}")
            print(f"   情绪状态: {data['data']['summary']['emotional_state']}")
            print("   主要发现:")
            for finding in data['data']['summary']['key_findings'][:3]:
                print(f"     • {finding}")
            return True
        else:
            print(f"❌ 医生报告生成失败: {response.status_code}")
            print(f"   错误: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 医生报告生成异常: {str(e)}")
        return False

def test_generate_family_report(session_id):
    """测试生成家属报告"""
    print(f"\n👨‍👩‍👧‍👦 测试生成家属报告 (会话: {session_id})...")
    report_data = {
        "session_id": session_id,
        "report_type": "family",
        "format": "json",
        "include_analysis": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/reports/generate",
            json=report_data
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ 家属报告生成成功")
            print(f"   报告ID: {data['data']['report_id']}")
            print(f"   健康评分: {data['data']['summary']['health_score']}")
            print(f"   简单总结: {data['data']['summary']['simple_summary']}")
            print("   建议:")
            for suggestion in data['data']['suggestions'][:3]:
                print(f"     • {suggestion}")
            return True
        else:
            print(f"❌ 家属报告生成失败: {response.status_code}")
            print(f"   错误: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 家属报告生成异常: {str(e)}")
        return False

def test_get_reports(session_id):
    """测试获取报告列表"""
    print(f"\n📋 测试获取报告列表 (会话: {session_id})...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/reports/{session_id}")
        if response.status_code == 200:
            data = response.json()
            print("✅ 获取报告列表成功")
            print(f"   报告数量: {data['data']['total_count']}")
            for report in data['data']['reports']:
                print(f"   • {report['report_type']} 报告 - {report['generated_at']}")
            return True
        else:
            print(f"❌ 获取报告列表失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取报告列表异常: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始 MedJourney 对话存储服务 API 测试")
    print("=" * 50)
    
    # 测试健康检查
    test_health_check()
    
    # 测试创建会话
    session_id = test_create_session()
    if not session_id:
        print("❌ 无法创建会话，测试终止")
        return
    
    # 测试保存消息
    if not test_save_messages(session_id):
        print("❌ 消息保存失败，继续测试...")
    
    # 测试获取消息
    test_get_messages(session_id)
    
    # 测试生成医生报告
    test_generate_doctor_report(session_id)
    
    # 测试生成家属报告
    test_generate_family_report(session_id)
    
    # 测试获取报告列表
    test_get_reports(session_id)
    
    print("\n" + "=" * 50)
    print("🎉 API 测试完成！")
    print(f"📊 测试会话ID: {session_id}")
    print(f"🌐 API地址: {BASE_URL}")
    print(f"📖 API文档: {BASE_URL}/docs")

if __name__ == "__main__":
    main() 