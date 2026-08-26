import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET() {
  try {
    // ── Fetch Supabase en paralelo ─────────────────────────────────────────
    const [
      { data: transcripts, error: tErr },
      { data: meetings,    error: mErr },
      { data: contacts,    error: cErr },
      { data: companies,   error: coErr },
      { data: deals,       error: dErr },
    ] = await Promise.all([
      supabase.from("call_transcripts").select("id, summary").not("summary", "is", null).limit(40),
      supabase.from("meetings").select("id, title").not("title", "is", null).limit(40),
      supabase.from("contacts").select("id, job_title, lifecycle_stage").not("job_title", "is", null).limit(60),
      supabase.from("companies").select("id, industry").not("industry", "is", null).limit(60),
      supabase.from("deals").select("id, deal_stage, inbound_source").not("deal_stage", "is", null).limit(80),
    ]);

    if (tErr) throw new Error(`call_transcripts: ${tErr.message}`);
    if (mErr) throw new Error(`meetings: ${mErr.message}`);
    if (cErr) throw new Error(`contacts: ${cErr.message}`);
    if (coErr) throw new Error(`companies: ${coErr.message}`);
    if (dErr) throw new Error(`deals: ${dErr.message}`);

    // ── Armar contexto compacto ────────────────────────────────────────────
    const summaries = (transcripts || []).map((t) => t.summary).filter(Boolean).slice(0, 20).join("\n---\n");
    const meetingTitles = [...new Set((meetings || []).map((m) => m.title).filter(Boolean))].slice(0, 20);
    const jobTitles = Object.entries((contacts || []).reduce((acc, c) => { if (c.job_title) acc[c.job_title] = (acc[c.job_title] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t}(${n})`);
    const industries = Object.entries((companies || []).reduce((acc, c) => { if (c.industry) acc[c.industry] = (acc[c.industry] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([i, n]) => `${i}(${n})`);
    const stageBreakdown = Object.entries((deals || []).reduce((acc, d) => { if (d.deal_stage) acc[d.deal_stage] = (acc[d.deal_stage] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, n]) => `${s}:${n}`);

    // ── Prompt optimizado: solo pain points e insights ─────────────────────
    const prompt = `Sos experto en performance marketing B2B para HR Tech SaaS. Analizás datos del CRM de Humand para extraer insights accionables.

RESÚMENES DE LLAMADAS (${transcripts?.length || 0} registros):
${summaries.slice(0, 2500) || "No disponibles"}

MEETINGS: ${meetingTitles.join(" | ")}
JOB TITLES: ${jobTitles.join(", ")}
INDUSTRIAS: ${industries.join(", ")}
DEAL STAGES: ${stageBreakdown.join(", ")}

Respondé SOLO con JSON válido (sin texto antes ni después):
{
  "pain_points": [
    {
      "id": "pp1",
      "title": "Título corto",
      "description": "Qué problema tienen y por qué les duele (2-3 oraciones)",
      "frequency": "alta|media|baja",
      "industries": ["industria1"],
      "job_titles": ["título1"],
      "quote": "Frase representativa en primera persona",
      "funnel_stage": "TOFU|MOFU|BOFU"
    }
  ],
  "insights": [
    {
      "id": "ins1",
      "title": "Título del insight",
      "description": "Patrón o hallazgo en los datos (2 oraciones)",
      "impact": "alto|medio|bajo",
      "source": "calls|meetings|deals|contacts",
      "action": "Acción concreta para campañas de ads"
    }
  ]
}

Generá exactamente 5 pain points y 5 insights. Basate SOLO en los datos reales del CRM.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini no devolvió JSON válido");

    const analysis = JSON.parse(jsonMatch[0]);

    return Response.json({
      ok: true,
      analysis,
      meta: {
        transcripts_analyzed: transcripts?.length || 0,
        meetings_analyzed:    meetings?.length    || 0,
        contacts_analyzed:    contacts?.length    || 0,
        companies_analyzed:   companies?.length   || 0,
        deals_analyzed:       deals?.length       || 0,
      },
    });
  } catch (err) {
    console.error("creatives route error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
