
import { GoogleGenAI } from "@google/genai";
import { ImageSize, AspectRatio, AIAgent } from "../types";

export const chatWithGemini = async (
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  agent?: AIAgent
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const defaultSystemInstruction = `
    Eres un agente IA multi-plataforma experto llamado "OmniAgent". 
    Tu objetivo es ayudar a negocios a gestionar clientes.
    Tono: Profesional y cercano.
  `;

  const dynamicSystemInstruction = agent 
    ? `
      IDENTIDAD: ${agent.name}
      ROL: ${agent.role}
      DIRECTIVAS PRINCIPALES: ${agent.systemPrompt}
      
      BASE DE CONOCIMIENTO (DATOS REALES DEL NEGOCIO):
      ${agent.knowledgeContent}
      
      ${agent.strictMode ? "REGLA DE ORO: No respondas nada que no esté en la BASE DE CONOCIMIENTO. Si te preguntan algo fuera de esos datos, di: 'Lo siento, no tengo esa información disponible en este momento'." : ""}
      
      RESTRICCIONES CRÍTICAS (NO HACER):
      ${agent.constraints.length > 0 ? agent.constraints.map(c => `- ${c}`).join('\n') : "Ninguna especificada."}
      
      IMPORTANTE: No inventes datos de contacto, precios o fechas si no están arriba.
    `
    : defaultSystemInstruction;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Using Flash for text chat for speed
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: agent?.strictMode ? 0.2 : 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error in chatWithGemini:", error);
    return "Lo siento, tuve un problema procesando tu solicitud.";
  }
};

export const generateAIImage = async (prompt: string, size: ImageSize, ratio: AspectRatio) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    // User requested "Nano Banana" which maps to gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: ratio,
          // imageSize is not supported in flash-image, so we omit it or it acts as hint
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw error;
  }
};
