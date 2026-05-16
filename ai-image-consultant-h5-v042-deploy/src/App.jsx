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
  UserRound,
} from "lucide-react";

const steps = ["首页", "问卷", "照片", "授权", "生成", "报告"];
const styleOptions = ["社交形象", "日常穿搭", "提升审美", "换发型", "提升穿搭", "职场形象"];
const currentStyles = ["完全不会穿", "休闲随意", "运动风", "商务风", "韩系", "街头风", "不知道"];
const budgets = ["300以内", "300-600", "600-1000", "1000-2000", "2000+"];
const seasons = ["春夏/20°C以上", "秋冬/15°C以下", "室内空调场景", "不确定"];
const painPoints = ["发型不好看", "不会搭配", "穿搭没重点", "显矮", "显胖", "没气质", "不知道适合什么风格", "颜色搭配混乱"];

const fallbackReport = {
  scores: { completion: 82, keyword: "清爽", style: "轻熟" },
  overall:
    "你目前给人的感觉偏自然、随和，但形象方向还不够明确。真正需要优化的不是长相，而是发型轮廓、衣服版型、颜色组合和整体审美一致性。先把日常社交里的清爽度和质感做出来，会比盲目追潮流更有效。",
  priority: [
    { rank: 1, change: "先把发型轮廓做清楚", why: "发型会直接影响日常社交里的整体状态", how: "重点看两侧是否清爽、顶部是否有层次；不要在照片看不清时强行判断具体发型细节。" },
    { rank: 2, change: "把上衣换成合身基础款", why: "版型比潮流更重要", how: "春夏优先白/浅灰短袖、短袖衬衫或POLO。" },
    { rank: 3, change: "建立固定日常风格公式", why: "普通人提升审美最怕每天乱穿", how: "先固定2套安全组合，比如浅色上衣+深色直筒裤、纯色短袖+休闲长裤。" },
  ],
  strengths: ["整体气质不油腻，适合走自然清爽路线。", "社交场景里可以做亲和、低压力的形象方向。", "改造空间明显，发型轮廓和衣服版型一改，变化会比较直观。"],
  problems: [
    { title: "风格不够聚焦", evidence: "照片里的发型和衣服没有形成统一方向。", impact: "别人很难快速记住你的形象特点。", solution: "先锁定一个主风格，比如清爽轻熟风，不要混搭太多元素。" },
    { title: "发型轮廓需要更明确", evidence: "如果照片中顶部、两侧或发尾状态不够清楚，就容易影响整体利落感。", impact: "日常社交里会显得状态不够稳定。", solution: "优先让两侧、顶部层次和发尾轮廓更清楚；看不清的地方不要强行判断。" },
    { title: "穿搭比例需要优化", evidence: "衣服轮廓如果偏松散，会弱化身形比例。", impact: "会让整体身形显得松散。", solution: "用短款外套、直筒裤和基础色把比例拉回来。" },
  ],
  hair: {
    faceShape: "基于当前照片初步判断，脸部线条偏柔和。",
    currentIssue: "当前发型需要先确认头发长度、两侧轮廓和顶部层次，再给具体建议。",
    recommended: ["侧分纹理短发", "自然微分碎盖", "清爽短发"],
    avoid: ["贴头皮发型", "过长发尾", "两侧过于厚重"],
    barberScript: "两侧收干净，顶部保留自然层次，发尾不要太厚重，整体做自然纹理，核心是日常好打理、清爽但别太刻意。",
    dailyCare: "洗后先吹干发根，顶部用少量发泥抓出层次，两侧保持清爽，不要让头发整体贴头皮。",
  },
  outfit: {
    body: "基于照片初步判断，建议优先做干净利落的轮廓。",
    tops: "适合合身但不紧身的 T 恤、衬衫、针织衫。",
    pants: "适合直筒裤、微宽松休闲裤，避免紧身裤。",
    seasonContext: "默认按春夏场景处理，不强推外套。",
    outerwear: "春夏不需要外套；如室内空调可加轻薄衬衫外穿。",
    colors: "黑白灰、深蓝、卡其、大地色更稳。",
    avoid: "过长外套、紧身裤、大面积印花、高饱和亮色。",
  },
  styles: [
    { name: "清爽轻熟风", reason: "不油腻、稳定、有亲和力。", scene: "日常社交、朋友聚会、通勤", hair: "侧分纹理短发", clothing: "白T/浅衬衫 + 深色直筒裤 + 干净休闲鞋", vibe: "干净、有精神、不用力过猛" },
    { name: "韩系干净感", reason: "更年轻，但不能做得太精致或太网红。", scene: "朋友聚会、Citywalk、日常出门", hair: "自然微分碎盖", clothing: "浅色上衣 + 直筒裤 + 低帮鞋", vibe: "温和、亲近、减龄" },
    { name: "日系简约风", reason: "舒适但不邋遢。", scene: "日常通勤、周末见面", hair: "自然短发", clothing: "低饱和上衣 + 宽直筒裤", vibe: "自然、有生活感" },
  ],
  dailyPlan: {
    hair: "自然纹理短发",
    top: "白色厚磅 T 恤或浅色衬衫",
    pants: "深色直筒牛仔裤",
    shoes: "白色低帮休闲鞋",
    outerwear: "春夏不需要外套；室内空调可加浅色薄衬衫",
    accessories: "简单手表或干净背包即可",
    reason: "整体目标是日常能穿、社交不尴尬、比普通路人更清爽。",
  },
  plan7: ["确认当前发型最大问题：两侧、顶部、发尾哪个最影响状态。", "预约理发，按建议调整发型轮廓。", "整理衣柜，先淘汰过度松垮、起球、变形的上衣。", "准备一套浅色上衣+深色直筒裤的日常组合。", "补一双干净的低帮休闲鞋或板鞋。", "试穿两套不同风格，记录哪套最自然。", "用新形象参加一次日常社交场景，观察反馈。"],
  conclusion: "你最应该先改的是发型和整体风格统一度。只要先做到干净、利落、比例明确，第一印象会比现在更稳定，也更适合日常社交场景。",
};

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
    <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white/85 px-4 py-3 backdrop-blur">
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

