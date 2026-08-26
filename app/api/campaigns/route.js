import { readFileSync } from "fs";
import { join } from "path";

// Qué inbound_source corresponde a cada plataforma en leads.json
const PLATFORM_SOURCES = {
  Meta:     ["Instagram", "Facebook"],
  LinkedIn: ["LinkedIn"],
  Google:   ["Google"],
};

// Qué rango de score corresponde a cada etapa de funnel
const FUNNEL_SCORE_RANGE = {
  BOFU: { min: 65, max: 100 },
  MOFU: { min: 45, max: 64 },
  TOFU: { min: 0,  max: 44  },
};

// Scoring (igual que en /api/leads)
const STAGE_SCORES = {
  "won": 40, "contract signed": 38, "final negotiation": 35, "active partner": 35,
  "pilot": 30, "decision maker engaged": 28, "champion engaged": 25, "demo": 22,
  "discovery": 18, "opportunity opened": 18, "engagement": 15, "prequalified": 12,
  "approaching": 10, "lead": 8, "early stage": 8, "postponed": 5, "recycling": 5,
  "lost": 0, "lost/stand by": 0, "churned/finished upsell": 0,
  "onboarding churned": 0, "success churned": 0, "success red list": 0,
};

function stageScore(s) {
  const k = (s || "").toLowerCase().trim();
  if (STAGE_SCORES[k] !== undefined) return STAGE_SCORES[k];
  for (const [key, val] of Object.entries(STAGE_SCORES)) {
    if (k.includes(key)) return val;
  }
  return 8;
}

function companySizeScore(n) {
  if (!n) return 5;
  if (n >= 1000) return 25;
  if (n >= 500)  return 20;
  if (n >= 200)  return 15;
  if (n >= 50)   return 10;
  return 5;
}

function sizeBucket(n) {
  if (!n) return "Unknown";
  if (n >= 1000) return "1000+";
  if (n >= 500)  return "500-999";
  if (n >= 200)  return "200-499";
  if (n >= 50)   return "50-199";
  return "1-49";
}

function topN(arr, key, n) {
  const map = {};
  for (const item of arr) {
    const k = item[key] || "Unknown";
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

// Calcula métricas reales desde un array de leads del CRM
function calcMetrics(leads) {
  if (!leads.length) return null;
  const count = leads.length;
  const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / count);
  const withDemo = leads.filter((l) => l.has_meeting).length;
  const pctDemo = Math.round((withDemo / count) * 100);
  const highQuality = leads.filter((l) => l.score >= 80).length;
  const industries = topN(leads, "industry", 5).map((i) => i.label);
  const seniorities = topN(leads, "seniority", 4).map((s) => s.label);
  const sizes = topN(leads, "size_bucket", 4).map((s) => s.label);
  const regions = topN(leads, "country", 5).map((r) => r.label);
  const topTitles = topN(leads, "job_title", 8).map((t) => t.label).filter(Boolean);
  const topStages = topN(leads, "deal_stage", 3).map((s) => s.label);
  const totalAmount = leads.reduce((s, l) => s + (l.amount || 0), 0);
  const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0;
  return { count, avgScore, pctDemo, highQuality, industries, seniorities, sizes, regions, topTitles, topStages, avgAmount };
}

export async function GET() {
  try {
    // Leer campañas (nombres reales) y leads del CRM
    const campaignsRaw = readFileSync(join(process.cwd(), "data", "campaigns.json"), "utf-8");
    const leadsRaw     = readFileSync(join(process.cwd(), "data", "leads.json"), "utf-8");

    const campaignDefs = JSON.parse(campaignsRaw);
    const rawLeads     = JSON.parse(leadsRaw);

    // Calcular score real de cada lead (igual que /api/leads)
    const maxAmount = Math.max(...rawLeads.map((l) => l.amount || 0));
    const scoredLeads = rawLeads.map((l) => ({
      ...l,
      size_bucket: sizeBucket(l.number_of_employees),
      score: Math.min(100, Math.max(0,
        stageScore(l.deal_stage) +
        (l.has_meeting ? 20 : 0) +
        companySizeScore(l.number_of_employees) +
        Math.round(((l.amount || 0) / maxAmount) * 15)
      )),
    }));

    // Para cada campaña, filtrar leads por plataforma + rango de score del funnel
    const campaigns = campaignDefs.map((campaign) => {
      const sources = PLATFORM_SOURCES[campaign.platform] || [];
      const range   = FUNNEL_SCORE_RANGE[campaign.funnel] || { min: 0, max: 100 };

      // Leads de esta plataforma dentro del rango de score del funnel
      const matchedLeads = scoredLeads.filter((l) =>
        sources.includes(l.inbound_source) &&
        l.score >= range.min &&
        l.score <= range.max
      );

      const metrics = calcMetrics(matchedLeads);

      return {
        ...campaign,
        // Reemplazar métricas ficticias con las reales del CRM
        leads:        metrics?.count       ?? 0,
        avg_score:    metrics?.avgScore    ?? 0,
        pct_demo:     metrics?.pctDemo     ?? 0,
        high_quality: metrics?.highQuality ?? 0,
        industries:   metrics?.industries  ?? campaign.industries,
        seniorities:  metrics?.seniorities ?? campaign.seniorities,
        top_titles:   metrics?.topTitles   ?? campaign.top_titles,
        // Campos extra del CRM
        regions:      metrics?.regions     ?? [],
        top_stages:   metrics?.topStages   ?? [],
        avg_amount:   metrics?.avgAmount   ?? 0,
        data_source:  "crm_real", // indica que los datos son reales
      };
    });

    return Response.json({ ok: true, campaigns });
  } catch (err) {
    console.error("campaigns route error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
