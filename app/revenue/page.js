"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";

function fmt(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function pct(n) { return `${n}%`; }

// Barra horizontal CSS
function Bar({ value, max, color = "#2563eb", label, right, height = "h-2" }) {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      {label && <span className="w-24 shrink-0 text-right text-xs text-[#CAD5FE]/80 truncate" title={label}>{label}</span>}
      <div className={`flex-1 ${height} rounded-full bg-white/5 overflow-hidden`}>
        <div className={`h-full rounded-full`} style={{ width: `${p}%`, background: color, transition: "width 0.6s ease" }} />
      </div>
      {right && <span className="w-12 shrink-0 text-right text-xs text-[#CAD5FE]/65">{right}</span>}
    </div>
  );
}

const PLATFORM_COLOR = { LinkedIn: "#0a66c2", Meta: "#1877f2", Google: "#ea4335", Organic: "#10b981", Referral: "#3b82f6", Event: "#f59e0b" };
const INSIGHT_TYPE_STYLE = {
  oportunidad: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-400", icon: "↑" },
  problema:    { bg: "bg-red-500/10",     border: "border-red-500/20",     badge: "bg-red-500/20 text-red-400",     icon: "⚠" },
  alerta:      { bg: "bg-amber-500/10",   border: "border-amber-500/20",   badge: "bg-amber-500/20 text-amber-400", icon: "!" },
};

