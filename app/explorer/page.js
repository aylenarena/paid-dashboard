"use client";
import Header from "../components/Header";

import { useState, useEffect } from "react";

// ─── Static metadata ──────────────────────────────────────────────────────────

const MAIN_TABLES = [
  {
    name: "companies",
    count: 1335,
    description: "Empresas y cuentas comerciales",
    emoji: "🏢",
    color: "blue",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "name", type: "text", desc: "Nombre de la empresa" },
      { name: "industry", type: "text", desc: "Industria / sector" },
      { name: "number_of_employees", type: "int", desc: "Tamaño de la empresa" },
      { name: "country", type: "text", desc: "País de la empresa" },
    ],
    sampleKey: "companies",
  },
  {
    name: "contacts",
    count: 6496,
    description: "Personas de contacto",
    emoji: "👤",
    color: "blue",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "first_name", type: "text", desc: "Nombre" },
      { name: "last_name", type: "text", desc: "Apellido" },
      { name: "job_title", type: "text", desc: "Cargo / posición" },
      { name: "company_id", type: "uuid", desc: "→ companies.id" },
    ],
    sampleKey: "contacts",
  },
  {
    name: "deals",
    count: 1000,
    description: "Oportunidades de venta",
    emoji: "💼",
    color: "green",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "deal_name", type: "text", desc: "Nombre del deal" },
      { name: "amount", type: "numeric", desc: "Monto en USD" },
      { name: "stage", type: "text", desc: "Etapa del pipeline" },
      { name: "source", type: "text", desc: "Fuente del lead" },
      { name: "close_date", type: "date", desc: "Fecha de cierre" },
      { name: "owner_id", type: "uuid", desc: "→ owners.id" },
    ],
    sampleKey: "deals",
  },
  {
    name: "meetings",
    count: 21046,
    description: "Reuniones agendadas",
    emoji: "📅",
    color: "yellow",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "title", type: "text", desc: "Título de la reunión" },
      { name: "start_time", type: "timestamp", desc: "Fecha y hora de inicio" },
      { name: "contact_id", type: "uuid", desc: "→ contacts.id" },
      { name: "deal_id", type: "uuid", desc: "→ deals.id" },
    ],
    sampleKey: "meetings",
  },
  {
    name: "call_transcripts",
    count: 500,
    description: "Grabaciones con transcripción + resumen IA",
    emoji: "🎙️",
    color: "pink",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "transcript", type: "text", desc: "Transcripción completa de la llamada" },
      { name: "summary", type: "text", desc: "Resumen generado por IA" },
      { name: "created_at", type: "timestamp", desc: "Fecha de la llamada" },
    ],
    sampleKey: "transcripts",
  },
  {
    name: "owners",
    count: 316,
    description: "Representantes de ventas",
    emoji: "🧑‍💼",
    color: "orange",
    fields: [
      { name: "id", type: "uuid", desc: "Identificador único" },
      { name: "name", type: "text", desc: "Nombre completo" },
      { name: "email", type: "text", desc: "Email corporativo" },
      { name: "team", type: "text", desc: "Equipo de ventas" },
      { name: "region", type: "text", desc: "Región asignada" },
    ],
    sampleKey: "owners",
  },
];

const JUNCTION_TABLES = [
  { name: "deal_contacts", connects: "deals ↔ contacts", cols: ["deal_id", "contact_id"] },
  { name: "meeting_contacts", connects: "meetings ↔ contacts", cols: ["meeting_id", "contact_id"] },
  { name: "meeting_deals", connects: "meetings ↔ deals", cols: ["meeting_id", "deal_id"] },
  { name: "call_transcript_deals", connects: "call_transcripts ↔ deals", cols: ["transcript_id", "deal_id"] },
  { name: "call_transcript_contacts", connects: "call_transcripts ↔ contacts", cols: ["transcript_id", "contact_id"] },
  { name: "call_transcript_companies", connects: "call_transcripts ↔ companies", cols: ["transcript_id", "company_id"] },
];

const IDEAS = [
  { emoji: "📊", title: "Pipeline analysis", desc: "¿En qué stage se caen más deals? ¿Cuál es el ticket promedio por industria?" },
  { emoji: "🧠", title: "AI lead scoring", desc: "Usá Claude para analizar transcripts y puntuar la calidad de cada lead." },
  { emoji: "🗺️", title: "Sales territory map", desc: "¿En qué países hay más oportunidades? ¿Qué owners tienen mejor win rate?" },
  { emoji: "🎯", title: "ICP detection", desc: "¿Qué tipo de empresa (industry + tamaño + país) cierra más deals?" },
  { emoji: "📞", title: "Call intelligence", desc: "Analizá los 500 transcripts con IA para detectar objeciones comunes." },
  { emoji: "⏱️", title: "Sales velocity", desc: "¿Cuánto tarda en promedio un deal en cerrarse por stage y fuente?" },
];

const FILLS = {
  violet: "#2563eb", blue: "#3b82f6", green: "#22c55e",
  yellow: "#eab308", pink: "#ec4899", orange: "#f97316",
};

