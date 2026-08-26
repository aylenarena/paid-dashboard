"use client";
import Header from "../components/Header";

import { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return (n ?? 0).toLocaleString("es-AR"); }
function fmtMoney(n) { return `$${(n ?? 0).toLocaleString("es-AR")}`; }

const PLATFORM_COLOR = { LinkedIn: "#0a66c2", Meta: "#1877f2", Google: "#4285f4" };
const FUNNEL_COLOR   = { TOFU: "#6b7280", MOFU: "#eab308", BOFU: "#22c55e" };

const FILLS = {
  LinkedIn: "#0a66c2", Facebook: "#1877f2", Instagram: "#e1306c",
  Google: "#4285f4", YouTube: "#ff0000", Referral: "#22c55e",
  Event: "#f97316", Press: "#a855f7", Unknown: "#6b7280",
};
function sourceColor(s) { return FILLS[s] || "#2563eb"; }

// ─── Share helpers ─────────────────────────────────────────────────────────────
function encodeShare(platform, campaign, messages) {
  const payload = { platform, campaign: campaign ? { name: campaign.name, id: campaign.id, funnel: campaign.funnel, region: campaign.region } : null, messages };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
function decodeShare(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}
function chatToText(platform, campaign, messages) {
  const header = `NEXIAL — Chat de campañas\nPlataforma: ${platform}${campaign ? `\nCampaña: ${campaign.name}` : ""}\n${"─".repeat(50)}\n\n`;
  const body = messages.map((m) => `[${m.role === "user" ? "Yo" : "IA"}]\n${m.content}`).join("\n\n");
  return header + body;
}

// ─── Audience tier helpers ─────────────────────────────────────────────────────
function extractKeywords(titles) {
  const stop = new Set(["the","a","an","of","and","or","in","at","for","to","de","la","el","en","con","por","del","las","los","y","e","se","su","al"]);
  const freq = {};
  for (const t of titles) {
    for (const word of (t || "").toLowerCase().split(/[\s,./&()\-]+/)) {
      if (word.length > 3 && !stop.has(word) && !/^\d+$/.test(word))
        freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word]) => word);
}
function topN(leads, key, n) {
  const map = {};
  for (const l of leads) { const k = l[key] || "Unknown"; map[k] = (map[k] || 0) + 1; }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, count]) => ({ label, count }));
}
function buildTierProfile(leads) {
  if (!leads.length) return null;
  const count = leads.length;
  const avgScore   = Math.round(leads.reduce((s, l) => s + l.score, 0) / count);
  const withDemo   = leads.filter((l) => l.has_meeting).length;
  const pctDemo    = Math.round((withDemo / count) * 100);
  const industries  = topN(leads, "industry",    6);
  const seniorities = topN(leads, "seniority",   5);
  const sizes       = topN(leads, "size_bucket", 5);
  const regions     = topN(leads, "country",     6);
  const sources     = topN(leads, "source",      5);
  const topTitles   = topN(leads, "job_title",   10).map((t) => t.label).filter(Boolean);
  const keywords    = extractKeywords(leads.map((l) => l.job_title).filter(Boolean));
  return { count, avgScore, pctDemo, industries, seniorities, sizes, regions, sources, topTitles, keywords };
}

