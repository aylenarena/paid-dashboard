import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // ── Sample rows (5 per table) ────────────────────────────────────────────
    const [
      { data: companies },
      { data: contacts },
      { data: deals },
      { data: meetings },
      { data: transcripts },
      { data: owners },
    ] = await Promise.all([
      supabase.from("companies").select("id, name, industry, country, number_of_employees, lifecycle_stage").limit(5),
      supabase.from("contacts").select("id, first_name, last_name, email, job_title, lifecycle_stage, company_id").limit(5),
      supabase.from("deals").select("id, deal_name, amount, deal_stage, inbound_source, close_date, owner_id").limit(5),
      supabase.from("meetings").select("id, title, start_time, contact_id, deal_id").limit(5),
      supabase.from("call_transcripts").select("id, summary, created_at").limit(5),
      supabase.from("owners").select("id, first_name, last_name, email").limit(5),
    ]);

    // ── Distributions ────────────────────────────────────────────────────────

    // Deals by stage
    const { data: allDeals } = await supabase
      .from("deals")
      .select("deal_stage, inbound_source, amount");

    const dealsByStage = Object.entries(
      (allDeals || []).reduce((acc, d) => {
        const s = d.deal_stage || "Unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);

    // Deals by source
    const dealsBySource = Object.entries(
      (allDeals || []).reduce((acc, d) => {
        const src = d.inbound_source || "Unknown";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Average deal amount by stage
    const avgAmountByStage = Object.entries(
      (allDeals || []).reduce((acc, d) => {
        const s = d.deal_stage || "Unknown";
        if (!acc[s]) acc[s] = { sum: 0, count: 0 };
        acc[s].sum += d.amount || 0;
        acc[s].count += 1;
        return acc;
      }, {})
    ).map(([stage, { sum, count }]) => ({
      stage,
      avg: Math.round(sum / count),
    }));

    // Companies by industry (top 10)
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("industry, number_of_employees, country");

    const byIndustry = Object.entries(
      (allCompanies || []).reduce((acc, c) => {
        const ind = c.industry || "Unknown";
        acc[ind] = (acc[ind] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Companies by country (top 10)
    const byCountry = Object.entries(
      (allCompanies || []).reduce((acc, c) => {
        const country = c.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Employee size buckets
    const sizeBuckets = { "1-50": 0, "51-200": 0, "201-1000": 0, "1000+": 0 };
    (allCompanies || []).forEach((c) => {
      const n = c.number_of_employees || 0;
      if (n <= 50) sizeBuckets["1-50"]++;
      else if (n <= 200) sizeBuckets["51-200"]++;
      else if (n <= 1000) sizeBuckets["201-1000"]++;
      else sizeBuckets["1000+"]++;
    });
    const bySize = Object.entries(sizeBuckets).map(([size, count]) => ({
      size,
      count,
    }));

    // Contacts by job title (top 10)
    const { data: allContacts } = await supabase
      .from("contacts")
      .select("job_title");

    const byTitle = Object.entries(
      (allContacts || []).reduce((acc, c) => {
        const t = c.job_title || "Unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return Response.json({
      ok: true,
      samples: { companies, contacts, deals, meetings, transcripts, owners },
      distributions: {
        dealsByStage,
        dealsBySource,
        avgAmountByStage,
        byIndustry,
        byCountry,
        bySize,
        byTitle,
      },
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
