import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.LOCAL_API_PORT || 3001;
const distDir = path.join(__dirname, "dist");

app.use(express.json({ limit: "20mb" }));

const JSON_SCHEMA_HINT = `
请只返回 JSON，不要使用 Markdown。所有中文必须像真人形象顾问说话，不要 AI 腔。JSON 字段必须包含：
{
  "scores": {"completion": 78, "keyword": "干净利落", "style": "春夏简约日常/社交风"},
  "overall": "整体第一印象，120-180字。必须基于照片可见信息，不要空泛夸奖。",
  "priority": [
    {"rank": 1, "change": "第一优先级要改什么", "why": "为什么先改它", "how": "具体怎么做"},
    {"rank": 2, "change": "第二优先级", "why": "原因", "how": "具体执行"},
    {"rank": 3, "change": "第三优先级", "why": "原因", "how": "具体执行"}
  ],
  "strengths": ["必须是照片里能看出来的优势1", "优势2", "优势3"],
  "problems": [
    {"title": "问题标题", "evidence": "你从照片看到的依据", "impact": "会带来的形象影响", "solution": "明确解决方案"}
  ],
  "hair": {
    "faceShape": "只做谨慎初步判断；不确定就说不确定",
    "currentIssue": "当前发型/头发状态的具体问题",
    "recommended": ["具体发型1", "具体发型2", "具体发型3"],
    "avoid": ["具体避雷1", "具体避雷2", "具体避雷3"],
    "barberScript": "给理发师看的短句，必须具体到两侧、顶部、发尾、层次/纹理；不要编造刘海",
    "dailyCare": "3步以内的日常打理建议"
  },
  "outfit": {
    "body": "基于照片的轮廓/比例判断；不羞辱用户；不确定就说明",
    "seasonContext": "根据用户填写的城市/季节/温度判断当前穿搭季节",
    "tops": "当前季节适合的上衣：给2-3个具体单品，不要空泛",
    "pants": "裤子建议：给具体裤型、裤长、颜色",
    "outerwear": "如果当前季节不需要外套，直接说不需要；不要硬推荐外套",
    "colors": "适合的颜色组合：用明确组合，比如白+深蓝/浅灰+黑",
    "avoid": "具体雷区：必须说明原因，不要泛泛而谈"
  },
  "styles": [
    {"name": "风格名，必须适合当前季节", "reason": "为什么适合他", "scene": "适合场景", "hair": "发型搭配", "clothing": "上衣+裤子+鞋子，必须具体", "vibe": "整体感觉，避免空话"}
  ],
  "dailyPlan": {
    "hair": "具体发型/打理方式",
    "top": "当前季节具体上衣",
    "pants": "具体裤子",
    "shoes": "具体鞋子",
    "outerwear": "当前季节是否需要外套；不需要就写：不需要外套",
    "accessories": "非必要不推荐配饰；如推荐必须具体且低成本",
    "reason": "为什么这套适合日常社交/提升审美"
  },
  "plan7": ["第1天具体动作", "第2天具体动作", "第3天具体动作", "第4天具体动作", "第5天具体动作", "第6天具体动作", "第7天具体动作"],
  "conclusion": "一句话总结：先改什么，怎么改，预计带来什么变化"
}`

function stripCodeFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeParseReport(text) {
  const clean = stripCodeFence(text || "");
  try {
    return JSON.parse(clean);
  } catch (error) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        return { rawText: clean };
      }
    }
    return { rawText: clean };
  }
}

