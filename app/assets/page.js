"use client";
import { useState, useCallback } from "react";
import Link from "next/link";

// Tabs de assets disponibles
const ASSET_TABS = [
  { id: "hooks",                 label: "Hooks",            icon: "🎣", color: "#2563eb" },
  { id: "headlines",             label: "Headlines",        icon: "📰", color: "#2563eb" },
  { id: "value_propositions",    label: "Value Props",      icon: "💎", color: "#2563eb" },
  { id: "video_scripts",         label: "Guiones",          icon: "🎬", color: "#2563eb" },
  { id: "carousel_structures",   label: "Carrusel",         icon: "📑", color: "#2563eb" },
  { id: "objection_counters",    label: "Objeciones",       icon: "🛡",  color: "#2563eb" },
  { id: "differentiation_claims",label: "Diferenciación",   icon: "⚡", color: "#2563eb" },
];

const FREQ_COLOR = { alta: "#ef4444", media: "#f59e0b", baja: "#6b7280" };

function CopyBtn({ text, small }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className={`shrink-0 rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-blue-500/50 hover:bg-blue-800/30 ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
    >
      {done ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function HookList({ items }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((hook, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-800/40 text-xs font-bold text-[#8AA5F2]">{i + 1}</span>
          <p className="flex-1 text-sm leading-relaxed text-[#F7F7F7]/90">{hook}</p>
          <CopyBtn text={hook} small />
        </div>
      ))}
    </div>
  );
}

function HeadlineList({ items }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((h, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="text-[#8AA5F2] font-bold text-sm shrink-0">H{i + 1}</span>
          <p className="flex-1 text-sm font-medium text-white">{h}</p>
          <CopyBtn text={h} small />
        </div>
      ))}
    </div>
  );
}

function ValuePropList({ items }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((v, i) => (
        <div key={i} className="rounded-xl border border-blue-700/40 bg-blue-900/40 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#8AA5F2] font-bold text-sm shrink-0">VP{i + 1}</span>
            <p className="flex-1 text-sm leading-relaxed text-[#F7F7F7]/90">{v}</p>
            <CopyBtn text={v} small />
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoScripts({ items }) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((v, i) => (
        <div key={i} className="rounded-xl border border-blue-700/40 bg-blue-900/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[#8AA5F2]">🎬</span>
              <span className="font-semibold text-white text-sm">{v.title}</span>
              <span className="rounded-full bg-blue-700/40 px-2 py-0.5 text-xs text-[#8AA5F2]">{v.duration}</span>
            </div>
            <CopyBtn text={`${v.title}\n\n${v.script}`} small />
          </div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[#CAD5FE]/95 font-mono bg-[#080e1a]/80 rounded-lg p-3">{v.script}</pre>
        </div>
      ))}
    </div>
  );
}

function CarouselStructures({ items }) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((c, i) => (
        <div key={i} className="rounded-xl border border-blue-700/40 bg-blue-900/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span>📑</span>
              <span className="font-semibold text-white text-sm">{c.title}</span>
              <span className="rounded-full bg-blue-700/40 px-2 py-0.5 text-xs text-[#8AA5F2]">{c.slides?.length} slides</span>
            </div>
            <CopyBtn text={`${c.title}\n\n${c.slides?.map((s, j) => `${j + 1}. ${s}`).join("\n")}`} small />
          </div>
          <div className="flex flex-col gap-2">
            {c.slides?.map((slide, j) => (
              <div key={j} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-800/40 text-xs font-bold text-[#bfd0ff]">{j + 1}</span>
                <p className="text-xs text-[#CAD5FE]/95 leading-relaxed">{slide}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectionCounters({ items }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((o, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-blue-800/40 px-2 py-0.5 text-xs text-[#8AA5F2] font-medium">Objeción</span>
          </div>
          <p className="text-sm text-[#CAD5FE]/95 mb-3">"{o.objection}"</p>
          <div className="flex items-start gap-2">
            <span className="rounded bg-blue-800/40 px-2 py-0.5 text-xs text-[#8AA5F2] font-medium shrink-0">Respuesta</span>
            <p className="text-sm text-white leading-relaxed">{o.counter}</p>
          </div>
          <div className="mt-3 flex justify-end">
            <CopyBtn text={`OBJECIÓN: ${o.objection}\nRESPUESTA: ${o.counter}`} small />
          </div>
        </div>
      ))}
    </div>
  );
}

function DiffClaims({ items }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((claim, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="text-[#8AA5F2] text-lg shrink-0">⚡</span>
          <p className="flex-1 text-sm text-white leading-relaxed">{claim}</p>
          <CopyBtn text={claim} small />
        </div>
      ))}
    </div>
  );
}

function AssetPanel({ assets, activeTab }) {
  if (!assets) return null;
  const tab = ASSET_TABS.find((t) => t.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "hooks":                  return <HookList items={assets.hooks || []} />;
      case "headlines":              return <HeadlineList items={assets.headlines || []} />;
      case "value_propositions":     return <ValuePropList items={assets.value_propositions || []} />;
      case "video_scripts":          return <VideoScripts items={assets.video_scripts || []} />;
      case "carousel_structures":    return <CarouselStructures items={assets.carousel_structures || []} />;
      case "objection_counters":     return <ObjectionCounters items={assets.objection_counters || []} />;
      case "differentiation_claims": return <DiffClaims items={assets.differentiation_claims || []} />;
      default:                       return null;
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{tab?.icon}</span>
        <h3 className="text-lg font-bold text-white">{tab?.label}</h3>
      </div>
      {renderContent()}
    </div>
  );
}

export default function AssetsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPP, setSelectedPP] = useState(null);
  const [activeTab, setActiveTab] = useState("hooks");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
      setSelectedPP(json.pain_points?.[0]?.id || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedPainPoint = data?.pain_points?.find((p) => p.id === selectedPP);

  // Función para copiar todos los assets del pain point seleccionado
  function copyAll() {
    if (!selectedPainPoint) return;
    const pp = selectedPainPoint;
    const a = pp.assets;
    const text = [
      `=== ${pp.title} ===`,
      `Segmento: ${pp.segment}`,
      "",
      "HOOKS:",
      ...(a.hooks || []).map((h, i) => `${i + 1}. ${h}`),
      "",
      "HEADLINES:",
      ...(a.headlines || []).map((h, i) => `${i + 1}. ${h}`),
      "",
      "VALUE PROPOSITIONS:",
      ...(a.value_propositions || []).map((v, i) => `${i + 1}. ${v}`),
      "",
      "CLAIMS DE DIFERENCIACIÓN:",
      ...(a.differentiation_claims || []).map((c, i) => `${i + 1}. ${c}`),
      "",
      "GUIONES DE VIDEO:",
      ...(a.video_scripts || []).map((v) => `[${v.title} - ${v.duration}]\n${v.script}`),
      "",
      "ESTRUCTURA DE CARRUSEL:",
      ...(a.carousel_structures || []).flatMap((c) => [
        `[${c.title}]`,
        ...(c.slides || []).map((s, j) => `  Slide ${j + 1}: ${s}`),
      ]),
      "",
      "CONTRA-OBJECIONES:",
      ...(a.objection_counters || []).map((o) => `Obj: ${o.objection}\nResp: ${o.counter}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen relative text-white">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#080e1a]/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-[#CAD5FE]/65 hover:text-white transition-colors text-sm">
              ← Inicio
            </Link>
            <span className="text-[#CAD5FE]/30">/</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8AA5F2]/10 ring-1 ring-[#8AA5F2]/20">
                <svg className="h-4 w-4 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-white">Generador de Assets</h1>
              <span className="rounded-full border border-blue-600/40 bg-blue-800/30 px-2 py-0.5 text-xs text-[#8AA5F2]">
                
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data && selectedPainPoint && (
              <button
                onClick={copyAll}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#CAD5FE]/80 hover:border-white/20 hover:text-white transition-colors"
              >
                📋 Copiar todo
              </button>
            )}
            <button
              onClick={fetchAssets}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>{data ? "↺ Regenerar" : "✦ Generar Assets"}</>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Estado inicial */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-700/40 bg-blue-800/30">
              <svg className="h-9 w-9 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Generador de Assets Estratégicos</h2>
              <p className="text-[#CAD5FE]/65 max-w-md">
                Analiza los pain points reales del CRM y genera hooks, guiones de video, carruseles, headlines, value propositions, contra-objeciones y claims de diferenciación listos para usar.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-[#CAD5FE]/50">
              {ASSET_TABS.map((t) => (
                <span key={t.id} className="rounded-full border border-white/10 px-3 py-1">
                  {t.icon} {t.label}
                </span>
              ))}
            </div>
            <button
              onClick={fetchAssets}
              className="mt-2 rounded-xl bg-blue-600 px-8 py-3 text-base font-bold text-white hover:bg-blue-500 transition-colors"
            >
              ✦ Analizar CRM y Generar Assets
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <svg className="h-10 w-10 animate-spin text-[#F7F7F7]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[#CAD5FE]/80 text-sm">Analizando CRM y generando assets…</p>
            <p className="text-[#CAD5FE]/50 text-xs">Esto puede tardar unos segundos</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {/* Contenido principal */}
        {data && !loading && (
          <div className="flex gap-6">
            {/* Sidebar: Pain Points */}
            <aside className="w-64 shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#CAD5FE]/50">Pain Points ({data.pain_points?.length})</p>
              <div className="flex flex-col gap-2">
                {data.pain_points?.map((pp) => (
                  <button
                    key={pp.id}
                    onClick={() => setSelectedPP(pp.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedPP === pp.id
                        ? "border-blue-500/50 bg-blue-800/30"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-white leading-snug">{pp.title}</p>
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `${FREQ_COLOR[pp.frequency]}20`,
                          color: FREQ_COLOR[pp.frequency],
                        }}
                      >
                        {pp.frequency}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CAD5FE]/50 leading-snug">{pp.segment}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main: Assets del pain point seleccionado */}
            <div className="flex-1 min-w-0">
              {selectedPainPoint && (
                <>
                  {/* Header del pain point */}
                  <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">{selectedPainPoint.title}</h2>
                        <p className="text-sm text-[#CAD5FE]/80 leading-relaxed">{selectedPainPoint.description}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: `${FREQ_COLOR[selectedPainPoint.frequency]}20`,
                          color: FREQ_COLOR[selectedPainPoint.frequency],
                        }}
                      >
                        Frecuencia {selectedPainPoint.frequency}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-[#CAD5FE]/50">Segmento:</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#CAD5FE]/80">{selectedPainPoint.segment}</span>
                    </div>
                  </div>

                  {/* Tabs de asset types */}
                  <div className="mb-5 flex flex-wrap gap-2">
                    {ASSET_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          activeTab === tab.id
                            ? "border-transparent text-black"
                            : "border-white/10 text-[#CAD5FE]/80 hover:border-white/20 hover:text-white"
                        }`}
                        style={activeTab === tab.id ? { background: tab.color } : {}}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Contenido del tab */}
                  <AssetPanel assets={selectedPainPoint.assets} activeTab={activeTab} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
