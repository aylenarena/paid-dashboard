"use client";
import Header from "../components/Header";

import { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// ─── Config ───────────────────────────────────────────────────────────────────

const PLATFORM_COLOR = { LinkedIn: "#0a66c2", Meta: "#1877f2", Google: "#4285f4" };
const FUNNEL_COLOR = { TOFU: "#6b7280", MOFU: "#eab308", BOFU: "#22c55e" };

function fmt(n) { return (n ?? 0).toLocaleString("es-AR"); }
function fmtMoney(n) { return `$${(n ?? 0).toLocaleString("es-AR")}`; }

// ─── Share helpers ────────────────────────────────────────────────────────────
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

// ─── Campaign card ────────────────────────────────────────────────────────────
function CampaignCard({ campaign, platform, selected, onSelect }) {
  const color = PLATFORM_COLOR[platform] || "#2563eb";
  const funnelColor = FUNNEL_COLOR[campaign.funnel] || "#6b7280";
  const pctHigh = campaign.leads > 0 ? Math.round((campaign.high_quality / campaign.leads) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-2xl border p-5 transition-all"
      style={
        selected
          ? { borderColor: color + "70", backgroundColor: color + "12", boxShadow: `0 0 0 1px ${color}30` }
          : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: funnelColor + "25", color: funnelColor }}>
              {campaign.funnel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/65">
              {campaign.region}
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-snug truncate" title={campaign.name}>
            {campaign.name}
          </p>
        </div>
        {selected && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
            activa
          </span>
        )}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Leads", value: fmt(campaign.leads) },
          { label: "Avg score", value: campaign.avg_score },
          { label: "% demo", value: `${campaign.pct_demo}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
            <p className="text-sm font-bold text-white">{m.value}</p>
            <p className="text-[10px] text-[#CAD5FE]/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="text-[#CAD5FE]/65">CPL: <span className="text-white font-semibold">{fmtMoney(campaign.cpl)}</span></span>
        <span className="text-[#CAD5FE]/65">Alta calidad: <span className="font-semibold" style={{ color: FUNNEL_COLOR.BOFU }}>{pctHigh}%</span></span>
      </div>

      <div className="mb-3">
        <div className="h-1.5 w-full rounded-full bg-white/5">
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pctHigh}%`, backgroundColor: color }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {campaign.industries?.slice(0, 3).map((ind) => (
          <span key={ind} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/80">{ind}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
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
export default function CampaignsPage() {
  const [loading, setLoading] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [error, setError] = useState(null);

  const [platform, setPlatform] = useState("Meta");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [copyState, setCopyState] = useState("idle"); // idle | link | text

  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // Al cargar, revisar si hay ?share= en la URL para restaurar una conversación compartida
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

  useEffect(() => {
    setLoading(true);
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setAllCampaigns(json.campaigns);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const campaigns = useMemo(() => {
    let filtered = allCampaigns.filter((c) => c.platform === platform);
    if (funnelFilter !== "all") filtered = filtered.filter((c) => c.funnel === funnelFilter);
    return filtered.sort((a, b) => b.avg_score - a.avg_score);
  }, [allCampaigns, platform, funnelFilter]);

  const funnelCounts = useMemo(() => {
    const base = allCampaigns.filter((c) => c.platform === platform);
    return {
      all: base.length,
      TOFU: base.filter((c) => c.funnel === "TOFU").length,
      MOFU: base.filter((c) => c.funnel === "MOFU").length,
      BOFU: base.filter((c) => c.funnel === "BOFU").length,
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
            name: selectedCampaign.name,
            id: selectedCampaign.id,
            funnel: selectedCampaign.funnel,
            region: selectedCampaign.region,
            count: selectedCampaign.leads,
            avgScore: selectedCampaign.avg_score,
            pctDemo: selectedCampaign.pct_demo,
            highQuality: selectedCampaign.high_quality,
            cpl: selectedCampaign.cpl,
            spend: selectedCampaign.spend,
            avgAmount: selectedCampaign.avg_amount,
            industries: selectedCampaign.industries?.map((i) => ({ label: i, count: 1 })),
            seniorities: selectedCampaign.seniorities?.map((s) => ({ label: s, count: 1 })),
            sizes: selectedCampaign.sizes?.map((s) => ({ label: s, count: 1 })),
            regions: selectedCampaign.regions?.map((r) => ({ label: r, count: 1 })),
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
    const url = `${window.location.origin}/campaigns?share=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopyState("link");
    setTimeout(() => setCopyState("idle"), 2500);
  }

  function handleCopyText() {
    const text = chatToText(platform, selectedCampaign, chatMessages);
    navigator.clipboard.writeText(text);
    setCopyState("text");
    setTimeout(() => setCopyState("idle"), 2500);
  }

  const quickPrompts = selectedCampaign
    ? {
        Meta: [
          `¿Qué intereses y lookalikes mejorarían "${selectedCampaign.name}"?`,
          `¿Cómo reducir el CPL de $${selectedCampaign.cpl} sin perder calidad?`,
          `¿Qué audiencias excluir para subir el score de ${selectedCampaign.avg_score}?`,
        ],
        LinkedIn: [
          `¿Qué job titles targetear en "${selectedCampaign.name}"?`,
          `¿Cómo mejorar el ${selectedCampaign.pct_demo}% de demos?`,
          `¿Qué company size e industrias priorizar?`,
        ],
        Google: [
          `¿Qué keywords agregar o pausar en "${selectedCampaign.name}"?`,
          `¿Cómo mejorar la calidad con score ${selectedCampaign.avg_score}?`,
          `¿Qué negative keywords agregarías?`,
        ],
      }[platform]
    : {
        Meta: ["¿Cuáles campañas de Meta generan mejor calidad?", "¿Qué campañas pausaría y por qué?", "¿Cómo distribuir presupuesto entre campañas?"],
        LinkedIn: ["¿Cuáles campañas de LinkedIn tienen mejor ROI?", "¿Cómo mejorar el % de demos?", "¿Qué seniority targetear en cada campaña?"],
        Google: ["¿Cuáles campañas de Google tienen mejor calidad?", "¿Cómo distribuir budget entre BOFU y TOFU?", "¿Qué keywords negativar en las TOFU?"],
      }[platform];

  const platformColor = PLATFORM_COLOR[platform] || "#2563eb";

  return (
    <div className="min-h-screen relative text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Campañas activas</h1>
          <p className="mt-1 text-sm text-[#CAD5FE]/65">
            Seleccioná una plataforma y campaña para ver métricas de calidad y consultarle a la IA cómo mejorarla
          </p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        <div className="flex gap-6">

          {/* ── Izquierda: filtros + lista ── */}
          <div className="w-[400px] flex-shrink-0 space-y-4">

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
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all"
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
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl border border-white/10 bg-white/5" />)}
              </div>
            ) : (
              <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
                {campaigns.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-10 text-center">
                    <p className="text-sm text-[#CAD5FE]/65">No hay campañas para este filtro</p>
                  </div>
                ) : campaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} platform={platform}
                    selected={selectedCampaign?.id === c.id}
                    onSelect={() => handleSelectCampaign(c)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Derecha: detalle + chat ── */}
          <div className="flex-1 space-y-4">

            {/* Detalle */}
            {selectedCampaign ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: FUNNEL_COLOR[selectedCampaign.funnel] + "25", color: FUNNEL_COLOR[selectedCampaign.funnel] }}>
                        {selectedCampaign.funnel}
                      </span>
                      <span className="text-[10px] text-[#CAD5FE]/65">{selectedCampaign.region}</span>
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedCampaign.name}</h2>
                  </div>
                  <button onClick={() => { setSelectedCampaign(null); setChatMessages([]); }}
                    className="text-xs text-[#CAD5FE]/50 hover:text-[#CAD5FE]/80">× limpiar</button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Leads totales", value: fmt(selectedCampaign.leads) },
                    { label: "Score promedio", value: `${selectedCampaign.avg_score}/100` },
                    { label: "Con demo", value: `${selectedCampaign.pct_demo}%` },
                    { label: "CPL", value: fmtMoney(selectedCampaign.cpl) },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-white/[0.04] p-3 text-center">
                      <p className="text-lg font-bold text-white">{m.value}</p>
                      <p className="text-[10px] text-[#CAD5FE]/65">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Industrias</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCampaign.industries?.map((i) => (
                        <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">{i}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Seniority</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCampaign.seniorities?.map((s) => (
                        <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/95">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#CAD5FE]/50">Job titles frecuentes</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaign.top_titles?.map((t) => (
                      <span key={t} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#CAD5FE]/80">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
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
                    {/* Copiar como texto */}
                    <button
                      onClick={handleCopyText}
                      title="Copiar conversación como texto"
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#CAD5FE]/80 transition hover:border-white/20 hover:text-white"
                    >
                      {copyState === "text" ? (
                        <><svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Copiado</>
                      ) : (
                        <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> Copiar</>
                      )}
                    </button>
                    {/* Compartir link */}
                    <button
                      onClick={handleShareLink}
                      title="Compartir link de esta conversación"
                      className="flex items-center gap-1.5 rounded-lg border border-blue-600/40 bg-blue-800/30 px-3 py-1.5 text-[11px] text-[#8AA5F2] transition hover:border-blue-500/60 hover:bg-blue-800/40"
                    >
                      {copyState === "link" ? (
                        <><svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> ¡Link copiado!</>
                      ) : (
                        <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg> Compartir</>
                      )}
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
      </main>
    </div>
  );
}
