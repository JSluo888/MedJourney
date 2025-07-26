#!/usr/bin/env python3
"""
TEN Agent 对话三轮后停止问题修复脚本

问题分析：
1. 强制聊天超时时间过短（默认5秒）
2. 对话内存长度限制过小（默认10轮）
3. Turn Detection决策逻辑可能过于严格

解决方案：
1. 增加强制聊天超时时间到30秒或完全禁用
2. 增加对话内存长度到50轮
3. 优化Turn Detection决策逻辑
"""

import os
import json
import re
from pathlib import Path

def fix_ten_agent_configs():
    """修复TEN Agent配置以解决对话轮次限制问题"""
    
    # 1. 修复强制聊天超时配置
    config_file = "ten-framework/ai_agents/agents/ten_packages/extension/ten_turn_detection/config.py"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 将强制聊天超时从5秒增加到30秒
        content = re.sub(
            r'force_threshold_ms: int = \d+',
            'force_threshold_ms: int = 30000  # 30秒超时',
            content
        )
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复 {config_file} - 强制聊天超时增加到30秒")
    
    # 2. 修复对话内存长度配置
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
            
            # 将max_memory_length从10增加到50
            content = re.sub(
                r'"max_memory_length": 10',
                '"max_memory_length": 50',
                content
            )
            
            # 将max_history从10增加到50
            content = re.sub(
                r'"max_history": 10',
                '"max_history": 50',
                content
            )
            
            with open(prop_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修复 {prop_file} - 对话内存长度增加到50轮")
    
    # 3. 创建优化后的Turn Detection配置
    optimized_config = {
        "ten": {
            "predefined_graphs": [
                {
                    "name": "optimized_conversation",
                    "auto_start": True,
                    "graph": {
                        "nodes": [
                            {
                                "type": "extension",
                                "name": "ten_turn_detection",
                                "addon": "ten_turn_detection",
                                "extension_group": "default",
                                "property": {
                                    "force_threshold_ms": 30000,  # 30秒超时
                                    "temperature": 0.1,
                                    "top_p": 0.1
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
    
    optimized_config_file = "ten-framework/ai_agents/agents/examples/optimized_conversation/property.json"
    os.makedirs(os.path.dirname(optimized_config_file), exist_ok=True)
    
    with open(optimized_config_file, 'w', encoding='utf-8') as f:
        json.dump(optimized_config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ 已创建优化配置 {optimized_config_file}")

def create_conversation_monitor():
    """创建对话监控脚本来检测对话停止问题"""
    
    monitor_script = """#!/usr/bin/env python3
import asyncio
import logging
from datetime import datetime

class ConversationMonitor:
    def __init__(self):
        self.turn_count = 0
        self.last_turn_time = None
        self.conversation_start_time = None
        
    def on_turn_start(self, turn_id: int):
        self.turn_count = turn_id
        self.last_turn_time = datetime.now()
        if not self.conversation_start_time:
            self.conversation_start_time = self.last_turn_time
        
        print(f"🔄 对话轮次 {turn_id} 开始 - 总轮次: {self.turn_count}")
        
        # 检查是否接近限制
        if turn_id >= 3:
            print(f"⚠️  警告: 已达到第 {turn_id} 轮对话，可能接近限制")
    
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
    print("🎯 TEN Agent 对话监控器已启动")
    print("💡 建议: 如果对话在3轮后停止，请检查以下配置:")
    print("   1. force_threshold_ms 是否过短")
    print("   2. max_memory_length 是否过小")
    print("   3. Turn Detection 决策逻辑是否正确")
"""
    
    with open("conversation_monitor.py", 'w', encoding='utf-8') as f:
        f.write(monitor_script)
    
    print("✅ 已创建对话监控脚本 conversation_monitor.py")

def main():
    """主函数"""
    print("🔧 TEN Agent 对话轮次限制问题修复工具")
    print("=" * 50)
    
    # 检查当前工作目录
    if not os.path.exists("ten-framework"):
        print("❌ 错误: 请在包含 ten-framework 目录的项目根目录运行此脚本")
        return
    
    # 执行修复
    fix_ten_agent_configs()
    create_conversation_monitor()
    
    print("\n" + "=" * 50)
    print("🎉 修复完成！")
    print("\n📋 修复内容总结:")
    print("1. ✅ 强制聊天超时时间从5秒增加到30秒")
    print("2. ✅ 对话内存长度从10轮增加到50轮")
    print("3. ✅ 创建了优化配置示例")
    print("4. ✅ 创建了对话监控脚本")
    
    print("\n🚀 下一步操作:")
    print("1. 重启TEN Agent服务")
    print("2. 使用新的配置进行测试")
    print("3. 运行 conversation_monitor.py 监控对话")
    print("4. 如果问题仍然存在，考虑完全禁用强制聊天超时")
    
    print("\n💡 可选配置:")
    print("- 完全禁用强制聊天超时: 将 force_threshold_ms 设置为 0")
    print("- 进一步增加内存长度: 将 max_memory_length 设置为 100")
    print("- 调整Turn Detection温度: 将 temperature 设置为 0.3")

if __name__ == "__main__":
    main() 