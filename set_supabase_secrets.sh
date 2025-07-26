#!/bin/bash
cd /workspace/supabase

# 检查并创建.env文件  
echo "STEPFUN_API_KEY=4kNO9CYMO1ddw4s20byLvrkYtBWXowdR1OcrY8Hi7tkapqi3gMAEAzNHCl3LKqFIy" > .env
echo "ELEVENLABS_API_KEY=sk_315efe2656c525c68c74b5b2ae5a25c0954b373548b9e1ac" >> .env
echo "AGORA_APP_ID=d83b679bc7b3406c83f63864cb74aa99" >> .env

# 尝试设置secrets，如果失败也继续
timeout 30s npx supabase secrets set --env-file .env 2>/dev/null || echo "Warning: Could not set secrets, but continuing..."

echo "Environment setup completed"