async function callVisionAPI({ baseUrl, apiKey, model, messages }) {
  const payload = {
    model,
    messages,
    temperature: 0.25,
    max_tokens: Number(process.env.AI_MAX_TOKENS || 2200),
  };

  const controller = new AbortController();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 120000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      const error = new Error(text || `API request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

app.post("/api/generate-report", async (req, res) => {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return res.status(500).json({
      error: "AI接口还没有配置好。请检查 .env 文件中的 AI_BASE_URL、AI_API_KEY、AI_MODEL。",
      setupRequired: true,
    });
  }

  const { profile, photos } = req.body || {};
  if (!profile || !Array.isArray(photos) || photos.length < 1) {
    return res.status(400).json({ error: "缺少用户信息或照片。" });
  }

  const validPhotos = photos
    .filter((photo) => photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
    .slice(0, Number(process.env.AI_PHOTO_LIMIT || 3));

  if (validPhotos.length < 1) {
    return res.status(400).json({ error: "没有收到有效图片。" });
  }

  const currentDate = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
  const prompt = `
你是一名非常务实的真人形象顾问，不是时尚杂志编辑，也不是只会说套话的 AI。
你的任务：根据用户照片和问卷，给出一份“当下就能执行”的社交/日常形象诊断报告。

当前日期：${currentDate}
默认地域：中国大陆。
如果用户没有填写季节/气温：默认按中国大陆当前日期的常见季节处理。5-9月默认春夏/夏季，不要硬推荐厚外套、风衣、大衣、夹克叠穿；除非用户照片或问卷明确显示低温/秋冬场景。

用户问卷信息：
${JSON.stringify(profile, null, 2)}

核心方向：社交形象、日常穿搭、发型轮廓、审美提升。不是拍照教学，不输出头像拍摄建议，不分析怎么拍照。

绝对禁止：
1. 禁止颜值打分、身材羞辱、收入/职业/民族/健康等敏感推测。
2. 禁止胡说“外套不要超过大腿中部”这类不看季节、不看单品的模板话。
3. 禁止每个人都推荐“清爽轻熟风/韩系干净感”。可以推荐，但必须说明照片依据。
4. 禁止空话：提升气质、增强精致度、整体协调、显精神、干净感。除非后面跟具体动作。
5. 禁止硬塞配饰。配饰不是刚需，除非它真的能解决问题。
6. 禁止推荐不适合当前季节的单品。春夏优先短袖、衬衫、POLO、薄针织、轻薄长裤、休闲鞋；秋冬才考虑外套层次。
7. 禁止编造照片里看不到的发型细节。尤其是“刘海、发际线、发量、额头露出程度”，必须清楚可见才可以说；如果看不清，必须写“基于当前照片无法准确判断”。
8. 禁止输出头像拍摄、拍照角度、表情管理、背景选择等内容。

必须做到：
1. 每个建议都要落到具体单品/发型/动作，例如“白色重磅短袖 + 深蓝直筒牛仔裤 + 白色低帮板鞋”，不要只说“简约穿搭”。
2. 穿搭必须结合当前季节和温度。如果不需要外套，outerwear 字段直接写“不需要外套”。
3. 如果照片看不清全身/发型/肤色，必须明确说“基于当前照片无法准确判断”，不要装懂。
4. 报告语言要像真人顾问直接说话，少用书面腔。
5. 先给优先级：最应该先改的 3 件事。用户看完要知道今天先做什么。
6. 发型建议必须给“给理发师的话术”，不能只写发型名；但不要默认存在刘海。
7. 穿搭建议必须给“适合什么 + 不适合什么 + 为什么”。
8. 输出必须适合国内普通用户，不要欧美时尚腔，不要过度潮流，不要昂贵奢侈品逻辑。

判断标准：
- 好报告 = 用户看完可以直接去剪头发、调整日常穿搭、建立更稳定的社交形象。
- 烂报告 = 只有风格词、没有具体执行动作。

${JSON_SCHEMA_HINT}
`;

  const content = [
    { type: "text", text: prompt },
    ...validPhotos.map((photo) => ({
      type: "image_url",
      image_url: {
        url: photo.dataUrl,
        detail: "low",
      },
    })),
  ];

  const messages = [
    {
      role: "system",
      content:
        "你是一个专业、谨慎、友善但直接的 AI 形象顾问。你必须保护用户尊严，避免颜值羞辱；不要编造照片里看不清的发型细节；不要输出拍照教学。",
    },
    { role: "user", content },
  ];

  try {
    console.log(`[local-api] generating report with ${model}, photos=${validPhotos.length}`);
    const startedAt = Date.now();
    const data = await callVisionAPI({ baseUrl, apiKey, model, messages });
    const text = data?.choices?.[0]?.message?.content || "";
    const report = safeParseReport(text);
    console.log(`[local-api] done in ${Date.now() - startedAt}ms`);
    return res.json({ report, usage: data.usage || null });
  } catch (error) {
    console.error("[local-api] AI report failed:", error);
    return res.status(500).json({
      error: "AI报告生成失败。请检查 API Key、模型名、额度，或把 AI_PHOTO_LIMIT 改成 1 再试。",
      detail: String(error.message || error).slice(0, 1500),
    });
  }
});


// Production mode: after `npm run build`, serve the Vite frontend from /dist.
// API remains available at /api/generate-report on the same domain, so the API Key stays only on the server.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distDir, "index.html"));
    }
    return next();
  });
}

app.listen(PORT, () => {
  console.log(`\n[server] running at http://localhost:${PORT}`);
  console.log(`[server] timeout: ${process.env.AI_TIMEOUT_MS || 120000}ms`);
  console.log(`[server] static frontend: ${fs.existsSync(distDir) ? "enabled" : "not built yet"}`);
});
