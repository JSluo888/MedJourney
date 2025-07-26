#!/usr/bin/env python3
"""
TEN Agent 对话轮次限制修复测试脚本

测试修复后的配置是否解决了对话三轮后停止的问题
"""

import json
import os
from pathlib import Path

def test_config_fixes():
    """测试配置修复是否生效"""
    
    print("🔍 测试TEN Agent配置修复效果")
    print("=" * 50)
    
    # 1. 测试强制聊天超时配置
    config_file = "ten-framework/ai_agents/agents/ten_packages/extension/ten_turn_detection/config.py"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'force_threshold_ms: int = 30000' in content:
            print("✅ 强制聊天超时已修复: 30秒 (原来是5秒)")
        else:
            print("❌ 强制聊天超时修复失败")
    else:
        print("❌ 配置文件不存在")
    
    # 2. 测试对话内存长度配置
    property_file = "ten-framework/ai_agents/agents/examples/demo/property.json"
    if os.path.exists(property_file):
        with open(property_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 统计修复的数量
        original_count = content.count('"max_memory_length": 10')
        fixed_count = content.count('"max_memory_length": 50')
        
        if fixed_count > 0:
            print(f"✅ 对话内存长度已修复: {fixed_count} 处从10增加到50")
        else:
            print("❌ 对话内存长度修复失败")
        
        if original_count > 0:
            print(f"⚠️  仍有 {original_count} 处使用原始配置")
    else:
        print("❌ 属性配置文件不存在")
    
    # 3. 检查其他相关配置
    print("\n📋 其他相关配置检查:")
    
    # 检查是否有其他限制配置
    if os.path.exists(property_file):
        with open(property_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查max_tokens配置
        if '"max_tokens": 512' in content:
            print("✅ max_tokens配置正常: 512")
        
        # 检查temperature配置
        if '"temperature": 0.9' in content:
            print("✅ temperature配置正常: 0.9")
        
        # 检查是否有turn_detection相关配置
        if 'turn_detection' in content:
            print("✅ 发现turn_detection配置")
        else:
            print("ℹ️  未发现turn_detection配置")

def generate_test_scenario():
    """生成测试场景建议"""
    
    print("\n🧪 测试场景建议:")
    print("=" * 50)
    
    scenarios = [
        {
            "name": "基础对话测试",
            "description": "进行3-5轮基础对话，验证不会在第3轮停止",
            "steps": [
                "1. 启动TEN Agent",
                "2. 进行3轮基础问答",
                "3. 继续第4、5轮对话",
                "4. 验证对话正常进行"
            ]
        },
        {
            "name": "长时间对话测试", 
            "description": "进行10轮以上的长时间对话，验证内存管理",
            "steps": [
                "1. 启动TEN Agent",
                "2. 进行10轮连续对话",
                "3. 检查对话连贯性",
                "4. 验证没有内存溢出"
            ]
        },
        {
            "name": "超时测试",
            "description": "测试30秒超时机制是否正常工作",
            "steps": [
                "1. 启动对话",
                "2. 用户说话后等待25秒",
                "3. 验证不会过早结束",
                "4. 等待30秒后验证强制处理"
            ]
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{i}. {scenario['name']}")
        print(f"   描述: {scenario['description']}")
        print("   步骤:")
        for step in scenario['steps']:
            print(f"   {step}")

def create_monitoring_guide():
    """创建监控指南"""
    
    print("\n📊 监控指南:")
    print("=" * 50)
    
    guide = """
监控要点:
1. 对话轮次计数 (next_turn_id)
2. 强制聊天任务状态 (eval_force_chat_task)
3. 内存使用情况 (max_memory_length)
4. 超时时间设置 (force_threshold_ms)

关键日志:
- "force chat to process new turn" - 强制聊天触发
- "end_of_turn, send new turn" - 轮次结束
- "cancel eval_force_chat task" - 取消强制任务

如果问题仍然存在:
1. 检查日志中的轮次计数
2. 验证超时时间是否正确应用
3. 确认内存长度是否足够
4. 考虑完全禁用强制聊天超时
"""
    
    print(guide)

def main():
    """主函数"""
    print("🎯 TEN Agent 对话轮次限制修复测试")
    print("=" * 60)
    
    # 检查当前工作目录
    if not os.path.exists("ten-framework"):
        print("❌ 错误: 请在包含 ten-framework 目录的项目根目录运行此脚本")
        return
    
    # 执行测试
    test_config_fixes()
    generate_test_scenario()
    create_monitoring_guide()
    
    print("\n" + "=" * 60)
    print("🎉 测试完成！")
    print("\n🚀 下一步操作:")
    print("1. 重启TEN Agent服务")
    print("2. 按照测试场景进行验证")
    print("3. 监控日志确认修复效果")
    print("4. 如果问题仍然存在，考虑其他解决方案")

if __name__ == "__main__":
    main() 