// Script para generar 1000 leads falsos realistas para AIXIOM
// Contexto: HR Tech SaaS B2B, Latam + España

import { writeFileSync } from "fs";

const COUNTRIES = [
  { name: "Argentina", cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Tucumán"] },
  { name: "México", cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana"] },
  { name: "Colombia", cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"] },
  { name: "Chile", cities: ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta"] },
  { name: "Brasil", cities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre"] },
  { name: "Perú", cities: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura"] },
  { name: "España", cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"] },
];

const INDUSTRIES = [
  "Retail", "Logística", "Manufactura", "Salud", "Finanzas",
  "Construcción", "Tecnología", "Educación", "Alimentación", "Telecomunicaciones"
];

const FIRST_NAMES = [
  "Martín", "Lucía", "Santiago", "Valentina", "Agustín", "Camila", "Nicolás", "Florencia",
  "Diego", "Sofía", "Andrés", "María", "Carlos", "Ana", "Fernando", "Laura",
  "Pablo", "Carolina", "Javier", "Gabriela", "Roberto", "Patricia", "Miguel", "Daniela",
  "Ricardo", "Isabella", "Gustavo", "Natalia", "Alejandro", "Verónica",
  "Luis", "Elena", "Jorge", "Claudia", "Eduardo", "Paola", "Sergio", "Monica",
  "Rafael", "Andrea", "Hernán", "Vanessa", "Rodrigo", "Jimena", "Matías", "Valeria"
];

const LAST_NAMES = [
  "García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Ramírez",
  "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Cruz",
  "Ortiz", "Gutiérrez", "Chávez", "Ramos", "Mendoza", "Ruiz", "Álvarez", "Jiménez",
  "Hernández", "Castro", "Vargas", "Romero", "Suárez", "Navarro",
  "Medina", "Vega", "Rojas", "Cabrera", "Herrera", "Fernández", "Aguilar", "Muñoz"
];

// Job titles por seniority
const JOBS_BY_SENIORITY = {
  "C-Level / VP": [
    "CEO", "COO", "CFO", "CTO", "CHRO", "Chief People Officer",
    "VP of Human Resources", "VP of Operations", "VP of People",
    "Director General", "Founder & CEO", "Co-Founder"
  ],
  "Manager": [
    "HR Manager", "People Manager", "Talent Acquisition Manager",
    "Operations Manager", "HR Business Partner", "Payroll Manager",
    "Employee Experience Manager", "Workforce Manager", "Training Manager",
    "Compensation & Benefits Manager", "HR Director", "People Operations Manager"
  ],
  "Technical": [
    "HR Consultant", "People Analytics Specialist", "HRIS Specialist",
    "Organizational Development Specialist", "HR Systems Architect",
    "Workforce Planning Analyst", "HR Technology Consultant"
  ],
  "IC": [
    "HR Analyst", "Talent Acquisition Specialist", "HR Coordinator",
    "Recruiter", "People Operations Coordinator", "HR Assistant",
    "Benefits Coordinator", "Payroll Analyst", "HR Generalist"
  ]
};

const DEAL_STAGES = [
  "lead", "approaching", "prequalified", "discovery", "demo",
  "champion engaged", "decision maker engaged", "pilot",
  "final negotiation", "won", "lost"
];

// Peso de cada stage para generar distribución realista (más en la parte baja del funnel)
const STAGE_WEIGHTS = [120, 100, 90, 80, 70, 60, 50, 40, 30, 80, 180];

const INBOUND_SOURCES = ["Facebook", "Instagram", "LinkedIn", "Google", "Referral", "Event", "Organic"];
// Distribución: más Meta y LinkedIn en un contexto de ads
const SOURCE_WEIGHTS = [200, 180, 250, 150, 80, 60, 80];

const DEAL_TYPES = ["New Business", "Upsell", "Expansion", "Renewal"];
const PIPELINES = ["Outbound", "Inbound", "Partnerships", "Enterprise"];
const LIFECYCLE_STAGES = ["lead", "marketing qualified lead", "sales qualified lead", "opportunity", "customer"];
const LEAD_STATUSES = ["new", "open", "in progress", "open deal", "unqualified", "bad timing"];

function rand(arr, weights) {
  if (!weights) return arr[Math.floor(Math.random() * arr.length)];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().split("T")[0];
}

function stageIndex(stage) {
  return DEAL_STAGES.indexOf(stage);
}

// Correlaciones clave:
// - LinkedIn → mejor quality (stage más alto, más meetings)
// - C-Level → mayor amount
// - Empresa grande → más meetings, mejor stage
// - Facebook/Instagram → más volumen, menor calidad promedio

function generateLead(id) {
  const country = rand(COUNTRIES);
  const city = rand(country.cities);
  const industry = rand(INDUSTRIES);

  // Empresa size — distribución realista B2B
  const sizeRoll = Math.random();
  let employees, annual_revenue;
  if (sizeRoll < 0.15) {
    employees = randInt(10, 49);
    annual_revenue = randInt(500_000, 5_000_000);
  } else if (sizeRoll < 0.40) {
    employees = randInt(50, 199);
    annual_revenue = randInt(2_000_000, 20_000_000);
  } else if (sizeRoll < 0.65) {
    employees = randInt(200, 499);
    annual_revenue = randInt(10_000_000, 80_000_000);
  } else if (sizeRoll < 0.82) {
    employees = randInt(500, 999);
    annual_revenue = randInt(50_000_000, 200_000_000);
  } else {
    employees = randInt(1000, 10000);
    annual_revenue = randInt(100_000_000, 1_000_000_000);
  }

  // Source — con pesos
  const inbound_source = rand(INBOUND_SOURCES, SOURCE_WEIGHTS);
  const isLinkedIn = inbound_source === "LinkedIn";
  const isMeta = ["Facebook", "Instagram"].includes(inbound_source);

  // Seniority — LinkedIn tiende a C-Level/Manager, Meta más IC
  let seniorityWeights;
  if (isLinkedIn) {
    seniorityWeights = [30, 40, 15, 15]; // C-Level, Manager, Technical, IC
  } else if (isMeta) {
    seniorityWeights = [10, 25, 15, 50];
  } else {
    seniorityWeights = [20, 35, 15, 30];
  }
  const seniorityKeys = ["C-Level / VP", "Manager", "Technical", "IC"];
  const seniority = rand(seniorityKeys, seniorityWeights);
  const job_title = rand(JOBS_BY_SENIORITY[seniority]);

  // Deal stage — correlacionado con source, seniority y tamaño
  let stageBonus = 0;
  if (isLinkedIn) stageBonus += 2;
  if (seniority === "C-Level / VP") stageBonus += 1;
  if (employees >= 500) stageBonus += 1;
  if (isMeta) stageBonus -= 1;

  // Elegir stage con bonus aplicado (shift de pesos)
  const adjustedWeights = STAGE_WEIGHTS.map((w, i) => {
    const shift = i - stageBonus;
    if (shift < 0 || shift >= STAGE_WEIGHTS.length) return 5;
    return STAGE_WEIGHTS[shift];
  });
  const deal_stage = rand(DEAL_STAGES, adjustedWeights);
  const stageIdx = stageIndex(deal_stage);

  // Has meeting — correlacionado con stage
  const meetingProb = Math.min(0.95, 0.05 + stageIdx * 0.09);
  const has_meeting = Math.random() < meetingProb;
  const meeting_count = has_meeting ? randInt(1, Math.min(8, stageIdx + 1)) : 0;

  // Days to demo — si tiene meeting
  const days_to_demo = has_meeting ? randInt(1, 45) : null;

  // Amount — correlacionado con seniority y tamaño
  let baseAmount = randInt(5000, 15000);
  if (seniority === "C-Level / VP") baseAmount *= randInt(2, 5);
  if (employees >= 1000) baseAmount *= randInt(2, 4);
  else if (employees >= 500) baseAmount *= randInt(1, 3);
  const amount = stageIdx >= 8 ? Math.round(baseAmount) : (stageIdx >= 4 ? Math.round(baseAmount * 0.7) : null);

  // Close date — solo si está avanzado
  const close_date = stageIdx >= 6 ? randDate(2024, 2026) : null;

  // Deal source (UTM-style)
  const utmMap = {
    "LinkedIn": `linkedin_paid_${rand(["awareness", "conversion", "retargeting"])}`,
    "Facebook": `facebook_paid_${rand(["prospecting", "retargeting", "lookalike"])}`,
    "Instagram": `instagram_paid_${rand(["stories", "feed", "reels"])}`,
    "Google": `google_paid_${rand(["search", "display", "performance_max"])}`,
    "Referral": "referral_organic",
    "Event": `event_${rand(["webinar", "conference", "demo_day"])}`,
    "Organic": "organic_seo",
  };
  const deal_source_of_the_deal = utmMap[inbound_source];

  // Lifecycle y lead status correlacionados con stage
  let lifecycle_stage, lead_status;
  if (stageIdx <= 1) {
    lifecycle_stage = "lead";
    lead_status = rand(["new", "open"]);
  } else if (stageIdx <= 3) {
    lifecycle_stage = "marketing qualified lead";
    lead_status = rand(["in progress", "open"]);
  } else if (stageIdx <= 6) {
    lifecycle_stage = "sales qualified lead";
    lead_status = "open deal";
  } else if (stageIdx <= 8) {
    lifecycle_stage = "opportunity";
    lead_status = "open deal";
  } else if (deal_stage === "won") {
    lifecycle_stage = "customer";
    lead_status = "open deal";
  } else {
    lifecycle_stage = "lead";
    lead_status = rand(["unqualified", "bad timing"]);
  }

  // Nombre y email
  const first_name = rand(FIRST_NAMES);
  const last_name = rand(LAST_NAMES);
  const emailDomain = rand([
    `${company_name_slug(industry, country.name)}.com`,
    `${company_name_slug(industry, country.name)}.com.ar`,
    `${company_name_slug(industry, country.name)}.mx`,
    `${company_name_slug(industry, country.name)}.co`,
    `${company_name_slug(industry, country.name)}.cl`,
    "gmail.com",
    "outlook.com",
  ]);
  const email = `${first_name.toLowerCase().replace(/[áéíóúñ]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n'})[c] || c)}.${last_name.toLowerCase().replace(/[áéíóúñ]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n'})[c] || c)}${randInt(1,99)}@${emailDomain}`;

  // Deal type y pipeline
  const deal_type = stageIdx >= 8 && deal_stage === "won" && Math.random() < 0.2
    ? rand(["Upsell", "Expansion"])
    : "New Business";
  const pipeline = employees >= 500 ? rand(["Enterprise", "Outbound"]) : rand(["Inbound", "Outbound", "Partnerships"]);

  return {
    id,
    email,
    first_name,
    last_name,
    country: country.name,
    city,
    industry,
    number_of_employees: employees,
    annual_revenue,
    job_title,
    seniority,
    deal_stage,
    deal_type,
    pipeline,
    amount,
    close_date,
    inbound_source,
    deal_source_of_the_deal,
    lifecycle_stage,
    lead_status,
    has_meeting,
    meeting_count,
    days_to_demo,
  };
}

function company_name_slug(industry, country) {
  const ind = industry.toLowerCase().replace(/[áéíóú]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'})[c] || c).replace(/\s+/g, "");
  const suffixes = ["corp", "group", "sa", "srl", "inc", "solutions", "tech"];
  return `${ind}${rand(suffixes)}`;
}

// Generar 1000 leads
const leads = Array.from({ length: 1000 }, (_, i) => generateLead(i + 1));

writeFileSync(
  "/Users/asampo/Developer/huckaton/data/leads.json",
  JSON.stringify(leads, null, 2)
);

console.log(`✓ Generados ${leads.length} leads`);
console.log(`  - Con meeting: ${leads.filter(l => l.has_meeting).length}`);
console.log(`  - Deal won: ${leads.filter(l => l.deal_stage === "won").length}`);
console.log(`  - LinkedIn: ${leads.filter(l => l.inbound_source === "LinkedIn").length}`);
console.log(`  - Facebook: ${leads.filter(l => l.inbound_source === "Facebook").length}`);
console.log(`  - Instagram: ${leads.filter(l => l.inbound_source === "Instagram").length}`);
console.log(`  - C-Level/VP: ${leads.filter(l => l.seniority === "C-Level / VP").length}`);
