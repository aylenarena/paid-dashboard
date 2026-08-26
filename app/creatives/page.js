"use client";
import Header from "../components/Header";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQUENCY_COLOR = { alta: "#ef4444", media: "#eab308", baja: "#6b7280" };
const IMPACT_COLOR    = { alto: "#22c55e", medio: "#eab308", bajo: "#6b7280" };
const FUNNEL_COLOR    = { TOFU: "#6b7280", MOFU: "#eab308", BOFU: "#22c55e" };

function Badge({ label, color }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: color + "22", color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  );
}

// ─── Frame 1: Pain Points ─────────────────────────────────────────────────────
function PainPointCard({ item, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className="cursor-pointer rounded-2xl border p-4 transition-all"
      style={
        selected
          ? { borderColor: "#ef444460", backgroundColor: "#ef44440a", boxShadow: "0 0 0 1px #ef444430" }
          : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }
      }
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
        <div className="flex flex-shrink-0 gap-1">
          <Badge label={item.frequency} color={FREQUENCY_COLOR[item.frequency] || "#6b7280"} />
          <Badge label={item.funnel_stage} color={FUNNEL_COLOR[item.funnel_stage] || "#6b7280"} />
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#CAD5FE]/80">{item.description}</p>

      {item.quote && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-xs italic text-[#CAD5FE]/80 leading-relaxed">"{item.quote}"</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {item.industries?.map((ind) => (
          <span key={ind} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#CAD5FE]/65">{ind}</span>
        ))}
        {item.job_titles?.map((jt) => (
          <span key={jt} className="rounded-full border border-blue-700/40 bg-blue-900/40 px-2 py-0.5 text-[10px] text-[#8AA5F2]">{jt}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Frame 2: Key Insights ────────────────────────────────────────────────────
function InsightCard({ item }) {
  const sourceLabel = { calls: "📞 Llamadas", meetings: "📅 Meetings", deals: "💰 Deals", contacts: "👤 Contactos" };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
        <div className="flex flex-shrink-0 gap-1">
          <Badge label={item.impact} color={IMPACT_COLOR[item.impact] || "#6b7280"} />
          <Badge label={sourceLabel[item.source] || item.source} color="#2563eb" />
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#CAD5FE]/80">{item.description}</p>
      <div className="flex items-start gap-2 rounded-xl border border-blue-700/40 bg-blue-900/40 p-2.5">
        <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-[11px] text-[#bfd0ff] leading-relaxed">{item.action}</p>
      </div>
    </div>
  );
}

// ─── Loading state amigable ───────────────────────────────────────────────────
const LOADING_STEPS = [
  "Leyendo transcripts de llamadas…",
  "Analizando meetings del CRM…",
  "Detectando pain points…",
  "Extrayendo insights accionables…",
  "Casi listo…",
];

function LoadingView() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-2xl bg-blue-500/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0d1f3c] ring-1 ring-[#8AA5F2]/30">
          <svg className="h-10 w-10 text-[#8AA5F2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H7a2 2 0 0 0-2 2v2M9 3h6M9 3V1m6 2h2a2 2 0 0 1 2 2v2M15 3V1M3 9v6M21 9v6M9 21H7a2 2 0 0 1-2-2v-2m4 4h6m-6 0v2m6-2h2a2 2 0 0 0 2-2v-2m-4 4v2" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </div>
      </div>
      <p className="text-base font-semibold text-[#F7F7F7] transition-all">{LOADING_STEPS[step]}</p>
      <p className="mt-1.5 text-xs text-[#CAD5FE]/50">Esto puede tardar unos segundos</p>
      <div className="mt-6 flex gap-1.5">
        {LOADING_STEPS.map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? "w-6 bg-blue-500" : "w-2 bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreativesPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [funnelFilter, setFunnelFilter]           = useState("all");
  const [selectedPainPoint, setSelectedPainPoint] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState("");
  const [chatLoading, setChatLoading]   = useState(false);
  const [chatError, setChatError]       = useState(null);
  const chatBottomRef = useRef(null);
  const inputRef      = useRef(null);

  function togglePainPoint(id) {
    setSelectedPainPoint((prev) => (prev === id ? null : id));
  }

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages); setChatInput(""); setChatLoading(true); setChatError(null);
    try {
      const res = await fetch("/api/creatives/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          painPoints: data?.analysis?.pain_points || [],
          insights: data?.analysis?.insights || [],
          selectedPainPoint,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } catch (e) { setChatError(e.message); }
    finally { setChatLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }

  const selectedPP = data?.analysis?.pain_points?.find((p) => p.id === selectedPainPoint);

  const QUICK_PROMPTS = selectedPP
    ? [
        `Dame 3 hooks para anuncio basados en "${selectedPP.title}"`,
        `¿Cómo escribir un headline para LinkedIn que resuelva este pain?`,
        `Generá un guión de video de 15 segundos sobre este dolor`,
      ]
    : [
        "¿Cuál es el pain point con más impacto para campañas?",
        "Dame 5 headlines listos para Meta Ads basados en los insights",
        "¿Qué ángulo creativo funcionaría mejor para LinkedIn BOFU?",
        "Generá una estructura de carrusel basada en los pain points",
      ];

  const fetchAnalysis = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/creatives");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // No auto-dispara — el usuario inicia el análisis manualmente

  const filteredPainPoints = (data?.analysis?.pain_points || []).filter((p) =>
    funnelFilter === "all" || p.funnel_stage === funnelFilter
  );

  return (
    <div className="min-h-screen relative text-white">
      {/* Header */}
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Creatives Intelligence</h1>
          <p className="mt-1 text-sm text-[#CAD5FE]/65">
            Pain points e insights extraídos de meetings y transcripts del CRM
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Error: {error}
          </div>
        )}

        {/* Estado inicial — antes de correr el análisis */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8AA5F2]/10 ring-1 ring-[#8AA5F2]/20">
              <svg className="h-8 w-8 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="mb-2 text-base font-bold text-white">Analizá tus transcripts y meetings</h2>
            <p className="mb-6 max-w-sm text-sm text-[#CAD5FE]/65">
              La IA extrae pain points e insights accionables de tus datos de CRM para generar creativos más efectivos.
            </p>
            <button
              onClick={fetchAnalysis}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Generar análisis
            </button>
          </div>
        )}

        {/* Loading amigable */}
        {loading && <LoadingView />}

        {/* Filtros — solo cuando hay datos */}
        <div className={`mb-6 flex flex-wrap items-center gap-4 ${!data ? "hidden" : ""}`}>
          <span className="text-[11px] text-[#CAD5FE]/50 font-semibold uppercase tracking-wider">Funnel:</span>
          {["all", "TOFU", "MOFU", "BOFU"].map((f) => (
            <button
              key={f}
              onClick={() => setFunnelFilter(f)}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
              style={
                funnelFilter === f
                  ? { backgroundColor: (FUNNEL_COLOR[f] || "#2563eb") + "25", borderColor: (FUNNEL_COLOR[f] || "#2563eb") + "60", color: FUNNEL_COLOR[f] || "#2563eb" }
                  : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "#6b7280" }
              }
            >
              {f === "all" ? "Todas" : f}
            </button>
          ))}
          {selectedPainPoint && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
              <span className="text-[11px] text-red-400">Pain point seleccionado</span>
              <button onClick={() => setSelectedPainPoint(null)} className="text-red-500 hover:text-red-300 text-sm leading-none">×</button>
            </div>
          )}
        </div>

        {/* ── 2 Frames — solo cuando hay datos ── */}
        <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${!data ? "hidden" : ""}`}>

          {/* FRAME 1: Pain Points */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20">
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Pain Points</h2>
                <p className="text-[10px] text-[#CAD5FE]/50">De meetings y llamadas del CRM</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
              {filteredPainPoints.length === 0
                ? <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-8 text-center text-sm text-[#CAD5FE]/50">Sin datos aún</div>
                : filteredPainPoints.map((item) => (
                    <PainPointCard
                      key={item.id}
                      item={item}
                      selected={selectedPainPoint === item.id}
                      onSelect={togglePainPoint}
                    />
                  ))
              }
            </div>
          </div>

          {/* FRAME 2: Key Insights */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700/40">
                <svg className="h-4 w-4 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Key Insights</h2>
                <p className="text-[10px] text-[#CAD5FE]/50">Patrones y hallazgos del CRM</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
              {(data?.analysis?.insights || []).length === 0
                ? <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-8 text-center text-sm text-[#CAD5FE]/50">Sin datos aún</div>
                : (data?.analysis?.insights || []).map((item) => (
                  <InsightCard key={item.id} item={item} />
                ))
              }
            </div>
          </div>

        </div>

        {/* ── Chat con IA — aparece solo cuando el análisis está listo ── */}
        <div className={`mt-10 rounded-2xl border border-white/10 bg-white/[0.02] ${!data ? "hidden" : ""}`}>
          <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700/40">
                <svg className="h-4 w-4 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Chat con IA</h2>
                <p className="text-[10px] text-[#CAD5FE]/50">
                  {selectedPP
                    ? `Contexto: pain point "${selectedPP.title}"`
                    : "Preguntá sobre pain points, copy, hooks y ángulos creativos"}
                </p>
              </div>
            </div>
            {selectedPP && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] text-red-400">
                🎯 {selectedPP.title}
              </span>
            )}
          </div>

          {/* Mensajes */}
          <div className="h-72 overflow-y-auto px-5 py-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="mb-4 text-xs text-[#CAD5FE]/50">
                  {selectedPP
                    ? `Pain point seleccionado: "${selectedPP.title}". Preguntá sobre copy, hooks o creativos.`
                    : "Preguntale a la IA sobre los pain points detectados o pedile copy listo para usar."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button key={p}
                      onClick={() => { setChatInput(p); inputRef.current?.focus(); }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-[#CAD5FE]/80 transition hover:border-blue-600/40 hover:text-[#F7F7F7]/90">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-[#F7F7F7]/90"}`}>
                  {msg.role === "user"
                    ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                    : <div className="prose-chat"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                </div>
              </div>
            ))}
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
            {chatError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">Error: {chatError}</div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick prompts cuando hay mensajes */}
          {chatMessages.length > 0 && (
            <div className="border-t border-white/5 px-5 py-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => { setChatInput(p); inputRef.current?.focus(); }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#CAD5FE]/65 transition hover:border-blue-600/40 hover:text-[#CAD5FE]/95">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 px-4 py-3">
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <textarea
                ref={inputRef} rows={2} value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={loading ? "Analizando transcripts del CRM… listo en unos segundos" : selectedPP ? `Preguntá sobre "${selectedPP.title}"…` : "Pedí copy, hooks, guiones o ángulos creativos…"}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={chatLoading}
              />
              <button type="submit" disabled={!chatInput.trim() || chatLoading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 transition hover:bg-blue-500 disabled:opacity-40">
                <svg className="h-4 w-4 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <p className="mt-1 text-[10px] text-[#CAD5FE]/30">Enter para enviar · Shift+Enter para nueva línea{loading ? " · Analizando CRM…" : ""}</p>
          </div>
        </div>

        {data && (
          <p className="mt-6 text-center text-[11px] text-[#CAD5FE]/30">
            Análisis basado en {data.meta.transcripts_analyzed} transcripts · {data.meta.meetings_analyzed} meetings · {data.meta.contacts_analyzed} contactos · {data.meta.deals_analyzed} deals del CRM
          </p>
        )}
      </main>
    </div>
  );
}
