import { GoogleGenerativeAI } from "@google/generative-ai";

// Instrucciones específicas por plataforma para la segmentación de audiencias
const PLATFORM_INSTRUCTIONS = {
  LinkedIn: `Debés recomendar configuraciones específicas de LinkedIn Campaign Manager:
- Job Titles exactos (usa nombres reales de LinkedIn como "HR Manager", "Chief People Officer", etc.)
- Member Seniority levels: Entry, Associate, Mid-Senior, Director, VP, CXO, Partner, Owner
- Company Size ranges: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001+
- Industries de LinkedIn (categorías exactas de la plataforma)
- Skills relevantes para targetear
- Groups si aplica
- Datos demográficos: rango etario estimado, género si hay sesgo claro
- Ubicaciones: países y ciudades clave
- Retargeting: visitantes al sitio, lista de empresas (Matched Audiences)
- Exclusiones: seniority o industrias que generan leads de baja calidad`,

  Meta: `Debés recomendar configuraciones específicas de Meta Ads Manager:
- Intereses específicos (usa categorías de Meta como "Human Resources", "Business Software", etc.)
- Comportamientos (behaviors): job role, business decision makers, etc.
- Datos demográficos: rango de edad, género, idioma
- Ubicaciones: países, estados/provincias, ciudades con radio
- Lookalike Audiences: basadas en leads de alto score (especificá el source audience y % de similitud)
- Custom Audiences: visitantes a landing page, lista de emails/empresas, engagement audiences
- Exclusiones: audiencias que generan leads de baja calidad
- Placement: Feed, Stories, Reels, Messenger`,

  Google: `Debés recomendar configuraciones específicas de Google Ads:
- Keywords de alta intención (exact match [keyword], phrase match "keyword", broad match +keyword)
- Negative keywords a excluir (que traen leads de baja calidad)
- In-Market Audiences relevantes (ej: "Business Software", "HR Software")
- Custom Intent Audiences: keywords que usan en búsquedas
- Customer Match / Similar Audiences basadas en leads existentes
- Datos demográficos: edad, género, household income
- Ubicaciones: países, ciudades target
- Dispositivos: desktop vs mobile (qué convierte mejor)
- Bid adjustments sugeridos por segmento`,
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { platform, messages, campaignContext } = await req.json();

    if (!platform || !messages?.length) {
      return Response.json({ ok: false, error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Contexto específico de la campaña seleccionada
    const campaignCtx = campaignContext
      ? `
CAMPAÑA SELECCIONADA: "${campaignContext.name}"
Etapa de funnel: ${campaignContext.funnel || "—"} | Región: ${campaignContext.region || "—"}
Fuente de datos: ${campaignContext.dataSource === "crm_real" ? "✅ CRM real de Humand (leads.json con scoring calculado)" : "estimado"}

MÉTRICAS REALES DEL CRM PARA ESTA CAMPAÑA:
- Total leads en esta etapa/plataforma: ${campaignContext.count}
- Score promedio de calidad: ${campaignContext.avgScore}/100
- % con demo agendada: ${campaignContext.pctDemo}%
- Leads de alta calidad (score ≥80): ${campaignContext.highQuality} (${campaignContext.count > 0 ? Math.round((campaignContext.highQuality / campaignContext.count) * 100) : 0}%)
- Deal amount promedio: $${campaignContext.avgAmount?.toLocaleString() || "—"}
- Top industrias: ${campaignContext.industries?.map((i) => i.label).join(", ")}
- Seniority más frecuente: ${campaignContext.seniorities?.map((s) => s.label).join(", ")}
- Tamaño de empresa más común: ${campaignContext.sizes?.map((s) => s.label).join(", ")}
- Regiones/países principales: ${campaignContext.regions?.map((r) => r.label).join(", ")}
- Job titles más frecuentes: ${campaignContext.topTitles?.join(", ")}
- Deal stages más comunes: ${campaignContext.topStages?.join(", ")}
`
      : "No hay campaña específica seleccionada. Respondé con recomendaciones generales para la plataforma.";

    const systemPrompt = `Sos un experto en performance marketing B2B, especializado en campañas de generación de leads para SaaS de HR Tech (plataformas de comunicación y engagement para empleados en empresas medianas y grandes).

Estás analizando data real del CRM de Humand para dar recomendaciones de segmentación y mejora de audiencias en ${platform}.

${campaignCtx}

${PLATFORM_INSTRUCTIONS[platform] || ""}

REGLAS:
- Respondé siempre en español
- Sé muy específico y accionable — nombrá categorías/opciones reales de ${platform}
- Usá listas con bullets y secciones con títulos en negrita
- Cuando hay una campaña seleccionada, todas las recomendaciones deben ser específicas para esa campaña
- Priorizá recomendaciones según impacto esperado en calidad de leads (no en volumen)
- Siempre mencioná qué audiencias o segmentos excluir además de los que incluir`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Convertir historial: Gemini usa "model" en vez de "assistant"
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const reply = result.response.text();

    return Response.json({ ok: true, reply });
  } catch (err) {
    console.error("audiences/chat error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
