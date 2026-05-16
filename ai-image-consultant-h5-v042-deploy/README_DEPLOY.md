# AI 形象顾问 V0.4.2 部署版

这个版本可以部署到 Render / Railway 这类 Node Web Service 平台。

## 本地测试

```bash
npm install
npm run dev:local
```

## 正式构建并本地模拟线上运行

```bash
npm run build
npm start
```

打开：

```text
http://localhost:3001/
```

## 必填环境变量

```env
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的阿里百炼API_KEY
AI_MODEL=qwen-vl-plus-latest
AI_TIMEOUT_MS=120000
AI_MAX_TOKENS=2200
AI_PHOTO_LIMIT=3
LOCAL_API_PORT=3001
```

线上平台一般会自动提供 `PORT`，不用手动填。

## 部署设置

Build Command:

```bash
npm install && npm run build
```

Start Command:

```bash
npm start
```

部署完成后，前端和后端在同一个域名下：

```text
https://你的域名/
https://你的域名/api/generate-report
```