// ─── MiniBar ──────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = Math.max(4, (value / max) * 100);
  return (
    <div className="h-1 flex-1 rounded-full bg-white/5">
      <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── TierCard ─────────────────────────────────────────────────────────────────
function TierCard({ label, range, color, profile }) {
  if (!profile) return null;
  const maxIndustry = profile.industries[0]?.count || 1;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-bold text-white">{label}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: color + "20", color }}>
              {range}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#CAD5FE]/65">
            {fmt(profile.count)} leads · avg score <strong className="text-white">{profile.avgScore}</strong> · {profile.pctDemo}% demo
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Industrias</p>
        <div className="space-y-1.5">
          {profile.industries.map((ind) => (
            <div key={ind.label} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate text-left text-[11px] text-[#CAD5FE]/80">{ind.label}</span>
              <div className="flex-1"><MiniBar value={ind.count} max={maxIndustry} color={color} /></div>
              <span className="w-6 shrink-0 text-right text-[10px] text-[#CAD5FE]/50">{ind.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Seniority</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.seniorities.map((s) => (
            <span key={s.label} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">
              {s.label} <span className="text-[#CAD5FE]/50">({s.count})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Tamaño empresa</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.sizes.map((s) => (
            <span key={s.label} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">
              {s.label} <span className="text-[#CAD5FE]/50">({s.count})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Regiones</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.regions.map((r) => (
            <span key={r.label} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">
              {r.label} <span className="text-[#CAD5FE]/50">({r.count})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Fuentes de tráfico</p>
        <div className="flex flex-wrap gap-2">
          {profile.sources.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-[#CAD5FE]/80">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sourceColor(s.label) }} />
              {s.label} ({s.count})
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Keywords relevantes</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.keywords.map((kw) => (
            <span key={kw} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#CAD5FE]/80">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────
function CampaignCard({ campaign, platform, selected, onSelect }) {
  const color = PLATFORM_COLOR[platform] || "#2563eb";
  const funnelColor = FUNNEL_COLOR[campaign.funnel] || "#6b7280";
  const pctHigh = campaign.leads > 0 ? Math.round((campaign.high_quality / campaign.leads) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-2xl border p-4 transition-all"
      style={
        selected
          ? { borderColor: color + "70", backgroundColor: color + "12", boxShadow: `0 0 0 1px ${color}30` }
          : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }
      }
    >
      <div className="mb-2 flex items-start gap-2 flex-wrap">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: funnelColor + "25", color: funnelColor }}>
          {campaign.funnel}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/65">{campaign.region}</span>
        {selected && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white ml-auto" style={{ backgroundColor: color }}>activa</span>}
      </div>
      <p className="mb-3 text-sm font-bold text-white leading-snug truncate" title={campaign.name}>{campaign.name}</p>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {[
          { label: "Leads", value: fmt(campaign.leads) },
          { label: "Score", value: campaign.avg_score },
          { label: "Demo", value: `${campaign.pct_demo}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-center">
            <p className="text-xs font-bold text-white">{m.value}</p>
            <p className="text-[10px] text-[#CAD5FE]/50">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-[#CAD5FE]/65">CPL: <span className="text-white font-semibold">{fmtMoney(campaign.cpl)}</span></span>
        <span className="text-[#CAD5FE]/65">Alta calidad: <span className="font-semibold" style={{ color: FUNNEL_COLOR.BOFU }}>{pctHigh}%</span></span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/5">
        <div className="h-1 rounded-full transition-all" style={{ width: `${pctHigh}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isUser ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-[#F7F7F7]/90"}`}>
        {isUser
          ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          : <div className="prose-chat"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AudiencesPage() {
  // ── Leads / tiers ──
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsData, setLeadsData]       = useState(null);
  const [leadsError, setLeadsError]     = useState(null);

  // ── Campaigns ──
  const [campsLoading, setCampsLoading] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [campsError, setCampsError]     = useState(null);
  const [platform, setPlatform]         = useState("Meta");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // ── Chat ──
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState("");
  const [chatLoading, setChatLoading]   = useState(false);
  const [chatError, setChatError]       = useState(null);
  const [copyState, setCopyState]       = useState("idle");
  const chatBottomRef = useRef(null);
  const inputRef      = useRef(null);
  const tiersRef      = useRef(null);
  const campsRef      = useRef(null);
  const [activeTab, setActiveTab] = useState("tiers");

  function scrollToSection(section) {
    setActiveTab(section);
    const ref = section === "tiers" ? tiersRef : campsRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Restaurar conversación compartida desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("share");
    if (shareParam) {
      const decoded = decodeShare(shareParam);
      if (decoded?.messages?.length) {
        setChatMessages(decoded.messages);
        if (decoded.platform) setPlatform(decoded.platform);
      }
    }
  }, []);

  // Cargar leads
  useEffect(() => {
    setLeadsLoading(true);
    fetch("/api/leads")
      .then((r) => r.json())
      .then((json) => { if (!json.ok) throw new Error(json.error); setLeadsData(json); })
      .catch((e) => setLeadsError(e.message))
      .finally(() => setLeadsLoading(false));
  }, []);

  // Cargar campañas
  useEffect(() => {
    setCampsLoading(true);
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((json) => { if (!json.ok) throw new Error(json.error); setAllCampaigns(json.campaigns); })
      .catch((e) => setCampsError(e.message))
      .finally(() => setCampsLoading(false));
  }, []);

  // Tiers calculados
  const tiers = useMemo(() => {
    if (!leadsData?.leads) return null;
    const alto  = leadsData.leads.filter((l) => l.score >= 80);
    const medio = leadsData.leads.filter((l) => l.score >= 60 && l.score < 80);
    const bajo  = leadsData.leads.filter((l) => l.score < 60);
    return {
      alto:  buildTierProfile(alto),
      medio: buildTierProfile(medio),
      bajo:  buildTierProfile(bajo),
    };
  }, [leadsData]);

  // Campañas filtradas
  const campaigns = useMemo(() => {
    let f = allCampaigns.filter((c) => c.platform === platform);
    if (funnelFilter !== "all") f = f.filter((c) => c.funnel === funnelFilter);
    return f.sort((a, b) => b.avg_score - a.avg_score);
  }, [allCampaigns, platform, funnelFilter]);

  const funnelCounts = useMemo(() => {
    const base = allCampaigns.filter((c) => c.platform === platform);
    return {
      all:  base.length,
      BOFU: base.filter((c) => c.funnel === "BOFU").length,
      MOFU: base.filter((c) => c.funnel === "MOFU").length,
      TOFU: base.filter((c) => c.funnel === "TOFU").length,
    };
  }, [allCampaigns, platform]);

  function handlePlatformChange(p) {
    setPlatform(p); setFunnelFilter("all"); setSelectedCampaign(null); setChatMessages([]);
  }
  function handleSelectCampaign(c) {
    setSelectedCampaign(c); setChatMessages([]); setChatError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Quick prompts según plataforma y campaña seleccionada
  const quickPrompts = selectedCampaign
    ? ({
        Meta:     [`¿Qué intereses y lookalikes mejorarían "${selectedCampaign.name}"?`, `¿Cómo reducir el CPL de $${selectedCampaign.cpl} sin perder calidad?`, `¿Qué audiencias excluir para subir el score de ${selectedCampaign.avg_score}?`],
        LinkedIn: [`¿Qué job titles targetear en "${selectedCampaign.name}"?`, `¿Cómo mejorar el ${selectedCampaign.pct_demo}% de demos?`, `¿Qué company size e industrias priorizar?`],
        Google:   [`¿Qué keywords agregar o pausar en "${selectedCampaign.name}"?`, `¿Cómo mejorar la calidad con score ${selectedCampaign.avg_score}?`, `¿Qué negative keywords agregarías?`],
      }[platform])
    : ({
        Meta:     ["¿Cuáles campañas de Meta generan mejor calidad?", "¿Qué campañas pausaría y por qué?", "¿Cómo distribuir presupuesto entre campañas?"],
        LinkedIn: ["¿Cuáles campañas de LinkedIn tienen mejor ROI?", "¿Cómo mejorar el % de demos?", "¿Qué seniority targetear en cada campaña?"],
        Google:   ["¿Cuáles campañas de Google tienen mejor calidad?", "¿Cómo distribuir budget entre BOFU y TOFU?", "¿Qué keywords negativar en las TOFU?"],
      }[platform]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true); setChatError(null);
    try {
      const res = await fetch("/api/audiences/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          messages: newMessages,
          campaignContext: selectedCampaign ? {
            name: selectedCampaign.name, id: selectedCampaign.id,
            funnel: selectedCampaign.funnel, region: selectedCampaign.region,
            count: selectedCampaign.leads, avgScore: selectedCampaign.avg_score,
            pctDemo: selectedCampaign.pct_demo, highQuality: selectedCampaign.high_quality,
            cpl: selectedCampaign.cpl, spend: selectedCampaign.spend,
            avgAmount: selectedCampaign.avg_amount,
            industries: selectedCampaign.industries?.map((i) => ({ label: i, count: 1 })),
            seniorities: selectedCampaign.seniorities?.map((s) => ({ label: s, count: 1 })),
            topTitles: selectedCampaign.top_titles,
            topStages: selectedCampaign.top_stages,
            dataSource: selectedCampaign.data_source,
          } : null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } catch (e) { setChatError(e.message); }
    finally { setChatLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }

  function handleShareLink() {
    const encoded = encodeShare(platform, selectedCampaign, chatMessages);
    const url = `${window.location.origin}/audiences?share=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopyState("link"); setTimeout(() => setCopyState("idle"), 2500);
  }
  function handleCopyText() {
    navigator.clipboard.writeText(chatToText(platform, selectedCampaign, chatMessages));
    setCopyState("text"); setTimeout(() => setCopyState("idle"), 2500);
  }

  const platformColor = PLATFORM_COLOR[platform] || "#2563eb";

  return (
    <div className="min-h-screen relative text-white">
      {/* Header */}
      <Header />

      {/* Sticky tabs */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#080e1a]/95 backdrop-blur-sm px-6">
        <div className="mx-auto flex max-w-7xl gap-1 py-2">
          {[
            { id: "tiers",    label: "Audience Tiers" },
            { id: "campaigns", label: "Campañas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
              style={
                activeTab === tab.id
                  ? { backgroundColor: "#2563eb25", color: "#8AA5F2", border: "1px solid #2563eb40" }
                  : { color: "#6b7280", border: "1px solid transparent" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-8">

        {/* ── SECCIÓN 1: Audience Tiers ── */}
        <section ref={tiersRef}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Audience Builder</h1>
            <p className="mt-1 text-sm text-[#CAD5FE]/65">Perfil de audiencia por score tier · datos reales del CRM</p>
          </div>

          {leadsError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{leadsError}</div>}

          {leadsLoading ? (
            <div className="animate-pulse grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-96 rounded-2xl border border-white/10 bg-white/5" />)}
            </div>
          ) : tiers ? (
            <>
              <div className="mb-4 flex items-center gap-5 text-xs text-[#CAD5FE]/65">
                {[{ label: "Alto", range: "80-100", color: "#22c55e" }, { label: "Medio", range: "60-79", color: "#eab308" }, { label: "Bajo", range: "0-59", color: "#ef4444" }].map(({ label, range, color }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {label} ({range})
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TierCard label="Alto"  range="80-100" color="#22c55e" profile={tiers.alto}  />
                <TierCard label="Medio" range="60-79"  color="#eab308" profile={tiers.medio} />
                <TierCard label="Bajo"  range="0-59"   color="#ef4444" profile={tiers.bajo}  />
              </div>
            </>
          ) : null}
        </section>

        {/* ── SECCIÓN 2: Campañas ── */}
        <section ref={campsRef}>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Campañas activas</h2>
            <p className="mt-1 text-sm text-[#CAD5FE]/65">Seleccioná una campaña para ver métricas de calidad y consultarle a la IA cómo mejorarla</p>
          </div>

          {campsError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{campsError}</div>}

          <div className="flex gap-6">

            {/* Izquierda: filtros + lista */}
            <div className="w-[380px] flex-shrink-0 space-y-4">

              {/* Plataforma */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Plataforma</p>
                <div className="flex gap-2">
                  {[
                    { id: "Meta",     label: "Meta",     icon: "f",  color: "#1877f2" },
                    { id: "LinkedIn", label: "LinkedIn", icon: "in", color: "#0a66c2" },
                    { id: "Google",   label: "Google",   icon: "G",  color: "#4285f4" },
                  ].map((p) => (
                    <button key={p.id} onClick={() => handlePlatformChange(p.id)}
                      className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
                      style={
                        platform === p.id
                          ? { backgroundColor: p.color + "20", borderColor: p.color + "60", color: "white" }
                          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "#9ca3af" }
                      }>
                      <span className="font-bold" style={{ color: platform === p.id ? "white" : p.color }}>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funnel */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Etapa del funnel</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "all",  label: `Todas (${funnelCounts.all})`,  color: "#6b7280" },
                    { id: "BOFU", label: `BOFU (${funnelCounts.BOFU})`,  color: "#22c55e" },
                    { id: "MOFU", label: `MOFU (${funnelCounts.MOFU})`,  color: "#eab308" },
                    { id: "TOFU", label: `TOFU (${funnelCounts.TOFU})`,  color: "#6b7280" },
                  ].map((f) => (
                    <button key={f.id} onClick={() => setFunnelFilter(f.id)}
                      className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
                      style={
                        funnelFilter === f.id
                          ? { backgroundColor: f.color + "25", borderColor: f.color + "60", color: f.color }
                          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "#6b7280" }
                      }>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista */}
              {campsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/5" />)}
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {campaigns.length === 0
                    ? <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-10 text-center text-sm text-[#CAD5FE]/65">No hay campañas para este filtro</div>
                    : campaigns.map((c) => (
                      <CampaignCard key={c.id} campaign={c} platform={platform}
                        selected={selectedCampaign?.id === c.id}
                        onSelect={() => handleSelectCampaign(c)} />
                    ))}
                </div>
              )}
            </div>

            {/* Derecha: detalle + chat */}
            <div className="flex-1 space-y-4">

              {/* Detalle */}
              {selectedCampaign ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: FUNNEL_COLOR[selectedCampaign.funnel] + "25", color: FUNNEL_COLOR[selectedCampaign.funnel] }}>
                          {selectedCampaign.funnel}
                        </span>
                        <span className="text-[10px] text-[#CAD5FE]/65">{selectedCampaign.region}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                    </div>
                    <button onClick={() => { setSelectedCampaign(null); setChatMessages([]); }}
                      className="text-xs text-[#CAD5FE]/50 hover:text-[#CAD5FE]/80">× limpiar</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: "Leads totales",  value: fmt(selectedCampaign.leads) },
                      { label: "Score promedio", value: `${selectedCampaign.avg_score}/100` },
                      { label: "Con demo",        value: `${selectedCampaign.pct_demo}%` },
                      { label: "CPL",             value: fmtMoney(selectedCampaign.cpl) },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-white/[0.04] p-3 text-center">
                        <p className="text-base font-bold text-white">{m.value}</p>
                        <p className="text-[10px] text-[#CAD5FE]/65">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Industrias</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCampaign.industries?.map((i) => (
                          <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">{i}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Job titles</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCampaign.top_titles?.slice(0, 5).map((t) => (
                          <span key={t} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#CAD5FE]/80">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-10 text-center">
                  <p className="text-sm text-[#CAD5FE]/50">← Seleccioná una campaña para ver su detalle</p>
                </div>
              )}

              {/* Chat */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Chat con IA</h3>
                    <p className="text-[11px] text-[#CAD5FE]/65 mt-0.5">
                      {selectedCampaign ? `Consultas sobre "${selectedCampaign.name}"` : `Consultas generales sobre ${platform}`}
                    </p>
                  </div>
                  {chatMessages.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={handleCopyText}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#CAD5FE]/80 transition hover:border-white/20 hover:text-white">
                        {copyState === "text" ? "✓ Copiado" : "Copiar"}
                      </button>
                      <button onClick={handleShareLink}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-600/40 bg-blue-800/30 px-3 py-1.5 text-[11px] text-[#8AA5F2] transition hover:border-blue-500/60 hover:bg-blue-800/40">
                        {copyState === "link" ? "✓ Link copiado" : "Compartir"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-64 overflow-y-auto px-5 py-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-xs text-[#CAD5FE]/50 mb-3">
                        {selectedCampaign ? "Campaña cargada. Usá las sugerencias o escribí tu pregunta." : "Seleccioná una campaña o hacé una pregunta general."}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {quickPrompts.map((p) => (
                          <button key={p} onClick={() => { setChatInput(p); inputRef.current?.focus(); }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-[#CAD5FE]/80 transition hover:border-blue-600/40 hover:text-[#F7F7F7]/90">
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8AA5F2] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8AA5F2] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8AA5F2] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {chatError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">Error: {chatError}</div>}
                  <div ref={chatBottomRef} />
                </div>

                {chatMessages.length > 0 && (
                  <div className="border-t border-white/5 px-5 py-2 flex flex-wrap gap-1.5">
                    {quickPrompts.map((p) => (
                      <button key={p} onClick={() => { setChatInput(p); inputRef.current?.focus(); }}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#CAD5FE]/65 transition hover:border-blue-600/40 hover:text-[#CAD5FE]/95">
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/10 px-4 py-3">
                  <form onSubmit={sendMessage} className="flex items-end gap-2">
                    <textarea ref={inputRef} rows={2} value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder={selectedCampaign ? `Preguntá sobre "${selectedCampaign.name}"…` : `Preguntá sobre campañas de ${platform}…`}
                      className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 transition hover:bg-blue-500 disabled:opacity-40">
                      <svg className="h-4 w-4 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </form>
                  <p className="mt-1 text-[10px] text-[#CAD5FE]/30">Enter para enviar · Shift+Enter para nueva línea</p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