const COLOR_MAP = {
  blue: { bg: "bg-blue-800/30", ring: "ring-blue-700/40", text: "text-[#8AA5F2]", badge: "bg-blue-700/40 text-[#bfd0ff]" },
  blue:   { bg: "bg-blue-500/10",   ring: "ring-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300" },
  green:  { bg: "bg-green-500/10",  ring: "ring-green-500/20",  text: "text-green-400",  badge: "bg-green-500/20 text-green-300" },
  yellow: { bg: "bg-yellow-500/10", ring: "ring-yellow-500/20", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
  pink:   { bg: "bg-pink-500/10",   ring: "ring-pink-500/20",   text: "text-pink-400",   badge: "bg-pink-500/20 text-pink-300" },
  orange: { bg: "bg-orange-500/10", ring: "ring-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
};

const TYPE_COLORS = {
  uuid: "text-[#CAD5FE]/65", text: "text-blue-400", int: "text-green-400",
  numeric: "text-green-400", date: "text-yellow-400", timestamp: "text-yellow-400",
};

function fmt(n) { return (n ?? 0).toLocaleString("es-AR"); }
function fmtUSD(n) { return "$" + Math.round(n ?? 0).toLocaleString("es-AR"); }

// ─── Mini horizontal bar ──────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5">
      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: FILLS[color] ?? "#2563eb" }} />
    </div>
  );
}

