import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { messages, painPoints, insights, selectedPainPoint } = await req.json();

    if (!messages?.length) {
      return Response.json({ ok: false, error: "No messages provided" }, { status: 400 });
    }

    // Construir contexto con los pain points e insights reales del CRM
    const painPointsSummary = (painPoints || [])
      .map((p) => `• [${p.frequency?.toUpperCase()} / ${p.funnel_stage}] ${p.title}: ${p.description}`)
      .join("\n");

    const insightsSummary = (insights || [])
      .map((i) => `• [Impacto ${i.impact}] ${i.title}: ${i.description} → Acción: ${i.action}`)
      .join("\n");

    const focusPainPoint = selectedPainPoint
      ? (painPoints || []).find((p) => p.id === selectedPainPoint)
      : null;

    const systemPrompt = `Sos un experto en marketing creativo para SaaS B2B, especializado en Humand (plataforma de comunicación y engagement para empleados en HR Tech).

Tenés acceso al análisis real del CRM de Humand:

PAIN POINTS detectados en meetings y llamadas:
${painPointsSummary || "No disponibles aún"}

KEY INSIGHTS del CRM:
${insightsSummary || "No disponibles aún"}

${focusPainPoint ? `PAIN POINT ACTUALMENTE SELECCIONADO: "${focusPainPoint.title}" — ${focusPainPoint.description}` : ""}

Tu rol: ayudar al equipo de marketing a:
- Crear hooks, headlines y copy para anuncios basados en estos pain points
- Sugerir ángulos creativos por plataforma (LinkedIn, Meta, Google)
- Proponer guiones de video cortos (15-30s)
- Estructurar carruseles de LinkedIn
- Generar value propositions y contra-objeciones
- Identificar qué mensajes resuenan según el funnel (TOFU/MOFU/BOFU)

Respondé siempre con ejemplos concretos y listos para usar. Usá formato markdown cuando sea útil. Sé específico con el contexto de Humand.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Convertir historial al formato de Gemini
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    return Response.json({ ok: true, reply });
  } catch (err) {
    console.error("Creatives chat error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
