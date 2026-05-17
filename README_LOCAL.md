# AI约会吸引力顾问 V0.5 本地版

这个版本不再是普通穿搭报告，而是「约会吸引力诊断」：

- 问用户想吸引什么类型的人；
- AI 先识别照片可见事实；
- 再判断当前形象释放什么社交/约会信号；
- 最后给出如何靠发型、穿搭、细节去接近目标对象偏好的建议。

## 本地运行

```bash
npm install
npm run dev:local
```

打开 Vite 地址，例如：

```text
http://localhost:5173/
```

## 环境变量

复制 `.env.example` 为 `.env`，填入：

```env
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的阿里百炼API_KEY
AI_MODEL=qwen-vl-plus-latest
AI_TIMEOUT_MS=120000
AI_MAX_TOKENS=2600
AI_PHOTO_LIMIT=3
PORT=3001
```

如果生成太慢，可以先把：

```env
AI_PHOTO_LIMIT=1
```

用于调试。