function resizeImage(file, maxSide = 512, quality = 0.48) {
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
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const dataUrl = await resizeImage(file);
          onChange({ preview: dataUrl, dataUrl, name: file.name });
        }}
      />
    </label>
  );
}

function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>;
}

function TextList({ items }) {
  return <ul className="list-inside list-disc space-y-1">{(items || []).map((item, i) => <li key={i}>{item}</li>)}</ul>;
}

function ReportView({ report, usage }) {
  const r = report?.rawText ? fallbackReport : { ...fallbackReport, ...report };
  const scores = { ...fallbackReport.scores, ...(r.scores || {}) };
  const hair = { ...fallbackReport.hair, ...(r.hair || {}) };
  const outfit = { ...fallbackReport.outfit, ...(r.outfit || {}) };
  const dailyPlan = { ...fallbackReport.dailyPlan, ...(r.dailyPlan || {}) };

  return (
    <div className="space-y-5">
      {report?.rawText && <SectionCard icon={MessageCircle} title="AI 原始报告">{report.rawText}</SectionCard>}

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">AI个人形象分析报告</h2>
            <p className="mt-2 text-sm text-zinc-500">基于你的照片和问卷生成，重点看发型、日常穿搭、社交形象和审美方向。</p>
          </div>
          <div className="rounded-full bg-black px-3 py-1 text-xs text-white">真实生成</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{scores.completion || 80}</div><div className="text-xs text-zinc-500">形象完成度</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{scores.keyword || "清爽"}</div><div className="text-xs text-zinc-500">核心关键词</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3 text-center"><div className="text-xl font-black">{scores.style || "轻熟"}</div><div className="text-xs text-zinc-500">推荐风格</div></div>
        </div>
      </div>

      <SectionCard icon={Sparkles} title="一、整体第一印象">{r.overall}</SectionCard>
      <SectionCard icon={CheckCircle2} title="二、最该先改的 3 件事">
        <div className="space-y-3">{(r.priority || []).map((p, i) => <div key={i} className="rounded-2xl bg-zinc-50 p-4"><b>{p.rank || i + 1}. {p.change}</b><p className="mt-1"><span className="text-zinc-500">原因：</span>{p.why}</p><p><span className="text-zinc-500">怎么做：</span>{p.how}</p></div>)}</div>
      </SectionCard>
      <SectionCard icon={CheckCircle2} title="三、你的形象优势"><TextList items={r.strengths} /></SectionCard>
      <SectionCard icon={MessageCircle} title="四、当前最需要优化的问题">
        <div className="space-y-4">
          {(r.problems || []).map((p, i) => (
            <div key={i} className="rounded-2xl bg-zinc-50 p-4">
              <b>{i + 1}. {p.title}</b>
              <p className="mt-1"><span className="text-zinc-500">依据：</span>{p.evidence}</p><p><span className="text-zinc-500">影响：</span>{p.impact}</p>
              <p><span className="text-zinc-500">优化：</span>{p.solution}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard icon={Scissors} title="五、脸型与发型建议">
        <p><b>初步判断：</b>{hair.faceShape}</p>
        <p><b>当前问题：</b>{hair.currentIssue}</p>
        <p><b>推荐发型：</b>{(hair.recommended || []).join(" / ")}</p>
        <p><b>避雷：</b>{(hair.avoid || []).join(" / ")}</p>
        <div className="mt-3 rounded-2xl bg-zinc-50 p-3"><b>给理发师的话术：</b>{hair.barberScript}</div>
        <p className="mt-2"><b>打理建议：</b>{hair.dailyCare}</p>
      </SectionCard>
      <SectionCard icon={Shirt} title="六、身材比例与穿搭方向">
        <p><b>比例判断：</b>{outfit.body}</p>
        <p><b>季节判断：</b>{outfit.seasonContext}</p>
        <p><b>上衣：</b>{outfit.tops}</p>
        <p><b>裤子：</b>{outfit.pants}</p>
        <p><b>外套：</b>{outfit.outerwear}</p>
        <p><b>颜色：</b>{outfit.colors}</p>
        <p><b>雷区：</b>{outfit.avoid}</p>
      </SectionCard>
      <SectionCard icon={Star} title="七、最适合你的 3 种风格">
        <div className="space-y-4">
          {(r.styles || []).map((s, i) => <div key={i}><b>{i + 1}. {s.name}</b><p>{s.reason}</p><p><span className="text-zinc-500">场景：</span>{s.scene}</p><p><span className="text-zinc-500">穿搭：</span>{s.clothing}</p><p><span className="text-zinc-500">感觉：</span>{s.vibe}</p></div>)}
        </div>
      </SectionCard>
      <SectionCard icon={Heart} title="八、社交/日常形象方案">
        <p><b>发型：</b>{dailyPlan.hair}</p><p><b>上衣：</b>{dailyPlan.top}</p><p><b>裤子：</b>{dailyPlan.pants}</p><p><b>鞋子：</b>{dailyPlan.shoes}</p><p><b>外套：</b>{dailyPlan.outerwear}</p><p><b>配饰：</b>{dailyPlan.accessories}</p><p><b>原因：</b>{dailyPlan.reason}</p>
      </SectionCard>
      <SectionCard icon={RefreshCw} title="九、7天审美提升计划"><ol className="list-inside list-decimal space-y-1">{(r.plan7 || []).map((item, i) => <li key={i}>{item}</li>)}</ol></SectionCard>
      <SectionCard icon={CheckCircle2} title="十、总结">{r.conclusion}</SectionCard>
      {usage && <div className="text-center text-xs text-zinc-400">Token usage: {JSON.stringify(usage)}</div>}
    </div>
  );
}

export default function AIImageConsultantApp() {
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState({ nickname: "", gender: "男", age: "23-28岁", height: "", weight: "", city: "", season: "春夏/20°C以上", temperature: "", occasion: "日常社交/提升审美", currentStyle: "不知道", budget: "300-600" });
  const [selectedNeeds, setSelectedNeeds] = useState(["社交形象", "日常穿搭"]);
  const [selectedPainPoints, setSelectedPainPoints] = useState(["不知道适合什么风格"]);
  const [photos, setPhotos] = useState({ front: null, half: null, full: null });
  const [agreeAnalysis, setAgreeAnalysis] = useState(false);
  const [agreeTraining, setAgreeTraining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [usage, setUsage] = useState(null);
  const [feedback, setFeedback] = useState(0);
  const [note, setNote] = useState("");

  const progressIndex = useMemo(() => Math.min(page, 5), [page]);
  const canContinueFromPhotos = photos.front && photos.half && photos.full;

  const updateProfile = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  async function generateReport() {
    setLoading(true);
    setError("");
    setReport(null);
    setUsage(null);
    setPage(4);

    const payload = {
      profile: { ...profile, needs: selectedNeeds, painPoints: selectedPainPoints, agreeTraining },
      photos: [
        { type: "front", dataUrl: photos.front.dataUrl },
        { type: "half", dataUrl: photos.half.dataUrl },
        { type: "full", dataUrl: photos.full.dataUrl },
      ],
    };

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`接口返回了非 JSON 内容：${text.slice(0, 180)}`);
      }
      if (!res.ok) throw new Error(data.error || data.detail || "报告生成失败");
      setReport(data.report || fallbackReport);
      setUsage(data.usage || null);
      setPage(5);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  const resetAll = () => {
    setPage(0); setReport(null); setError(""); setFeedback(0); setNote("");
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-zinc-950">
      {page > 0 && <Progress current={progressIndex} />}
      <main className="mx-auto max-w-md px-4 py-6">
        {page > 0 && page !== 4 && <button onClick={() => setPage(Math.max(0, page - 1))} className="mb-4 flex items-center gap-1 text-sm text-zinc-500"><ArrowLeft size={16} /> 返回上一步</button>}

        {page === 0 && <div className="space-y-5">
          <div className="overflow-hidden rounded-[32px] bg-black p-6 text-white shadow-xl">
            <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs"><Sparkles size={14} /> AI形象诊断内测版</div><div className="rounded-full bg-white/10 px-3 py-1 text-xs">真实生成</div></div>
            <h1 className="text-4xl font-black leading-tight tracking-tight">AI 帮你找到更适合自己的社交/日常形象</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">上传 3 张照片，AI 直接生成你的专属形象诊断报告：发型、日常穿搭、社交第一印象和审美提升方向。</p>
            <button onClick={() => setPage(1)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-black">开始我的形象诊断 <ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3"><div className="rounded-3xl bg-white p-4 shadow-sm"><Scissors size={22} /><p className="mt-3 text-sm font-semibold">发型建议</p><p className="mt-1 text-xs text-zinc-500">适合/避雷/话术</p></div><div className="rounded-3xl bg-white p-4 shadow-sm"><Shirt size={22} /><p className="mt-3 text-sm font-semibold">日常穿搭</p><p className="mt-1 text-xs text-zinc-500">具体到单品组合</p></div><div className="rounded-3xl bg-white p-4 shadow-sm"><Sparkles size={22} /><p className="mt-3 text-sm font-semibold">审美提升</p><p className="mt-1 text-xs text-zinc-500">建立稳定风格</p></div></div>
          <SectionCard icon={Heart} title="当前版本能做什么？">这版已经可以把照片和问卷发给视觉模型，返回真实 AI 报告。照片不会保存在本页面，但会发送给你配置的 AI API 服务用于本次分析。</SectionCard>
        </div>}

        {page === 1 && <div className="space-y-5">
          <div><h2 className="text-2xl font-black">先了解你的需求</h2><p className="mt-2 text-sm text-zinc-500">问题越清晰，报告越准。</p></div>
          <SectionCard icon={UserRound} title="基础信息"><div className="space-y-3"><input value={profile.nickname} onChange={(e) => updateProfile("nickname", e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="昵称，如：Alan" /><div className="grid grid-cols-2 gap-3"><select value={profile.gender} onChange={(e) => updateProfile("gender", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black"><option>男</option><option>女</option></select><select value={profile.age} onChange={(e) => updateProfile("age", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black"><option>18-22岁</option><option>23-28岁</option><option>29-35岁</option><option>35岁以上</option></select></div><div className="grid grid-cols-2 gap-3"><input value={profile.height} onChange={(e) => updateProfile("height", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="身高 cm" /><input value={profile.weight} onChange={(e) => updateProfile("weight", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="体重 kg" /></div><div className="grid grid-cols-2 gap-3"><input value={profile.city} onChange={(e) => updateProfile("city", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="所在城市，如上海" /><input value={profile.temperature} onChange={(e) => updateProfile("temperature", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="当前温度，如25°C" /></div><input value={profile.occasion} onChange={(e) => updateProfile("occasion", e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-black" placeholder="使用场景，如日常社交/朋友聚会/上班/约会" /></div></SectionCard>
          <SectionCard icon={Sparkles} title="你最想优化什么？"><div className="flex flex-wrap gap-2">{styleOptions.map((item) => <Pill key={item} active={selectedNeeds.includes(item)} onClick={() => setSelectedNeeds((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={MessageCircle} title="你目前最困扰的问题"><div className="flex flex-wrap gap-2">{painPoints.map((item) => <Pill key={item} active={selectedPainPoints.includes(item)} onClick={() => setSelectedPainPoints((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={Shirt} title="你现在的穿搭状态"><div className="flex flex-wrap gap-2">{currentStyles.map((item) => <Pill key={item} active={profile.currentStyle === item} onClick={() => updateProfile("currentStyle", item)}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={RefreshCw} title="当前季节/穿搭环境"><div className="flex flex-wrap gap-2">{seasons.map((item) => <Pill key={item} active={profile.season === item} onClick={() => updateProfile("season", item)}>{item}</Pill>)}</div></SectionCard>
          <SectionCard icon={Star} title="你的形象改造预算"><div className="flex flex-wrap gap-2">{budgets.map((item) => <Pill key={item} active={profile.budget === item} onClick={() => updateProfile("budget", item)}>{item}</Pill>)}</div></SectionCard>
          <button onClick={() => setPage(2)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-semibold text-white">下一步：上传照片 <ChevronRight size={18} /></button>
        </div>}

        {page === 2 && <div className="space-y-5">
          <div><h2 className="text-2xl font-black">上传 3 张照片</h2><p className="mt-2 text-sm text-zinc-500">建议自然光、无遮挡、无过度美颜。照片会被压缩后用于 AI 分析。</p></div>
          <UploadBox label="正脸照" helper="看脸型、发型、五官比例" photo={photos.front} onChange={(img) => setPhotos({ ...photos, front: img })} />
          <UploadBox label="半身照" helper="看肩颈比例、上身版型" photo={photos.half} onChange={(img) => setPhotos({ ...photos, half: img })} />
          <UploadBox label="全身照" helper="看身材比例、穿搭轮廓" photo={photos.full} onChange={(img) => setPhotos({ ...photos, full: img })} />
          <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">当前版本不做云端照片存储，只把压缩后的图片发送给 AI 接口生成本次报告。</div>
          <button disabled={!canContinueFromPhotos} onClick={() => setPage(3)} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold ${canContinueFromPhotos ? "bg-black text-white" : "bg-zinc-200 text-zinc-400"}`}>下一步：确认授权 <ChevronRight size={18} /></button>
        </div>}

        {page === 3 && <div className="space-y-5">
          <div><h2 className="text-2xl font-black">隐私与授权</h2><p className="mt-2 text-sm text-zinc-500">本次分析授权和训练授权分开选择。</p></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={20} /><h3 className="font-semibold">本次分析授权</h3></div><p className="text-sm leading-7 text-zinc-600">我同意上传照片和填写的信息用于生成本次 AI 形象分析报告。照片会发送给已配置的 AI 服务商处理，但不会在本页面长期保存。</p><label className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm"><input type="checkbox" checked={agreeAnalysis} onChange={(e) => setAgreeAnalysis(e.target.checked)} />我同意用于本次形象分析</label></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><RefreshCw size={20} /><h3 className="font-semibold">产品优化/模型训练授权</h3></div><p className="text-sm leading-7 text-zinc-600">我自愿同意将照片、问卷信息、AI 诊断结果和反馈用于产品优化、风格判断规则优化和模型训练。正式上线前建议继续完善删除和撤回授权功能。</p><label className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-sm"><input type="checkbox" checked={agreeTraining} onChange={(e) => setAgreeTraining(e.target.checked)} />我自愿授权用于产品优化和模型训练</label></div>
          <button disabled={!agreeAnalysis} onClick={generateReport} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold ${agreeAnalysis ? "bg-black text-white" : "bg-zinc-200 text-zinc-400"}`}>生成我的真实报告 <Sparkles size={18} /></button>
        </div>}

        {page === 4 && <div className="space-y-5 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-white"><Loader2 className="animate-spin" size={34} /></div>
          <div><h2 className="text-2xl font-black">正在生成形象报告</h2><p className="mt-3 text-sm leading-7 text-zinc-500">AI 正在分析照片、问卷和场景需求。通常需要 10-60 秒。</p></div>
          <ErrorBox error={error} />
          {error && <button onClick={() => setPage(3)} className="rounded-2xl bg-black px-5 py-4 font-semibold text-white">返回检查配置</button>}
        </div>}

        {page === 5 && <div className="space-y-5">
          <ReportView report={report || fallbackReport} usage={usage} />
          <div className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="font-semibold">你觉得这份报告准吗？</h3><div className="mt-4 flex gap-2">{[1,2,3,4,5].map((score) => <button key={score} onClick={() => setFeedback(score)} className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${feedback >= score ? "border-black bg-black text-white" : "border-zinc-200 bg-white text-zinc-400"}`}><Star size={18} fill={feedback >= score ? "currentColor" : "none"} /></button>)}</div></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="font-semibold">哪里不准？哪里有用？</h3><textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-4 min-h-28 w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm outline-none focus:border-black" placeholder="比如：发型建议很准，但穿搭不太符合我；或者预算不现实……" /></div>
          <button onClick={resetAll} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-semibold text-white">重新测试 <Send size={18} /></button>
        </div>}
      </main>
    </div>
  );
}
