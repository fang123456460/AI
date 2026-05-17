# AI约会吸引力顾问 V0.5 部署版

推荐部署到阿里云 ECS / 轻量应用服务器。

## 服务器运行

```bash
source ~/.bashrc
nvm use 20
npm config set registry https://registry.npmmirror.com
npm install
npm run build
pm2 start local-server.js --name ai-date-attraction-coach
pm2 save
```

## 必填 `.env`

```env
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的阿里百炼API_KEY
AI_MODEL=qwen-vl-plus-latest
AI_TIMEOUT_MS=120000
AI_MAX_TOKENS=2600
AI_PHOTO_LIMIT=3
PORT=3001
```

## 访问

```text
http://你的公网IP:3001
```

如果打不开，确认阿里云安全组/防火墙已开放 TCP 3001。

## 更新已有 PM2 服务

```bash
pm2 stop ai-outfit-assistant || true
pm2 delete ai-outfit-assistant || true
pm2 start local-server.js --name ai-date-attraction-coach
pm2 save
```
