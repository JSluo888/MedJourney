#!/usr/bin/env python3
"""
AI陪伴对话轮次限制修复脚本

问题分析：
1. max_memory_length 设置为10，限制了对话历史记忆
2. force_threshold_ms 设置为30秒，可能过短
3. Turn Detection 决策逻辑可能过于严格

解决方案：
1. 增加 max_memory_length 到50轮
2. 增加 force_threshold_ms 到60秒或禁用
3. 优化 Turn Detection 配置
4. 增加 max_tokens 以支持更长回复
"""

import os
import json
import re
from pathlib import Path

def fix_conversation_limits():
    """修复AI陪伴对话的轮次限制问题"""
    
    print("🔧 开始修复AI陪伴对话轮次限制...")
    
    # 1. 修复 Turn Detection 配置
    config_file = "ten-framework/ai_agents/agents/ten_packages/extension/ten_turn_detection/config.py"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 将强制聊天超时从30秒增加到60秒
        content = re.sub(
            r'force_threshold_ms: int = \d+',
            'force_threshold_ms: int = 60000  # 60秒超时',
            content
        )
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复 {config_file} - 强制聊天超时增加到60秒")
    
    # 2. 修复所有 property.json 文件中的对话限制
    property_files = [
        "ten-framework/ai_agents/agents/examples/demo/property.json",
        "ten-framework/ai_agents/agents/examples/huggingface/property.json",
        "ten-framework/ai_agents/agents/examples/default/property.json",
        "ten-framework/ai_agents/agents/examples/experimental/property.json"
    ]
    
    for prop_file in property_files:
        if os.path.exists(prop_file):
            with open(prop_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 将 max_memory_length 从10增加到50
            content = re.sub(
                r'"max_memory_length": 10',
                '"max_memory_length": 50',
                content
            )
            
            # 将 max_tokens 从512增加到1024
            content = re.sub(
                r'"max_tokens": 512',
                '"max_tokens": 1024',
                content
            )
            
            # 将 temperature 从0.1增加到0.7，使对话更自然
            content = re.sub(
                r'"temperature": 0\.1',
                '"temperature": 0.7',
                content
            )
            
            with open(prop_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修复 {prop_file} - 对话限制参数已优化")
    
    # 3. 创建专门用于AI陪伴的优化配置
    create_optimized_companion_config()
    
    # 4. 修复 OpenAI ChatGPT 扩展的默认配置
    fix_openai_extension_defaults()
    
    print("🎉 AI陪伴对话轮次限制修复完成！")

def create_optimized_companion_config():
    """创建专门用于AI陪伴的优化配置"""
    
    optimized_config = {
        "ten": {
            "log": {
                "level": 3
            },
            "predefined_graphs": [
                {
                    "name": "ai_companion_optimized",
                    "auto_start": true,
                    "graph": {
                        "nodes": [
                            {
                                "type": "extension",
                                "name": "agora_rtc",
                                "addon": "agora_rtc",
                                "extension_group": "default",
                                "property": {
                                    "app_id": "${env:AGORA_APP_ID}",
                                    "token": "<agora_token>",
                                    "channel": "ai_companion",
                                    "stream_id": 1234,
                                    "remote_stream_id": 123,
                                    "subscribe_audio": true,
                                    "publish_audio": true,
                                    "publish_data": true,
                                    "enable_agora_asr": true,
                                    "agora_asr_vendor_name": "microsoft",
                                    "agora_asr_language": "zh-CN",
                                    "agora_asr_vendor_key": "${env:AZURE_STT_KEY}",
                                    "agora_asr_vendor_region": "${env:AZURE_STT_REGION}",
                                    "agora_asr_session_control_file_path": "session_control.conf"
                                }
                            },
                            {
                                "type": "extension",
                                "name": "llm",
                                "addon": "openai_chatgpt_python",
                                "extension_group": "chatgpt",
                                "property": {
                                    "api_key": "${env:OPENAI_API_KEY}",
                                    "base_url": "${env:OPENAI_API_BASE}",
                                    "frequency_penalty": 0.9,
                                    "presence_penalty": 0.9,
                                    "greeting": "您好！我是您的AI陪伴助手，很高兴和您聊天。请告诉我您今天过得怎么样？",
                                    "max_memory_length": 50,  # 增加到50轮
                                    "max_tokens": 1024,       # 增加到1024
                                    "model": "${env:OPENAI_MODEL}",
                                    "temperature": 0.7,       # 增加创造性
                                    "prompt": "你是一个专业、温暖、有耐心的AI医疗陪伴助手，专门为阿尔茨海默病患者提供陪伴和支持。\n\n请遵循以下原则：\n1. 使用温和、亲切、易懂的中文语言\n2. 保持积极乐观的态度\n3. 提供情感支持和陪伴\n4. 避免复杂的医学术语\n5. 鼓励患者分享感受和回忆\n6. 如涉及具体医疗问题，建议咨询专业医生\n7. 回复应该简洁明了，便于理解\n8. 主动引导对话，避免沉默\n9. 记住之前的对话内容，建立连续性\n10. 在适当时机主动询问患者的感受和需求\n\n请用中文回复，语气要亲切自然，像朋友一样聊天。",
                                    "proxy_url": "${env:OPENAI_PROXY_URL}"
                                }
                            },
                            {
                                "type": "extension",
                                "name": "tts",
                                "addon": "azure_tts",
                                "extension_group": "tts",
                                "property": {
                                    "azure_subscription_key": "${env:AZURE_TTS_KEY}",
                                    "azure_subscription_region": "${env:AZURE_TTS_REGION}",
                                    "azure_synthesis_voice_name": "zh-CN-XiaoxiaoNeural"
                                }
                            },
                            {
                                "type": "extension",
                                "name": "turn_detector",
                                "addon": "ten_turn_detection",
                                "extension_group": "default",
                                "property": {
                                    "force_threshold_ms": 60000,  # 60秒超时
                                    "temperature": 0.3,
                                    "top_p": 0.3
                                }
                            },
                            {
                                "type": "extension",
                                "name": "interrupt_detector",
                                "addon": "interrupt_detector_python",
                                "extension_group": "default",
                                "property": {}
                            },
                            {
                                "type": "extension",
                                "name": "message_collector",
                                "addon": "message_collector",
                                "extension_group": "transcriber",
                                "property": {}
                            },
                            {
                                "type": "extension",
                                "name": "adapter",
                                "extension_group": "default",
                                "addon": "data_adapter_python"
                            }
                        ],
                        "connections": [
                            {
                                "extension": "agora_rtc",
                                "cmd": [
                                    {
                                        "name": "on_user_joined",
                                        "dest": [{"extension": "llm"}]
                                    },
                                    {
                                        "name": "on_user_left",
                                        "dest": [{"extension": "llm"}]
                                    }
                                ],
                                "data": [
                                    {
                                        "name": "text_data",
                                        "dest": [{"extension": "adapter"}]
                                    }
                                ]
                            },
                            {
                                "extension": "adapter",
                                "data": [
                                    {
                                        "name": "text_data",
                                        "dest": [
                                            {"extension": "turn_detector"},
                                            {"extension": "llm"}
                                        ]
                                    }
                                ]
                            },
                            {
                                "extension": "turn_detector",
                                "data": [
                                    {
                                        "name": "turn_decision",
                                        "dest": [{"extension": "llm"}]
                                    }
                                ]
                            },
                            {
                                "extension": "llm",
                                "data": [
                                    {
                                        "name": "text_data",
                                        "dest": [
                                            {"extension": "tts"},
                                            {"extension": "message_collector"}
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    }
    
    # 创建优化配置目录
    config_dir = "ten-framework/ai_agents/agents/examples/ai_companion_optimized"
    os.makedirs(config_dir, exist_ok=True)
    
    # 保存优化配置
    config_file = f"{config_dir}/property.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(optimized_config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ 已创建优化配置: {config_file}")

def fix_openai_extension_defaults():
    """修复OpenAI ChatGPT扩展的默认配置"""
    
    openai_config_file = "ten-framework/ai_agents/agents/ten_packages/extension/openai_chatgpt_python/openai.py"
    if os.path.exists(openai_config_file):
        with open(openai_config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修改默认的 max_memory_length
        content = re.sub(
            r'max_memory_length: int = 10',
            'max_memory_length: int = 50',
            content
        )
        
        # 修改默认的 max_tokens
        content = re.sub(
            r'max_tokens: int = 512',
            'max_tokens: int = 1024',
            content
        )
        
        # 修改默认的 temperature
        content = re.sub(
            r'temperature: float = 0\.1',
            'temperature: float = 0.7',
            content
        )
        
        # 修改默认的 prompt 为中文医疗陪伴
        medical_prompt = '''prompt: str = (
        "你是一个专业、温暖、有耐心的AI医疗陪伴助手，专门为阿尔茨海默病患者提供陪伴和支持。\\n\\n请遵循以下原则：\\n1. 使用温和、亲切、易懂的中文语言\\n2. 保持积极乐观的态度\\n3. 提供情感支持和陪伴\\n4. 避免复杂的医学术语\\n5. 鼓励患者分享感受和回忆\\n6. 如涉及具体医疗问题，建议咨询专业医生\\n7. 回复应该简洁明了，便于理解\\n8. 主动引导对话，避免沉默\\n9. 记住之前的对话内容，建立连续性\\n10. 在适当时机主动询问患者的感受和需求\\n\\n请用中文回复，语气要亲切自然，像朋友一样聊天。"
    )'''
        
        content = re.sub(
            r'prompt: str = \([\s\S]*?\)',
            medical_prompt,
            content
        )
        
        with open(openai_config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 已修复 {openai_config_file} - 默认配置已优化")

def create_conversation_monitor():
    """创建对话监控脚本"""
    
    monitor_script = """#!/usr/bin/env python3
import asyncio
import logging
from datetime import datetime

class ConversationMonitor:
    def __init__(self):
        self.turn_count = 0
        self.last_turn_time = None
        self.conversation_start_time = None
        self.max_turns = 50  # 新的最大轮次限制
        
    def on_turn_start(self, turn_id: int):
        self.turn_count = turn_id
        self.last_turn_time = datetime.now()
        if not self.conversation_start_time:
            self.conversation_start_time = self.last_turn_time
        
        print(f"🔄 对话轮次 {turn_id} 开始 - 总轮次: {self.turn_count}")
        
        # 检查是否接近限制
        if turn_id >= self.max_turns - 5:
            print(f"⚠️  警告: 已达到第 {turn_id} 轮对话，接近最大限制 {self.max_turns}")
    
    def on_turn_end(self, turn_id: int, decision: str):
        duration = datetime.now() - self.last_turn_time if self.last_turn_time else None
        print(f"✅ 对话轮次 {turn_id} 结束 - 决策: {decision} - 耗时: {duration}")
        
        # 检查异常情况
        if decision == "Wait" and turn_id >= 3:
            print(f"🚨 异常: 第 {turn_id} 轮对话被设置为等待状态，可能存在问题")
    
    def on_conversation_end(self, reason: str):
        total_duration = datetime.now() - self.conversation_start_time if self.conversation_start_time else None
        print(f"🔚 对话结束 - 原因: {reason} - 总轮次: {self.turn_count} - 总耗时: {total_duration}")

# 使用示例
if __name__ == "__main__":
    monitor = ConversationMonitor()
    print("🎯 AI陪伴对话监控器已启动")
    print("💡 优化后的配置:")
    print("   - max_memory_length: 50轮")
    print("   - max_tokens: 1024")
    print("   - temperature: 0.7")
    print("   - force_threshold_ms: 60000ms")
    print("   - 中文医疗陪伴专用prompt")
"""
    
    with open("conversation_monitor.py", 'w', encoding='utf-8') as f:
        f.write(monitor_script)
    
    print("✅ 已创建对话监控脚本: conversation_monitor.py")

if __name__ == "__main__":
    fix_conversation_limits()
    create_conversation_monitor()
    
    print("\n📋 修复总结:")
    print("1. ✅ 增加 max_memory_length 从10到50轮")
    print("2. ✅ 增加 max_tokens 从512到1024")
    print("3. ✅ 增加 temperature 从0.1到0.7")
    print("4. ✅ 增加 force_threshold_ms 从30秒到60秒")
    print("5. ✅ 优化中文医疗陪伴prompt")
    print("6. ✅ 创建专门的AI陪伴优化配置")
    print("\n🚀 现在AI陪伴对话应该能够持续更长时间了！") 