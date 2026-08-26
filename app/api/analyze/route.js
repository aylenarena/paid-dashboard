import Anthropic from "@anthropic-ai/sdk";
import { fetchLeadData } from "@/lib/fetchLeadData";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a B2B lead quality analyst. Analyze the CRM data provided and return ONLY a valid JSON object with this exact structure:
{
  "summary": { "total_leads": number, "demos_booked": number, "sql": number },
  "icp_patterns": [ { "industry": string, "title": string, "company_size": string, "region": string, "score": number } ],
  "recommendations": [ { "action": "Scale" | "Pause", "campaign": string, "reason": string } ],
  "insight": string
}
Return only JSON. No markdown, no explanation.`;

export async function POST() {
  try {
    const leadData = await fetchLeadData();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-0",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the current CRM data:\n\n${JSON.stringify(leadData, null, 2)}`,
        },
      ],
    });

    const message = await stream.finalMessage();

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const analysis = JSON.parse(rawText);

    return Response.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("analyze route error:", err);
    return Response.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