// ─── SVG bar chart (overview) ─────────────────────────────────────────────────
function OverviewChart() {
  const max = Math.max(...MAIN_TABLES.map((t) => t.count));
  const chartH = 140, barW = 52, gap = 18;
  const totalW = MAIN_TABLES.length * (barW + gap) - gap;
  return (
    <div className="overflow-x-auto">
      <svg width={totalW + 40} height={chartH + 64} className="mx-auto" style={{ minWidth: totalW + 40 }}>
        {MAIN_TABLES.map((t, i) => {
          const barH = Math.max(4, (t.count / max) * chartH);
          const x = i * (barW + gap) + 20;
          const y = chartH - barH;
          return (
            <g key={t.name}>
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={FILLS[t.color]} opacity={0.85} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">
                {t.count >= 1000 ? `${(t.count / 1000).toFixed(1)}k` : t.count}
              </text>
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={9} fill="#6b7280">
                {t.name.length > 10 ? t.name.slice(0, 9) + "…" : t.name}
              </text>
              <text x={x + barW / 2} y={chartH + 34} textAnchor="middle" fontSize={15}>{t.emoji}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Distribution chart (horizontal bars) ─────────────────────────────────────
function DistChart({ items, labelKey, valueKey, color = "blue", formatValue }) {
  if (!items?.length) return <p className="text-xs text-[#CAD5FE]/50">Sin datos</p>;
  const max = Math.max(...items.map((i) => i[valueKey]));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-32 truncate text-right text-xs text-[#CAD5FE]/80" title={item[labelKey]}>{item[labelKey]}</span>
          <div className="flex-1">
            <MiniBar value={item[valueKey]} max={max} color={color} />
          </div>
          <span className="w-16 text-xs text-[#CAD5FE]/65 text-right">
            {formatValue ? formatValue(item[valueKey]) : fmt(item[valueKey])}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Sample rows table ─────────────────────────────────────────────────────────
function SampleTable({ rows }) {
  if (!rows?.length) return <p className="text-xs text-[#CAD5FE]/50 p-4">Sin datos de muestra</p>;
  const keys = Object.keys(rows[0]).filter((k) => k !== "transcript"); // skip huge field
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-white/10">
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-3 py-2 text-left font-mono text-[#CAD5FE]/65 whitespace-nowrap">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              {keys.map((k) => (
                <td key={k} className="px-3 py-2 text-[#CAD5FE]/80 whitespace-nowrap max-w-[200px] truncate" title={String(row[k] ?? "")}>
                  {row[k] === null ? <span className="text-[#CAD5FE]/30">null</span> : String(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Table card (expandable) ───────────────────────────────────────────────────
function TableCard({ table, samples, loading }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[table.color];
  return (
    <div className={`rounded-xl border border-white/10 ${c.bg} ring-1 ${c.ring}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{table.emoji}</span>
            <h3 className="font-mono text-sm font-semibold text-white">{table.name}</h3>
          </div>
          <p className="mt-0.5 text-xs text-[#CAD5FE]/80">{table.description}</p>

          {/* Fields */}
          <div className="mt-3 space-y-1">
            {table.fields.map((f) => (
              <div key={f.name} className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-white/80">{f.name}</span>
                <span className={`font-mono text-[10px] ${TYPE_COLORS[f.type] ?? "text-[#CAD5FE]/65"}`}>{f.type}</span>
                <span className="text-[10px] text-[#CAD5FE]/50">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <span className={`ml-4 text-2xl font-bold tabular-nums ${c.text}`}>{fmt(table.count)}</span>
      </div>

      {/* Sample toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-t border-white/5 px-5 py-2.5 text-xs text-[#CAD5FE]/65 hover:text-[#CAD5FE]/95 transition-colors"
      >
        <span>Ver 5 filas de muestra</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-white/5">
          {loading ? (
            <p className="p-4 text-xs text-[#CAD5FE]/50 animate-pulse">Cargando…</p>
          ) : (
            <SampleTable rows={samples?.[table.sampleKey]} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ExplorerPage() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explore");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
      setLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const dist = data?.distributions;

  return (
    <div className="min-h-screen relative text-white">
      {/* Header */}
      <Header />

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">

        {/* Hero */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400 ring-1 ring-green-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            HubSpot Sandbox — Read Only
          </div>
          <h1 className="text-3xl font-bold">CRM Data disponible</h1>
          <p className="mt-2 max-w-xl text-[#CAD5FE]/80">
            Base de datos simulada con estructura HubSpot real. Datos ficticios con distribuciones realistas.
          </p>
        </div>

        {/* Overview chart */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Registros por tabla</h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <OverviewChart />
            <p className="mt-2 text-center text-xs text-[#CAD5FE]/50">
              Total: {fmt(MAIN_TABLES.reduce((s, t) => s + t.count, 0))} registros en tablas principales
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Live distributions */}
        {loaded && dist && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Distribuciones reales</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">💼 Deals por stage</p>
                <DistChart items={dist.dealsByStage} labelKey="stage" valueKey="count" color="green" />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">📣 Deals por fuente</p>
                <DistChart items={dist.dealsBySource} labelKey="source" valueKey="count" color="blue" />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">💵 Ticket promedio por stage</p>
                <DistChart items={dist.avgAmountByStage} labelKey="stage" valueKey="avg" color="blue" formatValue={fmtUSD} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">🏭 Top industrias</p>
                <DistChart items={dist.byIndustry} labelKey="industry" valueKey="count" color="orange" />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">🌎 Top países</p>
                <DistChart items={dist.byCountry} labelKey="country" valueKey="count" color="pink" />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">👤 Top cargos (contacts)</p>
                <DistChart items={dist.byTitle} labelKey="title" valueKey="count" color="yellow" />
              </div>

            </div>

            {/* Employee size buckets */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-xs font-semibold text-[#CAD5FE]/80">📐 Tamaño de empresa (empleados)</p>
              <div className="grid grid-cols-4 gap-3">
                {dist.bySize?.map((b) => (
                  <div key={b.size} className="rounded-lg bg-white/5 p-3 text-center">
                    <p className="text-lg font-bold text-white">{fmt(b.count)}</p>
                    <p className="mt-0.5 text-xs text-[#CAD5FE]/65">{b.size} emp.</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Table cards with expandable samples */}
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Tablas principales</h2>
          <p className="mb-4 text-xs text-[#CAD5FE]/50">Expandí cada tabla para ver filas de muestra reales</p>
          <div className="space-y-4">
            {MAIN_TABLES.map((table) => (
              <TableCard
                key={table.name}
                table={table}
                samples={data?.samples}
                loading={loading}
              />
            ))}
          </div>
        </section>

        {/* Relationship diagram */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Diagrama de relaciones</h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 font-mono text-xs text-[#CAD5FE]/65 leading-relaxed">
            <pre className="overflow-x-auto">{`
companies ──────────────────────────────────────────┐
    │                                               │
    │ company_id                         company_id │
    ▼                                               │
contacts ──── deal_contacts ──── deals ─────────────┤
    │              │                │               │
    │   meeting_contacts       meeting_deals    call_transcript_companies
    │              │                │
    └──────────────┼────────────────┘
                   ▼
               meetings

call_transcripts ── call_transcript_deals ──── deals
     │
     └── call_transcript_contacts ──── contacts
`.trim()}</pre>
          </div>
        </section>

        {/* Junction tables */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Tablas de relación (junction)</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-[#CAD5FE]/65">
                <tr>
                  <th className="px-4 py-3 text-left">Tabla</th>
                  <th className="px-4 py-3 text-left">Conecta</th>
                  <th className="px-4 py-3 text-left">Columnas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {JUNCTION_TABLES.map((jt) => (
                  <tr key={jt.name} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-[#CAD5FE]/95">{jt.name}</td>
                    <td className="px-4 py-3 text-xs text-[#CAD5FE]/65">{jt.connects}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {jt.cols.map((c) => (
                          <span key={c} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#CAD5FE]/80">{c}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ideas */}
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/65">Ideas para explorar</h2>
          <p className="mb-4 text-xs text-[#CAD5FE]/50">Preguntas que podés responder con estos datos + IA</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IDEAS.map((idea) => (
              <div key={idea.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <span className="text-xl">{idea.emoji}</span>
                <h3 className="mt-2 text-sm font-semibold text-white">{idea.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#CAD5FE]/65">{idea.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Warning */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400/80">
          ⚠️ <strong>Solo lectura.</strong> No podés insertar, actualizar ni borrar datos. Todos los nombres, emails y empresas son completamente ficticios.
        </div>

      </main>
    </div>
  );
}
