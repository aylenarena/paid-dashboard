import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  // Recolectar datos del CRM para contexto
  const [transcripts, contacts, companies, deals, meetings] = await Promise.all([
    supabase.from("call_transcripts").select("summary").limit(40),
    supabase.from("contacts").select("job_title, lifecycle_stage").limit(80),
    supabase.from("companies").select("industry, number_of_employees").limit(60),
    supabase.from("deals").select("deal_stage, inbound_source, amount, deal_type").limit(100),
    supabase.from("meetings").select("title").limit(50),
  ]);

  const summaries = (transcripts.data || []).map((t) => t.summary).filter(Boolean).slice(0, 25);
  const meetingTitles = (meetings.data || []).map((m) => m.title).filter(Boolean).slice(0, 20);
  const jobTitles = [...new Set((contacts.data || []).map((c) => c.job_title).filter(Boolean))].slice(0, 15);
  const industries = [...new Set((companies.data || []).map((c) => c.industry).filter(Boolean))].slice(0, 12);

  const stageBreakdown = {};
  (deals.data || []).forEach((d) => {
    stageBreakdown[d.deal_stage] = (stageBreakdown[d.deal_stage] || 0) + 1;
  });
  const sourceBreakdown = {};
  (deals.data || []).forEach((d) => {
    if (d.inbound_source) sourceBreakdown[d.inbound_source] = (sourceBreakdown[d.inbound_source] || 0) + 1;
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Eres un experto en marketing B2B SaaS para HR Tech. Analiza los datos del CRM de Humand (plataforma de comunicación y engagement para empleados) y genera assets estratégicos de marketing listos para usar.

DATOS REALES DEL CRM:
Resúmenes de llamadas: ${summaries.join(" | ")}
Títulos de meetings: ${meetingTitles.join(" | ")}
Job titles de leads: ${jobTitles.join(", ")}
Industrias: ${industries.join(", ")}
Pipeline por etapa: ${JSON.stringify(stageBreakdown)}
Fuentes de leads: ${JSON.stringify(sourceBreakdown)}

Genera 5 pain points detectados en los datos con sus assets de marketing completos. Todos los assets deben resonar directamente con el pain detectado y estar listos para usar en campañas B2B de HR Tech.

Responde SOLO con JSON válido, sin texto adicional ni markdown:
{
  "pain_points": [
    {
      "id": "pp_1",
      "title": "Título corto del pain",
      "description": "Descripción del problema en 2 oraciones concretas",
      "frequency": "alta",
      "segment": "HR Directors en empresas 200-500 empleados",
      "assets": {
        "hooks": [
          "Hook 1 corto y directo para captar atención en los primeros 3 segundos",
          "Hook 2 con pregunta provocadora",
          "Hook 3 con dato sorprendente o estadística"
        ],
        "video_scripts": [
          {
            "title": "Título del video",
            "duration": "30s",
            "script": "[0-5s] Apertura/hook visual: descripción de escena y texto en pantalla\n[5-15s] Desarrollo del problema: cómo mostrarlo\n[15-25s] Solución Humand: qué mostrar\n[25-30s] CTA: texto exacto del llamado a acción"
          },
          {
            "title": "Segundo video alternativo",
            "duration": "60s",
            "script": "[0-5s] Hook: ...\n[5-20s] Pain en detalle: ...\n[20-45s] Demo/solución: ...\n[45-60s] Testimonial + CTA: ..."
          }
        ],
        "carousel_structures": [
          {
            "title": "Título del carrusel (para el equipo de diseño)",
            "slides": [
              "Portada: Pregunta o dato impactante + imagen sugerida",
              "Slide 2: El problema específico — 1 idea, texto corto",
              "Slide 3: Por qué pasa esto — causas",
              "Slide 4: Cómo Humand lo resuelve — 1-2 bullets",
              "Slide 5: Resultado concreto o case — métrica real si aplica",
              "Slide 6 (CTA): Texto exacto + acción"
            ]
          }
        ],
        "headlines": [
          "Headline 1 directo al pain",
          "Headline 2 con beneficio claro",
          "Headline 3 estilo pregunta",
          "Headline 4 con urgencia o consecuencia"
        ],
        "value_propositions": [
          "Value prop 1 completa: [Para X que sufren Y, Humand Z mediante A]",
          "Value prop 2 más corta para ads",
          "Value prop 3 enfocada en ROI"
        ],
        "objection_counters": [
          {
            "objection": "Objeción real que pone el cliente durante la venta",
            "counter": "Contra-argumento específico de Humand con prueba o dato"
          },
          {
            "objection": "Segunda objeción común",
            "counter": "Respuesta con evidencia"
          },
          {
            "objection": "Tercera objeción",
            "counter": "Respuesta"
          }
        ],
        "differentiation_claims": [
          "Claim 1: Qué hace Humand que nadie más hace respecto a este pain",
          "Claim 2: Ventaja competitiva demostrable",
          "Claim 3: Promesa única y medible"
        ]
      }
    }
  ]
}

Genera exactamente 5 pain points. Sé específico, usa lenguaje de negocio real, no genérico.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON en respuesta");
    const data = JSON.parse(match[0]);
    return Response.json({ ok: true, ...data });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
