import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/revenue/insights — recibe el contexto y devuelve análisis IA
export async function POST(req) {
  try {
    const ctx = await req.json();

    const prompt = `Eres un Revenue Intelligence Analyst para Humand (HR Tech SaaS B2B). Analiza estos datos cruzados de campañas, calidad de leads y revenue.

MÉTRICAS:
- Total leads: ${ctx.totalLeads} | BOFU: ${ctx.bofuCount} (${ctx.bofuPct}%) | Con demo: ${ctx.withMeeting} | Won: ${ctx.wonCount}
- Pipeline: $${ctx.totalPipeline?.toLocaleString()} | Revenue cerrado: $${ctx.wonRevenue?.toLocaleString()} | Score avg: ${ctx.avgScore}/100

PLATAFORMAS:
${ctx.platforms?.map((p) => `${p.platform}: ${p.total} leads | score ${p.avgScore} | ${p.pctBofu}% BOFU | ${p.pctDemo}% demo | pipeline $${p.pipeline?.toLocaleString()} | CPL $${p.avgCpl || 'N/A'}`).join("\n")}

SCORE vs PIPELINE:
${ctx.bands?.map((b) => `${b.label}: ${b.pctLeads}% leads → ${b.pctPipeline}% pipeline | ${b.pctDemo}% demo rate`).join("\n")}

TOP CAMPAÑAS: ${ctx.topCampaigns?.map((c) => `${c.name} (score ${c.avg_score}, ${c.pct_demo}% demo)`).join(" | ")}
PEORES: ${ctx.worstCampaigns?.map((c) => `${c.name} (score ${c.avg_score})`).join(" | ")}
DESPERDICIO: ${ctx.wasteAnalysis?.tofuPct}% leads TOFU → solo ${ctx.wasteAnalysis?.tofuPipelinePct}% del pipeline

Genera 4 insights ejecutivos accionables conectando campañas → calidad → revenue.

Responde SOLO con JSON válido:
{
  "headline": "Frase que resume el problema/oportunidad principal",
  "main_opportunity": "La mayor oportunidad de mejora con número concreto",
  "insights": [
    {
      "id": "ins_1",
      "title": "Título corto",
      "finding": "Hallazgo con datos (2 oraciones)",
      "action": "Acción concreta recomendada",
      "impact": "Impacto esperado",
      "type": "oportunidad|problema|alerta"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text   = result.response.text();
    const match  = text.match(/\{[\s\S]*\}/);
    const aiInsights = match ? JSON.parse(match[0]) : null;

    return Response.json({ ok: true, aiInsights });
  } catch (err) {
    console.error("revenue insights error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
