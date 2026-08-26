import Link from "next/link";

const CARDS = [
  {
    href: "/leads",
    icon: (
      <svg className="h-6 w-6 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: "Lead Scoring",
    desc: "Score de calidad por lead cruzando etapa del deal, tamaño de empresa, demos agendadas y pipeline generado.",
    cta: "Ver scores",
  },
  {
    href: "/audiences",
    icon: (
      <svg className="h-6 w-6 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Audience Builder",
    desc: "Perfilá leads por score tier y pedile a la IA recomendaciones de segmentación por plataforma (LinkedIn, Meta, Google).",
    cta: "Ir al builder",
  },
  {
    href: "/creatives",
    icon: (
      <svg className="h-6 w-6 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    title: "Creatives Intelligence",
    desc: "Pain points e insights de meetings del CRM convertidos en ángulos creativos, copy, hooks, guiones y briefs listos para anuncios.",
    cta: "Ver insights",
  },
  {
    href: "/revenue",
    icon: (
      <svg className="h-6 w-6 text-[#F7F7F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Revenue Intelligence",
    desc: "Cruce de campañas, calidad de leads y pipeline real. Descubrí qué canales generan revenue y dónde estás perdiendo inversión.",
    cta: "Ver revenue",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen text-white flex flex-col overflow-hidden" style={{ background: "linear-gradient(340deg, #182D7A 0%, #0d1530 30%, #0f0f0f 65%)" }}>

      {/* Grid de fondo — sutil, más visible en centro y esquinas inferiores */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(138,165,242,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(138,165,242,0.07) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 90% 55% at 50% 42%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.45) 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 55% at 50% 42%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.45) 100%)",
      }} />


      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Logo top-left */}
        <div className="absolute top-6 left-8">
          <img src="/logo.png" alt="NEXIAL" className="h-7 w-auto" />
        </div>

        <div className="mx-auto w-full max-w-6xl text-center mb-10">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-medium text-[#CAD5FE]/70">
            Huckathon
          </div>

          {/* Título grande */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl leading-[1.05] text-[#F7F7F7]">
            Optimizá campañas por<br />
            <span className="bg-gradient-to-r from-[#334FB3] to-[#8AA5F2] bg-clip-text text-transparent">calidad de lead,</span>{" "}no por volumen
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-[#CAD5FE]/65 leading-relaxed">
            Cruzamos data real del CRM con tus campañas de ads para que sepas qué funciona de verdad. Menos CPL vanity, más pipeline real.
          </p>
        </div>

        {/* 4 módulos en fila */}
        <div className="mx-auto w-full max-w-6xl grid grid-cols-4 gap-4">
          {CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-blue-500/50 hover:bg-blue-900/30 hover:shadow-xl hover:shadow-blue-800/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8AA5F2]/10 ring-1 ring-[#8AA5F2]/20 transition-all group-hover:bg-[#8AA5F2]/20">
                {card.icon}
              </div>
              <h2 className="text-sm font-bold text-[#F7F7F7]">{card.title}</h2>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#CAD5FE]/75">{card.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#8AA5F2] transition-colors group-hover:text-[#bfd0ff]">
                {card.cta}
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats — mismo ancho que las cards */}
        <div className="mx-auto mt-6 flex w-full max-w-6xl gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-10 py-6">
          {[
            { label: "Leads scored",      value: "1.000" },
            { label: "Campañas activas",  value: "53" },
            { label: "Leads BOFU",        value: "248" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-[#F7F7F7]">{stat.value}</span>
              <span className="text-xs text-[#CAD5FE]/45">{stat.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-[#CAD5FE]/30">Humand · Hackathon 2026</p>
      </main>
    </div>
  );
}
