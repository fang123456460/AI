import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  RefreshCw,
  Scissors,
  Send,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Target,
  UserRound,
  Zap,
} from "lucide-react";

const steps = ["首页", "目标", "真人照片", "授权", "生成", "报告"];

const socialGoals = [
  "提升异性吸引力",
  "准备相亲/约会",
  "社交软件形象变好",
  "从朋友感变成恋爱感",
  "看起来更成熟/更有价值",
  "让AI判断我适合吸引谁",
];

const targetTypesByGender = {
  男: ["清纯甜美型", "成熟知性型", "外向活泼型", "精致颜控型", "文艺松弛型", "现实稳定型", "高价值事业型", "暂时不知道，让AI判断"],
  女: ["成熟稳定型", "阳光运动型", "事业精英型", "温柔细腻型", "高情绪价值型", "文艺松弛型", "颜值氛围型", "暂时不知道，让AI判断"],
};

const painPoints = [
  "看起来太普通",
  "没有恋爱感",
  "像朋友不像对象",
  "不够成熟",
  "不够精致",
  "不够有生活质感",
  "不够干净",
  "不知道自己该走什么路线",
];

const changeLevels = ["轻微调整：不想变化太大", "中度调整：可以换发型/换部分衣服", "明显改变：愿意重塑形象"];
const contexts = ["普通日常", "朋友聚会", "第一次约会", "相亲", "校园/上班", "社交软件展示"];

const fallbackReport = {
  scores: { attraction: 68, match: 62, clarity: 60, keyword: "待校准" },
  snapshot: {
    visibleFacts: ["当前照片信息有限，只能做初步判断。", "可见发型、上衣和整体穿搭轮廓。"],
    uncertain: ["真实身高、体重、发质细节、面料质感无法仅凭照片完全判断。"],
  },
  currentSignal: {
    summary: "你当前形象更偏自然、好相处，但恋爱吸引力信号还不够明确。现在不是单纯穿搭问题，而是别人很难从第一眼判断你属于哪种有吸引力的类型。",
    easyToAttract: ["喜欢自然、不油腻、低压力相处感的人", "对外形攻击性要求不高、更看重舒服感的人"],
    weakWith: ["强颜控型", "偏爱强氛围感或强精致感的人"],
  },
  targetMatch: {
    targetLabel: "暂时不知道，让AI判断",
    matchLevel: "中等偏低",
    gap: ["当前外在信号不够聚焦", "发型和穿搭没有形成明确记忆点", "社交场景完成度不足"],
  },
  route: {
    name: "低压力社交吸引力路线",
    keywords: ["自然", "舒服", "有打理感", "不油腻"],
    keep: ["亲和感", "自然感"],
    remove: ["过于随意的鞋/衣服", "没有轮廓的发型"],
    avoid: ["过度商务", "过度网红", "和本人气质不连续的大改造"],
  },
  priority: [
    { signal: "发型信号", evidence: "照片里发型轮廓还不够明确。", action: "先把发型调整到更有打理感。", why: "发型是第一眼判断你是否认真打理自己的关键。" },
    { signal: "社交完成度信号", evidence: "当前穿搭偏日常生活化。", action: "把上衣/下装换成更适合见人的基础组合。", why: "不是要变潮，而是去掉临时出门感。" },
    { signal: "细节信号", evidence: "鞋、配色、版型还没有形成统一方向。", action: "建立一套固定社交穿搭公式。", why: "稳定的外在信号比随机穿搭更容易被记住。" },
  ],
  actionPlan: {
    hair: "先确认头发长度、两侧、顶部和发尾轮廓，再做低成本修剪。",
    outfit: "用一套更清晰的日常社交组合替代过于随意的搭配。",
    detail: "鞋子、包、手表、饰品只保留一个记忆点，不要堆满。",
    dontDo: "不要为了显得会穿而突然跳到和自己气质断层的风格。",
  },
  dateFormula: {
    mainLook: "低压力日常社交感",
    formula: "合身基础上衣 + 能修饰比例的下装 + 干净鞋型 + 一个小细节记忆点",
    why: "这条路线不要求你变成另一个人，而是把当前亲和感变成更有恋爱可能性的信号。",
  },
  plan7: ["只做一次发型轮廓调整，不做夸张造型。", "整理掉明显变形、起球、太生活化的上衣。", "准备一套可用于见人的日常社交搭配。", "用同一套搭配见一次朋友，观察反馈。", "补一个低成本细节：鞋、表、项链、包任选其一。", "根据目标对象调整成熟度或亲和度。", "复盘：哪一点最容易被别人注意到。"],
  conclusion: "你现在最需要的不是学习一堆穿搭术语，而是让外在信号更清晰：你想吸引谁，就让发型、衣服、细节都朝同一个方向说话。",
};


