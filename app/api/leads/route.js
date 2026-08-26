import { readFileSync } from "fs";
import { join } from "path";

// ─── Scoring ──────────────────────────────────────────────────────────────────

const STAGE_SCORES = {
  "won":                       40,
  "contract signed":           38,
  "final negotiation":         35,
  "active partner":            35,
  "pilot":                     30,
  "decision maker engaged":    28,
  "champion engaged":          25,
  "demo":                      22,
  "discovery":                 18,
  "opportunity opened":        18,
  "engagement":                15,
  "prequalified":              12,
  "approaching":               10,
  "lead":                       8,
  "early stage":                8,
  "postponed":                  5,
  "recycling":                  5,
  "lost":                       0,
  "lost/stand by":              0,
  "churned/finished upsell":    0,
  "onboarding churned":         0,
  "success churned":            0,
  "success red list":           0,
};

function stageScore(dealStage) {
  const s = (dealStage || "").toLowerCase().trim();
  if (STAGE_SCORES[s] !== undefined) return STAGE_SCORES[s];
  for (const [key, val] of Object.entries(STAGE_SCORES)) {
    if (s.includes(key)) return val;
  }
  return 8;
}

function companySizeScore(n) {
  if (!n) return 5;
  if (n > 2000)  return 25;
  if (n >= 1501) return 23;
  if (n >= 1001) return 20;
  if (n >= 501)  return 17;
  if (n >= 101)  return 13;
  if (n >= 21)   return 9;
  return 5;
}

function amountScore(amount, maxAmount) {
  if (!maxAmount || !amount) return 0;
  return Math.round((amount / maxAmount) * 15);
}

function calcScore({ deal_stage, amount, maxAmount, companySize, hasMeeting }) {
  const s =
    stageScore(deal_stage) +
    (hasMeeting ? 20 : 0) +
    companySizeScore(companySize) +
    amountScore(amount, maxAmount);
  return Math.min(100, Math.max(0, s));
}

// ─── Breakdown helper ─────────────────────────────────────────────────────────

function breakdown(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key] || "Unknown";
    if (!map[k]) map[k] = { count: 0, scoreSum: 0 };
    map[k].count++;
    map[k].scoreSum += item.score;
  }
  return Object.entries(map)
    .map(([label, { count, scoreSum }]) => ({
      label,
      count,
      avg_score: Math.round(scoreSum / count),
    }))
    .sort((a, b) => b.avg_score - a.avg_score);
}

// Orden de buckets para sorting correcto en la tabla
const SIZE_BUCKET_ORDER = ["1-20", "21-100", "101-500", "501-1000", "1001-1500", "1501-2000", "2000+", "Unknown"];

function sizeBucket(n) {
  if (!n) return "Unknown";
  if (n > 2000)  return "2000+";
  if (n >= 1501) return "1501-2000";
  if (n >= 1001) return "1001-1500";
  if (n >= 501)  return "501-1000";
  if (n >= 101)  return "101-500";
  if (n >= 21)   return "21-100";
  return "1-20";
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // Leer data falsa desde JSON estático (reemplaza Supabase)
    const filePath = join(process.cwd(), "data", "leads.json");
    const raw = readFileSync(filePath, "utf-8");
    const rawLeads = JSON.parse(raw);

    const maxAmount = Math.max(...rawLeads.map((l) => l.amount || 0));

    // Calcular score y enriquecer cada lead
    const leads = rawLeads.map((l) => ({
      ...l,
      // Campos normalizados que espera el frontend
      contact_name: [l.first_name, l.last_name].filter(Boolean).join(" ") || null,
      company_name: l.company_name || l.company || null,
      employees:    l.number_of_employees || null,
      source:       l.inbound_source || null,
      size_bucket: sizeBucket(l.number_of_employees),
      score: calcScore({
        deal_stage:  l.deal_stage,
        amount:      l.amount,
        maxAmount,
        companySize: l.number_of_employees,
        hasMeeting:  l.has_meeting,
      }),
    }));

    leads.sort((a, b) => b.score - a.score);

    // Breakdowns
    const breakdowns = {
      by_source:    breakdown(leads, "inbound_source"),
      by_industry:  breakdown(leads, "industry").slice(0, 10),
      by_seniority: breakdown(leads, "seniority"),
      by_region:    breakdown(leads, "country").slice(0, 10),
      by_size:      breakdown(leads, "size_bucket").sort(
        (a, b) => SIZE_BUCKET_ORDER.indexOf(a.label) - SIZE_BUCKET_ORDER.indexOf(b.label)
      ),
      by_stage:     breakdown(leads, "deal_stage"),
      by_city:      breakdown(leads, "city").slice(0, 15),
      by_pipeline:  breakdown(leads, "pipeline"),
    };

    const total = leads.length;
    const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / total);
    const withDemo = leads.filter((l) => l.has_meeting).length;
    const sql = leads.filter((l) => l.score >= 60).length;

    return Response.json({
      ok: true,
      summary: {
        total,
        avg_score: avgScore,
        with_demo: withDemo,
        pct_demo: Math.round((withDemo / total) * 100),
        sql,
        pct_sql: Math.round((sql / total) * 100),
      },
      leads,
      breakdowns,
    });
  } catch (err) {
    console.error("leads route error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
