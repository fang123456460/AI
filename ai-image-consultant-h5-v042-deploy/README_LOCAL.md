# V0.3.2 本地服务器版

这个版本用于绕开 Netlify Function 30 秒超时。AI 请求由本地 Node.js 后端发送，默认最长等待 120 秒。

## 使用步骤

1. 安装依赖

```bash
npm install
```

2. 复制 `.env.example`，改名为 `.env`，填入你的阿里百炼 API Key：

```env
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的阿里百炼API_KEY
AI_MODEL=qwen-vl-plus-latest
AI_TIMEOUT_MS=120000
AI_MAX_TOKENS=2200
AI_PHOTO_LIMIT=3
LOCAL_API_PORT=3001
```

3. 启动完整本地版本：

```bash
npm run dev:local
```

4. 打开终端显示的 Vite 地址，例如：

```text
http://localhost:5173/
```

如果还是慢，可以先把 `.env` 里的 `AI_PHOTO_LIMIT=3` 改成 `AI_PHOTO_LIMIT=1`，先测试一张照片。