function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function ensureObj(value, fallback = {}) {
  return isPlainObject(value) ? value : fallback;
}

function toText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => toText(v)).filter(Boolean).join("；");
  if (isPlainObject(value)) return Object.values(value).map((v) => toText(v)).filter(Boolean).join("；");
  return fallback;
}

function toArray(value) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((v) => toArray(v)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[\n；;]/)
      .map((x) => x.replace(/^[-•\d.、\s]+/, "").trim())
      .filter(Boolean);
  }
  if (isPlainObject(value)) return Object.values(value).flatMap((v) => toArray(v)).filter(Boolean);
  return [String(value)];
}

function normalizePriority(value) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return arr.slice(0, 3).map((item, index) => {
    if (isPlainObject(item)) {
      return {
        signal: toText(item.signal, `第${index + 1}个吸引力信号`),
        evidence: toText(item.evidence, "暂无明确照片依据"),
        action: toText(item.action, "先补充更清晰照片或做低成本调整"),
        why: toText(item.why, "有助于让外在信号更清晰"),
      };
    }
    return { signal: toText(item, `第${index + 1}个吸引力信号`), evidence: "", action: "", why: "" };
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error) };
  }
  componentDidCatch(error, info) {
    console.error("[ui] render crashed", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f6f6f4] p-5 text-zinc-950">
          <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">报告展示出错</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">AI 返回的数据结构不稳定，页面已经拦截白屏。请重新生成一次，或把这段错误发给开发者。</p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-zinc-100 p-3 text-xs text-red-600">{this.state.message}</pre>
            <button onClick={() => window.location.reload()} className="mt-5 w-full rounded-2xl bg-black px-5 py-4 font-semibold text-white">刷新重试</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Pill({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-black bg-black text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}>
      {children}
    </button>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-2xl bg-zinc-100 p-2"><Icon size={18} /></div>
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="text-sm leading-7 text-zinc-700">{children}</div>
    </div>
  );
}

