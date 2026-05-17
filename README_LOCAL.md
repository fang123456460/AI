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

app.use(express.json({ limit: "24mb" }));

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
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return { rawText: clean }; }
    }
    return { rawText: clean };
  }
}

async function callVisionAPI({ baseUrl, apiKey, model, messages, maxTokensOverride, temperatureOverride }) {
  const payload = {
    model,
    messages,
    temperature: temperatureOverride ?? 0.18,
    max_tokens: Number(maxTokensOverride || process.env.AI_MAX_TOKENS || 2600),
  };

  const controller = new AbortController();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 120000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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


function buildPhotoValidationPrompt(profile) {
  const gender = String(profile?.gender || "未填写");
  return `
你是照片准入审核器，只判断用户上传的图片是否适合用于「AI约会吸引力诊断」。
你的任务不是生成报告，不要给穿搭或恋爱建议，只做图片有效性判断。

用户填写性别：${gender}

有效照片标准：
1. 必须是真人照片，能看到真实人物本人，不是商品图、服装平铺图、电商产品图、广告图、模特商品图、风景图、宠物图、截图、表情包、动漫图。
2. 正脸/半身/全身三张图中，至少需要 2 张明确包含同一个真人主体；其中至少 1 张能看到脸部或头部轮廓，至少 1 张能看到上半身或全身穿着轮廓。
3. 如果图片里只有衣服、鞋、包、配饰、商品包装、家居物品、背景场景，不合格。
4. 如果人物太小、太模糊、被遮挡严重，无法分析形象，也不合格。
5. 不要因为照片质量普通就拒绝；只要是真人且能分析形象，可以通过。

请只返回 JSON，不要 Markdown：
{
  "isValid": true/false,
  "reason": "一句话说明为什么通过或拒绝",
  "photoStatus": [
    {"index": 1, "type": "front", "hasRealPerson": true/false, "hasFaceOrHead": true/false, "hasOutfit": true/false, "problem": "如果无问题写空字符串"},
    {"index": 2, "type": "half", "hasRealPerson": true/false, "hasFaceOrHead": true/false, "hasOutfit": true/false, "problem": "如果无问题写空字符串"},
    {"index": 3, "type": "full", "hasRealPerson": true/false, "hasFaceOrHead": true/false, "hasOutfit": true/false, "problem": "如果无问题写空字符串"}
  ],
  "userMessage": "给用户看的中文提示，说明需要重新上传什么照片"
}
`;
}

async function validateUserPhotos({ baseUrl, apiKey, model, profile, photos }) {
  const content = [
    { type: "text", text: buildPhotoValidationPrompt(profile) },
    ...photos.map((photo) => ({ type: "image_url", image_url: { url: photo.dataUrl, detail: "low" } })),
  ];
  const messages = [
    { role: "system", content: "你是严格的照片准入审核器。只判断图片是否是真人形象诊断可用照片。遇到电商商品图、服装平铺图、物品图必须拒绝。只返回 JSON。" },
    { role: "user", content },
  ];
  const data = await callVisionAPI({ baseUrl, apiKey, model, messages, maxTokensOverride: 700, temperatureOverride: 0.05 });
  const text = data?.choices?.[0]?.message?.content || "";
  const result = safeParseReport(text);
  return {
    isValid: result?.isValid === true,
    reason: String(result?.reason || "照片不符合真人形象诊断要求。"),
    userMessage: String(result?.userMessage || result?.reason || "请上传本人正脸、半身、全身照片，不要上传商品图或物品图。"),
    photoStatus: Array.isArray(result?.photoStatus) ? result.photoStatus : [],
    raw: result,
  };
}

function buildPrompt(profile) {
  const gender = String(profile?.gender || "未填写");
  const target = String(profile?.targetType || "暂时不知道，让AI判断");
  const goal = String(profile?.socialGoal || "提升异性吸引力");
  const changeLevel = String(profile?.changeLevel || "中度调整");
  const painPoints = Array.isArray(profile?.painPoints) ? profile.painPoints.join("、") : "未填写";
  const context = String(profile?.context || "普通日常");
  const temp = String(profile?.temperature || "未填写");
  const city = String(profile?.city || "未填写");
  const currentDate = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });

  const oppositeTypeGuide = gender.includes("女")
    ? `用户是女生。她想吸引的对象类型可能是：成熟稳定型、阳光运动型、事业精英型、温柔细腻型、高情绪价值型、文艺松弛型、颜值氛围型等。你要判断她当前外在信号更容易吸引哪类男生，以及和她目标对象之间的差距。不要把女生报告写成男生穿搭报告。`
    : `用户是男生。他想吸引的对象类型可能是：清纯甜美型、成熟知性型、外向活泼型、精致颜控型、文艺松弛型、现实稳定型、高价值事业型等。你要判断他当前外在信号更容易吸引哪类女生，以及和他目标对象之间的差距。不要把男生报告写成女生穿搭报告。`;

  return `
你不是穿搭顾问。你是「约会形象教练」和「社交吸引力分析师」。
你的目标不是让用户变时尚，而是判断：
1. 用户当前照片释放了什么约会/社交信号；
2. 用户当前容易吸引哪类人；
3. 用户想吸引的人，是否会被当前形象吸引；
4. 用户需要调整哪些外在信号，才能更接近目标对象偏好的类型。

当前日期：${currentDate}
用户性别：${gender}
用户社交目标：${goal}
用户想吸引的人：${target}
用户最卡的问题：${painPoints}
可接受改变程度：${changeLevel}
主要使用场景：${context}
城市：${city}
温度：${temp}

${oppositeTypeGuide}

先做事实识别，再做吸引力判断。不要直接套模板。普通用户不懂风格，你要把照片、目标对象、改变程度结合起来分析。

硬规则：
1. 不允许输出通用穿搭模板；不要每个人都推荐 Polo、直筒裤、低帮鞋、干净利落。
2. 不允许每个人都写“发型层次感不足”。只有照片里真的能看到发型问题，才可以写。
3. 不允许编造看不见的细节：刘海、发际线、发量、身高、体重、面料价格、品牌、职业、收入。
4. 如果看不清，必须写“当前照片无法准确判断”。
5. 所有建议必须服务于「吸引目标对象」，不要为了时尚而建议。
6. 不允许输出拍照教程、头像角度、表情、背景建议。
7. 不允许输出“购买一件/购买一双”这种电商口吻。用“可以尝试/优先选择/替换成”。
8. 不允许给三个泛泛风格。只能给一个主路线，以及保留/去掉/避开的信号。
9. 建议必须符合季节和场景。当前如果是春夏或温度高，不要硬推外套。
10. 语言要像真人约会形象教练，直接、具体、有依据，少空话。
11. 你可以指出问题，但不要羞辱用户，不要颜值打分，不要制造焦虑。
12. 用户未必知道自己想要什么，所以你要主动判断“当前更容易吸引谁”和“想吸引目标对象还差什么”。

请只返回 JSON，不要使用 Markdown，不要额外解释。字段必须完整：
{
  "scores": {
    "attraction": 0-100,
    "match": 0-100,
    "clarity": 0-100,
    "keyword": "2-5字核心吸引力信号，如低压力、亲和、松弛、成熟、明亮、精致；不要所有人都一样"
  },
  "snapshot": {
    "visibleFacts": ["只写照片里确实看得见的事实，包含发型轮廓/上衣/下装/鞋/整体状态；不确定就别写"],
    "uncertain": ["无法准确判断的内容"]
  },
  "currentSignal": {
    "summary": "100-180字，分析用户当前释放的约会/社交信号。不是穿搭描述，而是别人会如何感受这个人。",
    "easyToAttract": ["当前更容易吸引的人群1", "人群2", "人群3"],
    "weakWith": ["当前较难吸引的人群1", "人群2"]
  },
  "targetMatch": {
    "targetLabel": "用户想吸引的人。如果用户选择不知道，则由你判断最适合先吸引的人群",
    "matchLevel": "高/中高/中等/中低/低，并给一句简短原因",
    "gap": ["和目标对象偏好之间的差距1", "差距2", "差距3"]
  },
  "route": {
    "name": "唯一主路线名，要像恋爱吸引力路线，不要像普通穿搭风格，例如：低压力清爽社交型、温柔明亮恋爱感、成熟稳定生活质感型",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
    "keep": ["当前值得保留的吸引力信号"],
    "remove": ["当前需要去掉的负面信号"],
    "avoid": ["不建议走的方向，必须说明和目标对象不匹配"]
  },
  "priority": [
    {"signal": "第一个最该先改的吸引力信号", "evidence": "照片依据或问卷依据", "action": "具体动作", "why": "为什么这会提升目标对象匹配度"},
    {"signal": "第二个", "evidence": "依据", "action": "动作", "why": "原因"},
    {"signal": "第三个", "evidence": "依据", "action": "动作", "why": "原因"}
  ],
  "actionPlan": {
    "hair": "发型怎么调。必须基于可见事实；看不清就先让用户补充更清晰照片，不要编。",
    "outfit": "穿搭怎么调。不要列购物清单，要说替换逻辑和目标对象信号。",
    "detail": "细节怎么调，如鞋、包、饰品、衣服整洁度、颜色关系。非必要不要推荐配饰。",
    "dontDo": "最不建议用户做什么，因为它会削弱目标吸引力。"
  },
  "dateFormula": {
    "mainLook": "一个可执行的社交/约会形象名",
    "formula": "具体公式：发型 + 上衣 + 下装 + 鞋/细节。必须符合性别、季节、目标对象和改变程度。",
    "why": "为什么这套公式能帮助吸引目标对象"
  },
  "plan7": ["第1天", "第2天", "第3天", "第4天", "第5天", "第6天", "第7天"],
  "conclusion": "一句话总结：当前最关键的吸引力差距是什么，先改什么，改变后会更容易吸引谁。"
}
`;
}

