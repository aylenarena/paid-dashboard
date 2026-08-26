import { readFileSync } from "fs";
import { join } from "path";

const STAGE_SCORES = {
  "won": 40, "contract signed": 38, "final negotiation": 35, "active partner": 35,
  "pilot": 30, "decision maker engaged": 28, "champion engaged": 25, "demo": 22,
  "discovery": 18, "opportunity opened": 18, "engagement": 15, "prequalified": 12,
  "approaching": 10, "lead": 8, "early stage": 8, "postponed": 5, "recycling": 5,
  "lost": 0, "lost/stand by": 0,
};
function stageScore(s) {
  const k = (s || "").toLowerCase().trim();
  if (STAGE_SCORES[k] !== undefined) return STAGE_SCORES[k];
  for (const [key, val] of Object.entries(STAGE_SCORES)) if (k.includes(key)) return val;
  return 8;
}
function companySizeScore(n) {
  if (!n) return 5;
  if (n >= 1000) return 25; if (n >= 500) return 20;
  if (n >= 200) return 15;  if (n >= 50) return 10;
  return 5;
}

const PLATFORM_SOURCES = {
  Meta:     ["Instagram", "Facebook"],
  LinkedIn: ["LinkedIn"],
  Google:   ["Google"],
  Organic:  ["Organic"],
  Referral: ["Referral"],
  Event:    ["Event"],
};