export default function RevenuePage() {
  const [loading, setLoading]           = useState(false);
  const [data, setData]                 = useState(null);
  const [error, setError]               = useState(null);
  const [aiInsights, setAiInsights]     = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // 1. Carga stats (instantáneo — sin IA)
  const fetchRevenue = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/revenue");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Análisis IA — se dispara manualmente con el botón
  const fetchInsights = useCallback(async () => {
    if (!data?.insightContext || insightsLoading) return;
    setInsightsLoading(true); setAiInsights(null);
    try {
      const res = await fetch("/api/revenue/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.insightContext),
      });
      const ins = await res.json();
      if (ins.ok) setAiInsights(ins.aiInsights);
    } catch (e) {}
    finally { setInsightsLoading(false); }
  }, [data, insightsLoading]);

  // Auto-cargar stats al entrar a la página
  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  const { funnel, platformStats, bands, topCampaigns, worstCampaigns, wasteAnalysis } = data || {};

  const maxPlatformPipeline = Math.max(...(platformStats || []).map((p) => p.pipeline), 1);
  const maxPlatformLeads    = Math.max(...(platformStats || []).map((p) => p.total), 1);

  return (
    <div className="relative min-h-screen text-white">

      {/* Header */}
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Hero — siempre visible */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Revenue Intelligence</h1>
          <p className="mt-1 text-sm text-[#CAD5FE]/65">
            Cruza datos de campañas, calidad de leads y pipeline real para entender qué canales generan revenue de verdad — no solo volumen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Campañas → calidad de lead", "Score → pipeline", "Desperdicio de inversión", "Mejores y peores canales"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#CAD5FE]/65">{tag}</span>
            ))}
          </div>
        </div>

        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5" />)}
            </div>
            <div className="h-48 rounded-2xl bg-white/5" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
            </div>
            <div className="h-64 rounded-2xl bg-white/5" />
          </div>
        )}

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        {data && !loading && (
          <div className="flex flex-col gap-8">

            {/* ── Funnel de conversión ── */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Funnel completo: leads → revenue</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total leads",  value: funnel.totalLeads,              sub: "ingresados",        color: "border-white/10" },
                  { label: "BOFU",         value: `${funnel.bofuLeads} (${Math.round(funnel.bofuLeads/funnel.totalLeads*100)}%)`,  sub: "score ≥65",   color: "border-emerald-500/20" },
                  { label: "Con demo",     value: `${funnel.withMeeting} (${Math.round(funnel.withMeeting/funnel.totalLeads*100)}%)`, sub: "reunión agendada", color: "border-blue-500/20" },
                  { label: "Won",          value: `${funnel.wonLeads} (${Math.round(funnel.wonLeads/funnel.totalLeads*100)}%)`,   sub: "deals cerrados",  color: "border-blue-700/40" },
                ].map((f) => (
                  <div key={f.label} className={`rounded-xl border ${f.color} bg-white/[0.02] p-4 text-center`}>
                    <div className="text-2xl font-bold text-white">{f.value}</div>
                    <div className="mt-1 text-xs font-semibold text-[#CAD5FE]/80">{f.label}</div>
                    <div className="text-[11px] text-[#CAD5FE]/50">{f.sub}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-700/40 bg-blue-900/40 p-4 text-center">
                  <div className="text-2xl font-bold text-[#bfd0ff]">{fmt(funnel.totalPipeline)}</div>
                  <div className="text-xs text-[#CAD5FE]/65 mt-1">Pipeline total generado</div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{fmt(funnel.wonRevenue)}</div>
                  <div className="text-xs text-[#CAD5FE]/65 mt-1">Revenue cerrado</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-white">{funnel.avgScore}<span className="text-base text-[#CAD5FE]/50">/100</span></div>
                  <div className="text-xs text-[#CAD5FE]/65 mt-1">Score promedio</div>
                </div>
              </div>
            </div>

            {/* ── Score vs Pipeline: la conexión clave ── */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Score de lead vs impacto en pipeline</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                  {bands?.map((b) => (
                    <div key={b.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">{b.label}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: b.color + "25", color: b.color }}>
                          {b.pctLeads}% leads
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-[#CAD5FE]/80">
                        <div className="flex justify-between">
                          <span>Pipeline generado</span>
                          <span className="font-bold text-white">{b.pctPipeline}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasa de demo</span>
                          <span className="font-bold text-white">{b.pctDemo}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deal promedio</span>
                          <span className="font-bold text-white">{fmt(b.avgDeal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leads</span>
                          <span className="font-bold text-white">{b.count}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${b.pctPipeline}%`, background: b.color }} />
                        </div>
                        <div className="mt-1 text-[10px] text-[#CAD5FE]/50">{b.pctPipeline}% del pipeline total</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Waste insight */}
                {wasteAnalysis && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-400 text-lg shrink-0">⚠</span>
                      <div>
                        <p className="text-sm font-semibold text-white">Ineficiencia detectada</p>
                        <p className="text-sm text-[#CAD5FE]/80 mt-0.5">
                          <span className="text-amber-300 font-semibold">{wasteAnalysis.tofuPct}% de tus leads son TOFU</span> (score bajo) pero solo generan el <span className="text-amber-300 font-semibold">{wasteAnalysis.tofuPipelinePct}% del pipeline</span>. Son {wasteAnalysis.tofuLeads} leads de bajo retorno.
                          {wasteAnalysis.tofuSpend > 0 && <span> Gasto en campañas TOFU: <span className="text-amber-300 font-semibold">{fmt(wasteAnalysis.tofuSpend)}</span>.</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Plataformas: calidad + pipeline ── */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Plataformas: calidad de lead → pipeline generado</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-[#CAD5FE]/50 uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Plataforma</th>
                        <th className="px-4 py-3 text-right">Leads</th>
                        <th className="px-4 py-3 text-right">Score avg</th>
                        <th className="px-4 py-3 text-right">% BOFU</th>
                        <th className="px-4 py-3 text-right">% Demo</th>
                        <th className="px-4 py-3 text-right">% Won</th>
                        <th className="px-4 py-3 text-right">Pipeline</th>
                        <th className="px-4 py-3 text-right">Revenue/lead</th>
                        <th className="px-4 py-3 text-right">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(platformStats || []).sort((a, b) => b.avgScore - a.avgScore).map((p, i) => {
                        const color = PLATFORM_COLOR[p.platform] || "#2563eb";
                        return (
                          <tr key={p.platform} className={`border-b border-white/5 ${i === 0 ? "bg-white/[0.02]" : ""}`}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="font-medium text-white">{p.platform}</span>
                                {i === 0 && <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400 font-semibold">mejor</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/95">{p.total}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold" style={{ color: p.avgScore >= 65 ? "#10b981" : p.avgScore >= 45 ? "#f59e0b" : "#6b7280" }}>
                                {p.avgScore}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/95">{p.pctBofu}%</td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/95">{p.pctDemo}%</td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/95">{p.pctWon}%</td>
                            <td className="px-4 py-3 text-right font-semibold text-white">{fmt(p.pipeline)}</td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/80">{fmt(p.revenuePerLead)}</td>
                            <td className="px-4 py-3 text-right text-[#CAD5FE]/65">{p.avgCpl ? fmt(p.avgCpl) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Top vs Peores campañas ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Top 5 campañas por calidad de lead</p>
                <div className="flex flex-col gap-2">
                  {topCampaigns?.map((c, i) => {
                    const color = PLATFORM_COLOR[c.platform] || "#2563eb";
                    return (
                      <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-800/40 text-[10px] font-bold text-[#8AA5F2]">{i + 1}</span>
                            <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                          </div>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{c.avg_score} pts</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="rounded-full px-2 py-0.5" style={{ background: color + "20", color }}>{c.platform}</span>
                          <span className="text-[#CAD5FE]/65">{c.funnel}</span>
                          <span className="text-[#CAD5FE]/65">{c.pct_demo}% demo</span>
                          <span className="ml-auto text-[#CAD5FE]/80 font-medium">{fmt(c.pipeline)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">5 campañas con menor calidad de lead</p>
                <div className="flex flex-col gap-2">
                  {worstCampaigns?.map((c, i) => {
                    const color = PLATFORM_COLOR[c.platform] || "#2563eb";
                    return (
                      <div key={c.id} className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400">{c.avg_score} pts</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="rounded-full px-2 py-0.5" style={{ background: color + "20", color }}>{c.platform}</span>
                          <span className="text-[#CAD5FE]/65">{c.funnel}</span>
                          <span className="text-[#CAD5FE]/65">{c.pct_demo}% demo</span>
                          {c.spend > 0 && <span className="ml-auto text-red-400 text-[11px]">gasto: {fmt(c.spend)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Análisis IA (se dispara con botón) ── */}
            <div className="rounded-2xl border border-blue-800/30 bg-blue-950/40 overflow-hidden">
              <div className="border-b border-blue-800/30 px-6 py-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-700/40">
                  <svg className="h-3.5 w-3.5 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </span>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8AA5F2]">Análisis IA</p>
                {insightsLoading && (
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[#CAD5FE]/50">
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Generando…
                  </span>
                )}
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Estado inicial — botón para disparar el análisis */}
                {!aiInsights && !insightsLoading && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="mb-4 text-sm text-[#CAD5FE]/65">
                      Analizá campañas, calidad de leads y pipeline con IA para obtener insights accionables.
                    </p>
                    <button
                      onClick={fetchInsights}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      Generar análisis
                    </button>
                  </div>
                )}

                {/* Loading skeleton */}
                {insightsLoading && !aiInsights && (
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl border border-white/10 bg-white/5" />)}
                    </div>
                  </div>
                )}

                {/* Headline + oportunidad principal */}
                {aiInsights?.headline && (
                  <div>
                    <p className="text-lg font-bold text-white leading-snug">{aiInsights.headline}</p>
                    {aiInsights.main_opportunity && (
                      <p className="mt-2 text-sm text-emerald-400">{aiInsights.main_opportunity}</p>
                    )}
                  </div>
                )}

                {/* Insights accionables */}
                {aiInsights?.insights?.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Insights accionables — Campañas → Leads → Revenue</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {aiInsights.insights.map((ins) => {
                        const s = INSIGHT_TYPE_STYLE[ins.type] || INSIGHT_TYPE_STYLE.alerta;
                        return (
                          <div key={ins.id} className={`rounded-xl border p-5 ${s.bg} ${s.border}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badge}`}>{s.icon} {ins.type}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{ins.title}</h4>
                            <p className="text-xs text-[#CAD5FE]/80 leading-relaxed mb-3">{ins.finding}</p>
                            <div className="rounded-lg bg-[#080e1a]/80 p-3 space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-semibold text-[#CAD5FE]/50 uppercase shrink-0 mt-0.5">Acción</span>
                                <p className="text-xs text-[#CAD5FE]/95">{ins.action}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-semibold text-emerald-600 uppercase shrink-0 mt-0.5">Impacto</span>
                                <p className="text-xs text-emerald-400">{ins.impact}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
