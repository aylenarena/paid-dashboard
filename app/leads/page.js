"use client";
import Header from "../components/Header";

import { useState, useMemo, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return (n ?? 0).toLocaleString("es-AR"); }
function fmtUSD(n) { return n ? "$" + Math.round(n).toLocaleString("es-AR") : "—"; }

const FILLS = {
  LinkedIn: "#0a66c2", Facebook: "#1877f2", Instagram: "#e1306c",
  Google: "#4285f4", YouTube: "#ff0000", Referral: "#22c55e",
  Event: "#f97316", Press: "#a855f7", Unknown: "#6b7280",
};

function sourceColor(source) {
  return FILLS[source] || "#2563eb";
}

function scoreColor(score) {
  if (score >= 80) return "bg-green-500/20 text-green-400 ring-green-500/30";
  if (score >= 60) return "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30";
  return "bg-red-500/20 text-red-400 ring-red-500/30";
}

function scoreDot(score) {
  if (score >= 80) return "bg-green-400";
  if (score >= 60) return "bg-yellow-400";
  return "bg-red-400";
}

// ─── Mini horizontal bar ──────────────────────────────────────────────────────
function MiniBar({ value, max, color = "#2563eb" }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="h-1.5 flex-1 rounded-full bg-white/5">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "blue" }) {
  const colors = {
    violet: "text-[#8AA5F2]", green: "text-green-400",
    yellow: "text-yellow-400", blue: "text-blue-400",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-5">
      <p className="text-xs text-[#CAD5FE]/65">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${colors[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#CAD5FE]/50">{sub}</p>}
    </div>
  );
}

// ─── Breakdown chart ──────────────────────────────────────────────────────────
function BreakdownChart({ title, items, color = "#2563eb" }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i.avg_score));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-xs font-semibold text-[#CAD5FE]/80">{title}</p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {/* Izquierda: label + barra */}
            <span className="w-28 shrink-0 truncate text-left text-xs text-[#CAD5FE]/80" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1">
              <MiniBar value={item.avg_score} max={max} color={color} />
            </div>
            {/* Derecha: fijo */}
            <div className="flex w-20 shrink-0 items-center justify-end gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${scoreDot(item.avg_score)}`} />
              <span className="w-5 text-right text-xs font-semibold tabular-nums text-white">{item.avg_score}</span>
              <span className="w-9 text-[10px] text-[#CAD5FE]/50">({fmt(item.count)})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${scoreColor(score)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${scoreDot(score)}`} />
      {score}
    </span>
  );
}

// ─── Source dot ───────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#CAD5FE]/80">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sourceColor(source) }} />
      {source}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);

  // Filters
  const [search, setSearch]       = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterSeniority, setFilterSeniority] = useState("All");
  const [filterScore, setFilterScore]   = useState("All");
  const [sortBy, setSortBy]       = useState("score");
  const [page, setPage]           = useState(1);
  const PAGE_SIZE = 25;

  async function loadLeads() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, []);

  // Filter + sort leads
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    let list = data.leads;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.contact_name?.toLowerCase().includes(q) ||
        l.company_name?.toLowerCase().includes(q) ||
        l.job_title?.toLowerCase().includes(q) ||
        l.deal_name?.toLowerCase().includes(q)
      );
    }
    if (filterSource !== "All") list = list.filter((l) => l.source === filterSource);
    if (filterSeniority !== "All") list = list.filter((l) => l.seniority === filterSeniority);
    if (filterScore === "High")   list = list.filter((l) => l.score >= 80);
    if (filterScore === "Medium") list = list.filter((l) => l.score >= 60 && l.score < 80);
    if (filterScore === "Low")    list = list.filter((l) => l.score < 60);

    if (sortBy === "score")   list = [...list].sort((a, b) => b.score - a.score);
    if (sortBy === "amount")  list = [...list].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    if (sortBy === "stage")   list = [...list].sort((a, b) => (a.deal_stage || "").localeCompare(b.deal_stage || ""));

    return list;
  }, [data, search, filterSource, filterSeniority, filterScore, sortBy]);

  // Reset página cuando cambian filtros
  const setSearchR      = (v) => { setSearch(v);       setPage(1); };
  const setFilterSrcR   = (v) => { setFilterSource(v); setPage(1); };
  const setFilterSenR   = (v) => { setFilterSeniority(v); setPage(1); };
  const setFilterScoreR = (v) => { setFilterScore(v);  setPage(1); };
  const setSortByR      = (v) => { setSortBy(v);       setPage(1); };

  const totalPages  = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const pagedLeads  = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sources    = data ? ["All", ...new Set(data.leads.map((l) => l.source))] : ["All"];
  const seniorities = data ? ["All", ...new Set(data.leads.map((l) => l.seniority))] : ["All"];

  return (
    <div className="min-h-screen relative text-white">
      {/* Header */}
      <Header />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">

        {/* Hero */}
        <div>
          <h1 className="text-2xl font-bold">Lead Quality Score</h1>
          <p className="mt-1 text-sm text-[#CAD5FE]/65">
            Score 0-100 basado en deal stage, demo agendada, tamaño de empresa y monto del deal.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8AA5F2]/10 ring-1 ring-[#8AA5F2]/20">
              <svg className="h-6 w-6 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm text-[#CAD5FE]/65">Cargando datos de leads…</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10" />)}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-white/5 border border-white/10" />)}
            </div>
            <div className="h-96 rounded-xl bg-white/5 border border-white/10" />
          </div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total leads" value={fmt(data.summary.total)} color="blue" />
              <StatCard label="Avg quality score" value={data.summary.avg_score} sub="sobre 100" color={data.summary.avg_score >= 60 ? "green" : "yellow"} />
              <StatCard label="Con demo agendada" value={`${data.summary.pct_demo}%`} sub={`${fmt(data.summary.with_demo)} leads`} color="blue" />
              <StatCard label="SQL (score ≥ 60)" value={`${data.summary.pct_sql}%`} sub={`${fmt(data.summary.sql)} leads`} color="green" />
            </div>

            {/* Breakdowns */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Score promedio por segmento</h2>
              {/* Leyenda de score y explicación del número entre paréntesis */}
              <div className="mt-2 mb-4 space-y-1.5 text-xs text-[#CAD5FE]/55">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <span className="font-semibold text-[#CAD5FE]/70">Score de calidad:</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" />80-100 Alto</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-400" />60-79 Medio</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />0-59 Bajo</span>
                </div>
                <div>El número entre paréntesis <span className="text-[#CAD5FE]/70">(ej. 223)</span> es la cantidad de leads en ese segmento</div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <BreakdownChart title="📣 Por fuente / plataforma" items={data.breakdowns.by_source} color="#2563eb" />
                <BreakdownChart title="🏭 Por industria (top 10)" items={data.breakdowns.by_industry} color="#3b82f6" />
                <BreakdownChart title="👤 Por seniority" items={data.breakdowns.by_seniority} color="#22c55e" />
                <BreakdownChart title="🌎 Por región (top 10)" items={data.breakdowns.by_region} color="#f97316" />
                <BreakdownChart title="📐 Por tamaño de empresa" items={data.breakdowns.by_size} color="#ec4899" />
                <BreakdownChart title="🎯 Por deal stage" items={data.breakdowns.by_stage} color="#eab308" />
              </div>
            </section>

            {/* Leads table */}
            <section>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">
                  Leads ({fmt(filteredLeads.length)})
                </h2>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Buscar por nombre, empresa, cargo…"
                  value={search}
                  onChange={(e) => setSearchR(e.target.value)}
                  className="flex-1 min-w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                />

                {/* Filters */}
                {[
                  { label: "Fuente",    value: filterSource,    set: setFilterSrcR,   options: sources },
                  { label: "Seniority", value: filterSeniority, set: setFilterSenR,   options: seniorities },
                  { label: "Score",     value: filterScore,     set: setFilterScoreR, options: ["All", "High", "Medium", "Low"] },
                ].map(({ label, value, set, options }) => (
                  <select
                    key={label}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#080e1a] px-3 py-1.5 text-xs text-[#CAD5FE]/95 focus:border-blue-500 focus:outline-none"
                  >
                    {options.map((o, i) => <option key={`${o}-${i}`} value={o}>{o}</option>)}
                  </select>
                ))}

                <select
                  value={sortBy}
                  onChange={(e) => setSortByR(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#080e1a] px-3 py-1.5 text-xs text-[#CAD5FE]/95 focus:border-blue-500 focus:outline-none"
                >
                  <option value="score">Ordenar: Score</option>
                  <option value="amount">Ordenar: Monto</option>
                  <option value="stage">Ordenar: Stage</option>
                </select>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-[#CAD5FE]/65">
                      <tr>
                        <th className="px-4 py-3 text-left">Score</th>
                        <th className="px-4 py-3 text-left">Contacto</th>
                        <th className="px-4 py-3 text-left">Empresa</th>
                        <th className="px-4 py-3 text-left">Industria</th>
                        <th className="px-4 py-3 text-left">Tamaño</th>
                        <th className="px-4 py-3 text-left">Stage</th>
                        <th className="px-4 py-3 text-left">Fuente</th>
                        <th className="px-4 py-3 text-left">Monto</th>
                        <th className="px-4 py-3 text-left">Demo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pagedLeads.map((lead, i) => (
                        <tr key={`${lead.deal_id}-${i}`} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5">
                            <ScoreBadge score={lead.score} />
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-white">{lead.contact_name || "—"}</p>
                            <p className="text-[#CAD5FE]/50 truncate max-w-[140px]" title={lead.job_title}>{lead.job_title || "—"}</p>
                          </td>
                          <td className="px-4 py-2.5 text-[#CAD5FE]/95 max-w-[120px] truncate" title={lead.company_name}>{lead.company_name || "—"}</td>
                          <td className="px-4 py-2.5 text-[#CAD5FE]/80 max-w-[120px] truncate">{lead.industry}</td>
                          <td className="px-4 py-2.5 text-[#CAD5FE]/80">{lead.size_bucket || "—"}</td>
                          <td className="px-4 py-2.5 text-[#CAD5FE]/80 max-w-[120px] truncate" title={lead.deal_stage}>{lead.deal_stage}</td>
                          <td className="px-4 py-2.5">
                            <SourceBadge source={lead.source} />
                          </td>
                          <td className="px-4 py-2.5 text-[#CAD5FE]/80 tabular-nums">{fmtUSD(lead.amount)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {lead.has_meeting
                              ? <span className="text-green-400">✓</span>
                              : <span className="text-[#CAD5FE]/30">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                    <span className="text-xs text-[#CAD5FE]/50">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLeads.length)} de {fmt(filteredLeads.length)} leads
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-[#CAD5FE]/65 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                      >← Ant</button>
                      <span className="px-3 text-xs text-[#CAD5FE]/50">{page} / {totalPages}</span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-[#CAD5FE]/65 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                      >Sig →</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