// GET /api/revenue — devuelve métricas calculadas al instante (sin IA)
export async function GET() {
  try {
    const rawLeads     = JSON.parse(readFileSync(join(process.cwd(), "data", "leads.json"),     "utf-8"));
    const campaignDefs = JSON.parse(readFileSync(join(process.cwd(), "data", "campaigns.json"), "utf-8"));

    const maxAmount = Math.max(...rawLeads.map((l) => l.amount || 0));
    const leads = rawLeads.map((l) => ({
      ...l,
      score: Math.min(100, Math.max(0,
        stageScore(l.deal_stage) +
        (l.has_meeting ? 20 : 0) +
        companySizeScore(l.number_of_employees) +
        Math.round(((l.amount || 0) / maxAmount) * 15)
      )),
    }));

    const totalLeads    = leads.length;
    const bofuLeads     = leads.filter((l) => l.score >= 65);
    const withMeeting   = leads.filter((l) => l.has_meeting);
    const wonLeads      = leads.filter((l) => (l.deal_stage || "").toLowerCase() === "won");
    const totalPipeline = leads.reduce((s, l) => s + (l.amount || 0), 0);
    const wonRevenue    = wonLeads.reduce((s, l) => s + (l.amount || 0), 0);
    const avgScore      = Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length);

    // Por plataforma
    const platformStats = {};
    for (const [platform, sources] of Object.entries(PLATFORM_SOURCES)) {
      const pl = leads.filter((l) => sources.includes(l.inbound_source));
      if (!pl.length) continue;
      const bofu     = pl.filter((l) => l.score >= 65);
      const demos    = pl.filter((l) => l.has_meeting);
      const won      = pl.filter((l) => (l.deal_stage || "").toLowerCase() === "won");
      const pipeline = pl.reduce((s, l) => s + (l.amount || 0), 0);
      const platCampaigns = campaignDefs.filter((c) => c.platform === platform);
      const totalSpend    = platCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
      const avgCpl = platCampaigns.length ? Math.round(totalSpend / platCampaigns.length) : null;
      platformStats[platform] = {
        platform, total: pl.length,
        bofu: bofu.length, pctBofu: Math.round((bofu.length / pl.length) * 100),
        demos: demos.length, pctDemo: Math.round((demos.length / pl.length) * 100),
        won: won.length, pctWon: won.length > 0 ? Math.round((won.length / pl.length) * 100) : 0,
        pipeline,
        avgScore: Math.round(pl.reduce((s, l) => s + l.score, 0) / pl.length),
        avgDeal:  won.length ? Math.round(won.reduce((s, l) => s + (l.amount || 0), 0) / won.length) : 0,
        avgCpl, revenuePerLead: Math.round(pipeline / pl.length),
      };
    }

    // Score bands
    const bands = [
      { label: "BOFU (65-100)", min: 65, max: 100, color: "#10b981" },
      { label: "MOFU (45-64)",  min: 45, max: 64,  color: "#f59e0b" },
      { label: "TOFU (0-44)",   min: 0,  max: 44,  color: "#6b7280" },
    ].map((b) => {
      const bl = leads.filter((l) => l.score >= b.min && l.score <= b.max);
      const bp = bl.reduce((s, l) => s + (l.amount || 0), 0);
      return {
        ...b, count: bl.length, pipeline: bp,
        pctLeads:    Math.round((bl.length / totalLeads) * 100),
        pctPipeline: totalPipeline > 0 ? Math.round((bp / totalPipeline) * 100) : 0,
        pctDemo:     bl.length ? Math.round((bl.filter((l) => l.has_meeting).length / bl.length) * 100) : 0,
        avgDeal:     bl.length ? Math.round(bp / bl.length) : 0,
      };
    });

    // Top / peores campañas
    const campaignScores = campaignDefs.map((c) => {
      const sources = PLATFORM_SOURCES[c.platform] || [];
      const range   = c.funnel === "BOFU" ? [65,100] : c.funnel === "MOFU" ? [45,64] : [0,44];
      const cl      = leads.filter((l) => sources.includes(l.inbound_source) && l.score >= range[0] && l.score <= range[1]);
      const pipeline = cl.reduce((s, l) => s + (l.amount || 0), 0);
      const avgSc    = cl.length ? Math.round(cl.reduce((s, l) => s + l.score, 0) / cl.length) : 0;
      const pctDemo  = cl.length ? Math.round((cl.filter((l) => l.has_meeting).length / cl.length) * 100) : 0;
      const revenueEfficiency = c.spend > 0 ? Math.round(pipeline / c.spend * 100) / 100 : 0;
      return { ...c, leads: cl.length, avg_score: avgSc, pipeline, pct_demo: pctDemo, revenueEfficiency };
    }).filter((c) => c.leads > 0);

    const topCampaigns   = [...campaignScores].sort((a, b) => b.avg_score - a.avg_score).slice(0, 5);
    const worstCampaigns = [...campaignScores].sort((a, b) => a.avg_score - b.avg_score).slice(0, 5);

    const tofuLeads    = leads.filter((l) => l.score < 45);
    const tofuPipeline = tofuLeads.reduce((s, l) => s + (l.amount || 0), 0);
    const tofuSpend    = campaignDefs.filter((c) => c.funnel === "TOFU").reduce((s, c) => s + (c.spend || 0), 0);
    const wasteAnalysis = {
      tofuLeads: tofuLeads.length,
      tofuPct: Math.round((tofuLeads.length / totalLeads) * 100),
      tofuPipeline,
      tofuPipelinePct: totalPipeline > 0 ? Math.round((tofuPipeline / totalPipeline) * 100) : 0,
      tofuSpend,
    };

    // Contexto para que el frontend llame a /api/revenue/insights
    const insightContext = {
      totalLeads, bofuCount: bofuLeads.length, bofuPct: Math.round(bofuLeads.length/totalLeads*100),
      withMeeting: withMeeting.length, wonCount: wonLeads.length,
      totalPipeline, wonRevenue, avgScore,
      platforms: Object.values(platformStats).map((p) => ({
        platform: p.platform, total: p.total, avgScore: p.avgScore,
        pctBofu: p.pctBofu, pctDemo: p.pctDemo, pipeline: p.pipeline, avgCpl: p.avgCpl,
      })),
      bands: bands.map((b) => ({ label: b.label, pctLeads: b.pctLeads, pctPipeline: b.pctPipeline, pctDemo: b.pctDemo })),
      topCampaigns:   topCampaigns.map((c)   => ({ name: c.name, platform: c.platform, funnel: c.funnel, avg_score: c.avg_score, pct_demo: c.pct_demo, pipeline: c.pipeline })),
      worstCampaigns: worstCampaigns.map((c) => ({ name: c.name, platform: c.platform, funnel: c.funnel, avg_score: c.avg_score, pct_demo: c.pct_demo })),
      wasteAnalysis,
    };

    return Response.json({
      ok: true,
      funnel: { totalLeads, bofuLeads: bofuLeads.length, withMeeting: withMeeting.length, wonLeads: wonLeads.length, totalPipeline, wonRevenue, avgScore },
      platformStats: Object.values(platformStats),
      bands, topCampaigns, worstCampaigns, wasteAnalysis,
      insightContext, // el frontend lo usa para llamar a /api/revenue/insights
    });
  } catch (err) {
    console.error("revenue route error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
