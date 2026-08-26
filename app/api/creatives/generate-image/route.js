import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { visual_description, concept, title, format, type } = await req.json();

    if (!visual_description) {
      return Response.json({ ok: false, error: "Falta visual_description" }, { status: 400 });
    }

    const contextLine = type === "video_corto"
      ? `This is the opening frame (thumbnail) of a short video ad.`
      : type === "carrusel"
      ? `This is the first slide of a carousel ad.`
      : type === "gif_animado"
      ? `This is a still frame from an animated GIF ad.`
      : `This is a static image ad.`;

    const prompt = `Generate a professional B2B digital advertisement image for an HR Tech SaaS company called Humand (employee communication and engagement platform). ${contextLine}

Ad concept: ${concept}

Visual brief: ${visual_description}

Style: modern, clean, corporate aesthetic. Dark background (#0f0f0f or deep navy). Purple/violet accent colors. Professional illustration or photography style. No text overlays. High quality, ready for LinkedIn or Meta ads.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    // Extraer la imagen del response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart) throw new Error("No se generó imagen en la respuesta");

    return Response.json({
      ok: true,
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    console.error("generate-image error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
