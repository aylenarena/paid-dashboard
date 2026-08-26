import { supabase } from "./supabase";

export async function fetchLeadData() {
  // Total deals + deals by stage
  const { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select("id, deal_name, amount, deal_stage, inbound_source, close_date, owner_id, company_id");

  if (dealsError) throw new Error(`Deals fetch failed: ${dealsError.message}`);

  const totalDeals = deals.length;

  const dealsByStage = Object.entries(
    deals.reduce((acc, deal) => {
      const s = deal.deal_stage || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {})
  ).map(([stage, count]) => ({ stage, count }));

  // Meetings count (proxy for demos booked)
  const { count: meetingsCount, error: meetingsError } = await supabase
    .from("meetings")
    .select("id", { count: "exact", head: true });

  if (meetingsError)
    throw new Error(`Meetings fetch failed: ${meetingsError.message}`);

  // Top 10 deals by amount — join contacts + companies
  const topDeals = [...deals]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 10);

  const topDealIds = topDeals.map((d) => d.id);

  const { data: dealContacts, error: dcError } = await supabase
    .from("deal_contacts")
    .select("deal_id, contact_id")
    .in("deal_id", topDealIds);

  if (dcError)
    throw new Error(`Deal contacts fetch failed: ${dcError.message}`);

  const contactIds = [...new Set(dealContacts.map((dc) => dc.contact_id))];

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, job_title, company_id")
    .in("id", contactIds);

  if (contactsError)
    throw new Error(`Contacts fetch failed: ${contactsError.message}`);

  const companyIds = [
    ...new Set(contacts.map((c) => c.company_id).filter(Boolean)),
  ];

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name, industry, number_of_employees, country")
    .in("id", companyIds);

  if (companiesError)
    throw new Error(`Companies fetch failed: ${companiesError.message}`);

  // Build lookup maps
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));
  const dealToContacts = dealContacts.reduce((acc, dc) => {
    if (!acc[dc.deal_id]) acc[dc.deal_id] = [];
    acc[dc.deal_id].push(dc.contact_id);
    return acc;
  }, {});

  const enrichedTopDeals = topDeals.map((deal) => {
    const dealContactObjects = (dealToContacts[deal.id] || [])
      .map((cid) => contactMap[cid])
      .filter(Boolean)
      .map((contact) => {
        const company = companyMap[contact.company_id] || {};
        return {
          name: `${contact.first_name} ${contact.last_name}`,
          job_title: contact.job_title,
          industry: company.industry,
          country: company.country,
          number_of_employees: company.number_of_employees,
        };
      });

    return {
      deal_name: deal.deal_name,
      amount: deal.amount,
      stage: deal.deal_stage,
      source: deal.inbound_source,
      close_date: deal.close_date,
      contacts: dealContactObjects,
    };
  });

  return {
    total_deals: totalDeals,
    deals_by_stage: dealsByStage,
    meetings_count: meetingsCount,
    top_deals: enrichedTopDeals,
  };
}
