# AI 形象顾问 H5 - V0.3 真实 AI 生成版

这个版本已经从“静态 Demo”升级成“可真实生成报告”的测试版。

## 当前能力

- 用户填写问卷
- 上传正脸、半身、全身 3 张照片
- 前端自动压缩图片
- 调用 Netlify Function 后端
- 后端调用支持视觉输入的 OpenAI-compatible API
- 返回真实 AI 形象分析报告
- 页面展示完整报告
- 收集用户反馈

## 重要说明

1. ChatGPT Plus 不是 API Key。你需要单独有一个可调用视觉模型的 API Key。
2. 不要把 API Key 写在前端代码里。这个版本通过 Netlify Function 读取环境变量。
3. 旧版“拖 dist 文件夹部署”无法使用后端函数。V0.3 需要通过 Netlify CLI 或 GitHub 连接 Netlify 部署整个项目。

## 环境变量

在 Netlify 后台设置：

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=你的API_KEY
AI_MODEL=你的视觉模型名称
```

`AI_BASE_URL` 也可以填写其他兼容 OpenAI Chat Completions 格式的服务地址。

## 本地运行

```bash
npm install
npm install -g netlify-cli
```

把 `.env.example` 复制一份，改名为 `.env`，填入你的 API 信息。

然后运行：

```bash
netlify dev
```

打开终端显示的本地地址即可测试。

## 部署到 Netlify

### 方式 1：推荐，Netlify CLI 部署

```bash
npm install
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

注意：部署前或部署后，需要在 Netlify 后台设置环境变量。

### 方式 2：GitHub 连接 Netlify

1. 把整个项目上传到 GitHub。
2. Netlify 新建站点，选择这个 GitHub 仓库。
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Functions directory: `netlify/functions`
6. 设置环境变量。
7. Deploy。

## 常见问题

### 1. 报错：AI接口还没有配置好

说明没有设置：

- AI_BASE_URL
- AI_API_KEY
- AI_MODEL

### 2. 本地 `npm run dev` 能打开，但不能生成报告

正常。因为 `npm run dev` 只启动前端，不启动 Netlify Functions。要用：

```bash
netlify dev
```

### 3. 部署后能打开页面，但生成报告失败

大概率是：

- 环境变量没填
- 模型名不对
- API Key 不对
- 当前模型不支持图片输入
- 后端函数超时

### 4. 照片会保存吗？

当前版本前端不做云端存储，只把压缩后的图片发送给 AI 接口用于本次报告生成。真实上线前要完善隐私政策、删除功能、授权记录和数据安全策略。