app.post("/api/generate-report", async (req, res) => {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return res.status(500).json({ error: "AI接口还没有配置好。请检查 .env 文件中的 AI_BASE_URL、AI_API_KEY、AI_MODEL。", setupRequired: true });
  }

  const { profile, photos } = req.body || {};
  if (!profile || !Array.isArray(photos) || photos.length < 1) return res.status(400).json({ error: "缺少用户信息或照片。" });

  const validPhotos = photos
    .filter((photo) => photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
    .slice(0, Number(process.env.AI_PHOTO_LIMIT || 3));
  if (validPhotos.length < 1) return res.status(400).json({ error: "没有收到有效图片。" });

  try {
    console.log(`[local-api] validating photos with ${model}, photos=${validPhotos.length}`);
    const validation = await validateUserPhotos({ baseUrl, apiKey, model, profile, photos: validPhotos });
    if (!validation.isValid) {
      console.log("[local-api] invalid photos:", validation.reason);
      return res.status(422).json({
        error: validation.userMessage,
        code: "INVALID_USER_PHOTOS",
        validation,
      });
    }

    const content = [
      { type: "text", text: buildPrompt(profile) },
      ...validPhotos.map((photo) => ({ type: "image_url", image_url: { url: photo.dataUrl, detail: "low" } })),
    ];

    const messages = [
      { role: "system", content: "你是约会形象教练和社交吸引力分析师。你不是普通穿搭顾问。必须基于照片事实和目标对象做差异化分析，拒绝模板化。只返回 JSON。" },
      { role: "user", content },
    ];

    console.log(`[local-api] attraction report with ${model}, photos=${validPhotos.length}`);
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

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) return res.sendFile(path.join(distDir, "index.html"));
    return next();
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n[server] running at http://0.0.0.0:${PORT}`);
  console.log(`[server] timeout: ${process.env.AI_TIMEOUT_MS || 120000}ms`);
  console.log(`[server] static frontend: ${fs.existsSync(distDir) ? "enabled" : "not built yet"}`);
});