function Progress({ current }) {
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        {steps.map((s, index) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div className={`h-2 w-full rounded-full ${index <= current ? "bg-black" : "bg-zinc-200"}`} />
            <span className={`text-[10px] ${index <= current ? "text-black" : "text-zinc-400"}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function resizeImage(file, maxSide = 640, quality = 0.55) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function UploadBox({ label, helper, photo, onChange }) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center transition hover:bg-zinc-100">
      {photo?.preview ? <img src={photo.preview} alt={label} className="h-36 w-full rounded-2xl object-cover" /> : <><ImagePlus className="mb-3 text-zinc-500" size={28} /><div className="text-sm font-medium text-zinc-900">{label}</div><div className="mt-1 text-xs text-zinc-500">{helper}</div></>}
      <input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const dataUrl = await resizeImage(file); onChange({ preview: dataUrl, dataUrl, name: file.name }); }} />
    </label>
  );
}

function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">{error}</div>;
}

function TextList({ items }) {
  const list = toArray(items);
  if (!list.length) return <p className="text-zinc-500">暂无明确判断</p>;
  return <ul className="list-inside list-disc space-y-1">{list.map((item, i) => <li key={i}>{item}</li>)}</ul>;
}

function ReportView({ report }) {
  const r = report?.rawText ? fallbackReport : { ...fallbackReport, ...ensureObj(report, {}) };
  const scores = { ...fallbackReport.scores, ...ensureObj(r.scores, {}) };
  const snapshot = { ...fallbackReport.snapshot, ...ensureObj(r.snapshot, {}) };
  const currentSignal = { ...fallbackReport.currentSignal, ...ensureObj(r.currentSignal, {}) };
  const targetMatch = { ...fallbackReport.targetMatch, ...ensureObj(r.targetMatch, {}) };
  const route = { ...fallbackReport.route, ...ensureObj(r.route, {}) };
  const actionPlan = { ...fallbackReport.actionPlan, ...ensureObj(r.actionPlan, {}) };
  const dateFormula = { ...fallbackReport.dateFormula, ...ensureObj(r.dateFormula, {}) };
  const priority = normalizePriority(r.priority || fallbackReport.priority);
  const plan7 = toArray(r.plan7 || fallbackReport.plan7);

  return (
    <div className="space-y-5">
      {report?.rawText && <SectionCard icon={MessageCircle} title="AI 原始报告">{report.rawText}</SectionCard>}
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">AI约会吸引力诊断报告</h2>
            <p className="mt-2 text-sm text-zinc-500">不是教你穿搭，而是判断你现在释放什么吸引力信号，以及如何更接近想吸引的人。</p>
          </div>
          <div className="rounded-full bg-black px-3 py-1 text-xs text-white">真实生成</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{toText(scores.attraction, 68)}</div><div className="text-xs text-zinc-500">恋爱感指数</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{toText(scores.match, 62)}</div><div className="text-xs text-zinc-500">目标匹配度</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{toText(scores.keyword, "待校准")}</div><div className="text-xs text-zinc-500">核心信号</div></div>
        </div>
      </div>

      <SectionCard icon={Target} title="一、照片里能确认的事实">
        <p className="font-semibold text-zinc-900">我能看到：</p>
        <TextList items={snapshot.visibleFacts} />
        <p className="mt-3 font-semibold text-zinc-900">我不能确定：</p>
        <TextList items={snapshot.uncertain} />
      </SectionCard>

      <SectionCard icon={Heart} title="二、你当前释放的约会信号">
        <p>{toText(currentSignal.summary)}</p>
        <div className="mt-3 rounded-2xl bg-zinc-50 p-4"><b>更容易吸引：</b><TextList items={currentSignal.easyToAttract} /></div>
        <div className="mt-3 rounded-2xl bg-zinc-50 p-4"><b>目前较难吸引：</b><TextList items={currentSignal.weakWith} /></div>
      </SectionCard>

      <SectionCard icon={Zap} title="三、你想吸引的人，当前会不会被你吸引？">
        <p><b>目标对象：</b>{toText(targetMatch.targetLabel)}</p>
        <p><b>当前匹配：</b>{toText(targetMatch.matchLevel)}</p>
        <div className="mt-3"><b>主要差距：</b><TextList items={targetMatch.gap} /></div>
      </SectionCard>

      <SectionCard icon={Sparkles} title="四、你的主路线，不给三个水风格">
        <p><b>主路线：</b>{toText(route.name)}</p>
        <p><b>关键词：</b>{toArray(route.keywords).join(" / ") || "待校准"}</p>
        <div className="mt-3 grid gap-3">
          <div className="rounded-2xl bg-zinc-50 p-4"><b>保留：</b><TextList items={route.keep} /></div>
          <div className="rounded-2xl bg-zinc-50 p-4"><b>去掉：</b><TextList items={route.remove} /></div>
          <div className="rounded-2xl bg-zinc-50 p-4"><b>避开：</b><TextList items={route.avoid} /></div>
        </div>
      </SectionCard>

      <SectionCard icon={CheckCircle2} title="五、最该先改的 3 个吸引力信号">
        <div className="space-y-3">
          {priority.map((p, i) => <div key={i} className="rounded-2xl bg-zinc-50 p-4"><b>{i + 1}. {toText(p.signal)}</b><p className="mt-1"><span className="text-zinc-500">依据：</span>{toText(p.evidence)}</p><p><span className="text-zinc-500">动作：</span>{toText(p.action)}</p><p><span className="text-zinc-500">为什么有效：</span>{toText(p.why)}</p></div>)}
        </div>
      </SectionCard>

      <SectionCard icon={Scissors} title="六、发型/穿搭/细节怎么改">
        <p><b>发型：</b>{toText(actionPlan.hair)}</p>
        <p><b>穿搭：</b>{toText(actionPlan.outfit)}</p>
        <p><b>细节：</b>{toText(actionPlan.detail)}</p>
        <p><b>不要做：</b>{toText(actionPlan.dontDo)}</p>
      </SectionCard>

      <SectionCard icon={Shirt} title="七、社交场景可执行公式">
        <p><b>主形象：</b>{toText(dateFormula.mainLook)}</p>
        <p><b>公式：</b>{toText(dateFormula.formula)}</p>
        <p><b>原因：</b>{toText(dateFormula.why)}</p>
      </SectionCard>

      <SectionCard icon={RefreshCw} title="八、7天吸引力调整计划">
        <ol className="list-inside list-decimal space-y-1">{plan7.map((item, i) => <li key={i}>{item}</li>)}</ol>
      </SectionCard>

      <SectionCard icon={CheckCircle2} title="九、总结">{toText(r.conclusion)}</SectionCard>
    </div>
  );
}

const reportKeyTitles = {
  scores: "评分",
  attraction: "恋爱感指数",
  match: "目标匹配度",
  clarity: "形象清晰度",
  keyword: "核心信号",
  snapshot: "照片事实",
  visibleFacts: "能确认看到",
  uncertain: "无法准确判断",
  currentSignal: "当前释放的约会信号",
  summary: "总结",
  easyToAttract: "容易吸引的人",
  weakWith: "较难吸引的人",
  targetMatch: "目标对象匹配",
  targetLabel: "目标对象",
  matchLevel: "匹配程度",
  gap: "主要差距",
  route: "主路线",
  name: "路线名称",
  keywords: "关键词",
  keep: "保留",
  remove: "去掉",
  avoid: "避开",
  priority: "最该先改的 3 个吸引力信号",
  signal: "信号",
  evidence: "依据",
  action: "动作",
  why: "为什么有效",
  actionPlan: "发型/穿搭/细节怎么改",
  hair: "发型",
  outfit: "穿搭",
  detail: "细节",
  dontDo: "不要做",
  dateFormula: "社交场景可执行公式",
  mainLook: "主形象",
  formula: "公式",
  plan7: "7天吸引力调整计划",
  conclusion: "总结",
};

function safeStringifyReport(value) {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    },
    2
  );
}

function formatReportValue(value, level = 0, key = "") {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        const text = formatReportValue(item, level + 1, key);
        if (!text) return "";
        const prefix = key === "plan7" ? `${index + 1}. ` : "- ";
        return `${prefix}${text.replace(/\n/g, "\n  ")}`;
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([childKey, childValue]) => {
        const text = formatReportValue(childValue, level + 1, childKey);
        if (!text) return "";
        const title = reportKeyTitles[childKey] || childKey;
        if (typeof childValue === "object") return `${title}：\n${text}`;
        return `${title}：${text}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return String(value);
}

function buildSafeReportText(report) {
  try {
    if (typeof report === "string") return report;
    if (report?.rawText) return String(report.rawText);
    const text = formatReportValue(report || fallbackReport);
    return text || safeStringifyReport(report || fallbackReport);
  } catch (error) {
    return `报告已经生成，但展示格式异常。\n\n错误：${String(error?.message || error)}\n\n原始数据：\n${safeStringifyReport(report || {})}`;
  }
}

function ReportShell({ report }) {
  const displayText = React.useMemo(() => buildSafeReportText(report || fallbackReport), [report]);
  return (
    <div className="space-y-5">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">AI约会吸引力诊断报告</h2>
            <p className="mt-2 text-sm text-zinc-500">当前为稳定展示模式：先保证报告一定能显示，不再因为 AI 返回格式变化导致白屏。</p>
          </div>
          <div className="rounded-full bg-black px-3 py-1 text-xs text-white">V0.5.3</div>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-3xl bg-zinc-50 p-4 text-sm leading-7 text-zinc-800">{displayText}</pre>
      </div>
    </div>
  );
}

export default function AIDateAttractionCoachApp() {
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState({ nickname: "", gender: "男", age: "23-28岁", city: "", temperature: "", socialGoal: "提升异性吸引力", targetType: "暂时不知道，让AI判断", changeLevel: "中度调整：可以换发型/换部分衣服", context: "普通日常" });
  const [selectedPainPoints, setSelectedPainPoints] = useState(["不知道自己该走什么路线"]);
  const [photos, setPhotos] = useState({ front: null, half: null, full: null });
  const [agreeAnalysis, setAgreeAnalysis] = useState(false);
  const [agreeTraining, setAgreeTraining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [feedback, setFeedback] = useState(0);
  const [note, setNote] = useState("");
  const progressIndex = useMemo(() => Math.min(page, 5), [page]);
  const targets = targetTypesByGender[profile.gender] || targetTypesByGender.男;
  const canContinueFromPhotos = photos.front && photos.half && photos.full;

  const updateProfile = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  async function generateReport() {
    setLoading(true); setError(""); setReport(null); setPage(4);
    const payload = {
      profile: { ...profile, painPoints: selectedPainPoints, agreeTraining },
      photos: [
        { type: "front", dataUrl: photos.front.dataUrl },
        { type: "half", dataUrl: photos.half.dataUrl },
        { type: "full", dataUrl: photos.full.dataUrl },
      ],
    };
    try {
      const res = await fetch("/api/generate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`接口返回了非 JSON 内容：${text.slice(0, 180)}`); }
      if (!res.ok) {
        const message = data?.code === "INVALID_USER_PHOTOS"
          ? data.error || "照片不符合要求：请上传本人正脸、半身、全身照片，不要上传商品图/物品图。"
          : data.error || data.detail || "报告生成失败";
        throw new Error(message);
      }
      setReport(data.report || fallbackReport); setPage(5);
    } catch (err) { setError(String(err.message || err)); } finally { setLoading(false); }
  }

  const resetAll = () => { setPage(0); setReport(null); setError(""); setFeedback(0); setNote(""); };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#f6f6f4] text-zinc-950">
      {page > 0 && <Progress current={progressIndex} />}
      <main className="mx-auto max-w-md px-4 py-6">
        {page > 0 && page !== 4 && <button onClick={() => setPage(Math.max(0, page - 1))} className="mb-4 flex items-center gap-1 text-sm text-zinc-500"><ArrowLeft size={16} /> 返回上一步</button>}

        {page === 0 && <div className="space-y-5">
          <div className="overflow-hidden rounded-[32px] bg-black p-6 text-white shadow-xl">
            <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs"><Heart size={14} /> AI约会吸引力顾问</div><div className="rounded-full bg-white/10 px-3 py-1 text-xs">V0.5.3</div></div>
            <h1 className="text-4xl font-black leading-tight tracking-tight">你现在会吸引谁？又该怎么吸引你想吸引的人？</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">上传真人照片，AI 分析你当前释放的约会信号、目标对象匹配度，以及发型/穿搭/细节该怎么调整。不是穿搭顾问，是恋爱形象教练。</p>
            <button onClick={() => setPage(1)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-black">开始吸引力诊断 <ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3"><div className="rounded-3xl bg-white p-4 shadow-sm"><Target size={22} /><p className="mt-3 text-sm font-semibold">目标对象</p><p className="mt-1 text-xs text-zinc-500">想吸引谁</p></div><div className="rounded-3xl bg-white p-4 shadow-sm"><Zap size={22} /><p className="mt-3 text-sm font-semibold">吸引力信号</p><p className="mt-1 text-xs text-zinc-500">别人怎么看你</p></div><div className="rounded-3xl bg-white p-4 shadow-sm"><Sparkles size={22} /><p className="mt-3 text-sm font-semibold">改造路径</p><p className="mt-1 text-xs text-zinc-500">怎么变更有感觉</p></div></div>
          <SectionCard icon={MessageCircle} title="这版和穿搭报告不同">问卷不再问你喜欢什么风格，而是问你想吸引什么样的人。AI 先识别你当前释放的信号，再给出和目标对象相关的建议。</SectionCard>
        </div>}

        {page === 1 && <div className="space-y-5">
          <div><h2 className="text-2xl font-black">你想提升哪种社交吸引力？</h2><p className="mt-2 text-sm text-zinc-500">不用懂穿搭，回答你想吸引什么人就行。</p></div>
          <SectionCard icon={UserRound} title="基础信息"><div className="space-y-3"><input value={profile.nickname} onChange={(e) => updateProfile("nickname", e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="昵称，如：Alan" /><div className="grid grid-cols-2 gap-3"><select value={profile.gender} onChange={(e) => { updateProfile("gender", e.target.value); updateProfile("targetType", "暂时不知道，让AI判断"); }} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black"><option>男</option><option>女</option></select><select value={profile.age} onChange={(e) => updateProfile("age", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black"><option>18-22岁</option><option>23-28岁</option><option>29-35岁</option><option>35岁以上</option></select></div><div className="grid grid-cols-2 gap-3"><input value={profile.city} onChange={(e) => updateProfile("city", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="城市，可选" /><input value={profile.temperature} onChange={(e) => updateProfile("temperature", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="温度，可选" /></div></div></SectionCard>
          <SectionCard icon={Heart} title="你的社交目标是什么？"><div className="flex flex-wrap gap-2">{socialGoals.map((item) => <Pill key={item} active={profile.socialGoal === item} onClick={() => updateProfile("socialGoal", item)}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={Target} title="你更想吸引哪类人？"><div className="flex flex-wrap gap-2">{targets.map((item) => <Pill key={item} active={profile.targetType === item} onClick={() => updateProfile("targetType", item)}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={MessageCircle} title="你现在最卡的问题，最多选2个"><div className="flex flex-wrap gap-2">{painPoints.map((item) => <Pill key={item} active={selectedPainPoints.includes(item)} onClick={() => setSelectedPainPoints((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : prev.length >= 2 ? [prev[1], item] : [...prev, item])}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={RefreshCw} title="你能接受多大改变？"><div className="flex flex-wrap gap-2">{changeLevels.map((item) => <Pill key={item} active={profile.changeLevel === item} onClick={() => updateProfile("changeLevel", item)}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={Sparkles} title="主要使用场景"><div className="flex flex-wrap gap-2">{contexts.map((item) => <Pill key={item} active={profile.context === item} onClick={() => updateProfile("context", item)}>{item}</Pill>)}</div></SectionCard>
          <button onClick={() => setPage(2)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-semibold text-white">下一步：上传真人照片 <ChevronRight size={18} /></button>
        </div>}

        {page === 2 && <div className="space-y-5"><div><h2 className="text-2xl font-black">上传 3 张照片</h2><p className="mt-2 text-sm text-zinc-500">越真实越好。AI 会看你当前释放的吸引力信号，不是给颜值打分。</p></div><UploadBox label="本人正脸照" helper="看脸型、发型、第一印象" photo={photos.front} onChange={(img) => setPhotos({ ...photos, front: img })} /><UploadBox label="本人半身照" helper="看上身轮廓、衣服信号" photo={photos.half} onChange={(img) => setPhotos({ ...photos, half: img })} /><UploadBox label="本人全身照" helper="看比例、鞋服完整度" photo={photos.full} onChange={(img) => setPhotos({ ...photos, full: img })} /><div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">当前版本不做云端照片存储，只把压缩后的图片发送给 AI 接口生成本次报告。</div><button disabled={!canContinueFromPhotos} onClick={() => setPage(3)} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold ${canContinueFromPhotos ? "bg-black text-white" : "bg-zinc-200 text-zinc-400"}`}>下一步：确认授权 <ChevronRight size={18} /></button></div>}

        {page === 3 && <div className="space-y-5"><div><h2 className="text-2xl font-black">隐私与授权</h2><p className="mt-2 text-sm text-zinc-500">本次分析授权和训练授权分开选择。</p></div><div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={20} /><h3 className="font-semibold">本次分析授权</h3></div><p className="text-sm leading-7 text-zinc-600">我同意上传真人照片和填写的信息用于生成本次 AI 约会吸引力诊断报告。照片会发送给已配置的 AI 服务商处理。</p><label className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm"><input type="checkbox" checked={agreeAnalysis} onChange={(e) => setAgreeAnalysis(e.target.checked)} />我同意用于本次吸引力诊断</label></div><div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><RefreshCw size={20} /><h3 className="font-semibold">产品优化/模型训练授权</h3></div><p className="text-sm leading-7 text-zinc-600">我自愿同意将照片、问卷信息、AI 诊断结果和反馈用于产品优化、风格判断规则优化和模型训练。</p><label className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm"><input type="checkbox" checked={agreeTraining} onChange={(e) => setAgreeTraining(e.target.checked)} />我自愿授权用于产品优化和模型训练</label></div><button disabled={!agreeAnalysis} onClick={generateReport} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold ${agreeAnalysis ? "bg-black text-white" : "bg-zinc-200 text-zinc-400"}`}>生成我的吸引力报告 <Sparkles size={18} /></button></div>}

        {page === 4 && <div className="space-y-5 py-12 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-white"><Loader2 className="animate-spin" size={34} /></div><div><h2 className="text-2xl font-black">正在生成吸引力报告</h2><p className="mt-3 text-sm leading-7 text-zinc-500">AI 正在分析照片、目标对象和当前外在信号。通常需要 10-60 秒。</p></div><ErrorBox error={error} />{error && <button onClick={() => setPage(3)} className="rounded-2xl bg-black px-5 py-4 font-semibold text-white">返回检查配置</button>}</div>}

        {page === 5 && <div className="space-y-5"><ReportShell report={report || fallbackReport} /><div className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="font-semibold">你觉得这份报告像在说你吗？</h3><div className="mt-4 flex gap-2">{[1,2,3,4,5].map((score) => <button key={score} onClick={() => setFeedback(score)} className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${feedback >= score ? "border-black bg-black text-white" : "border-zinc-200 bg-white text-zinc-400"}`}><Star size={18} fill={feedback >= score ? "currentColor" : "none"} /></button>)}</div></div><div className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="font-semibold">哪里不像你？哪里有用？</h3><textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-4 min-h-28 w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm outline-none focus:border-black" placeholder="比如：目标对象判断准，但发型建议不现实；或者报告还是太像模板……" /></div><button onClick={resetAll} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-semibold text-white">重新测试 <Send size={18} /></button></div>}
      </main>
    </div>
    </ErrorBoundary>
  );
}
